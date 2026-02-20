import { pool } from '../src/config/database';
import speakeasy from 'speakeasy';

async function setupAdmin() {
  try {
    // Find admin user by email
    const getUserResult = await pool.query(
      'SELECT id, email, username, two_fa_enabled, two_fa_secret FROM users WHERE email = $1',
      ['admin']
    );

    if (getUserResult.rows.length === 0) {
      console.log('❌ Admin user (email: admin) not found');
      process.exit(1);
    }

    let user = getUserResult.rows[0];
    console.log('👤 Admin user found:', { id: user.id, email: user.email, username: user.username });

    // Update username if not set
    if (!user.username) {
      const updateResult = await pool.query(
        'UPDATE users SET username = $1 WHERE id = $2 RETURNING id, email, username',
        ['admin', user.id]
      );
      user = updateResult.rows[0];
      console.log('✅ Username updated to: admin');
    }

    // Generate 2FA secret
    const secret = speakeasy.generateSecret({
      name: `Netadmin (${user.email})`,
      issuer: 'Netadmin',
      length: 32
    });

    // Enable 2FA and save secret
    const updateResult = await pool.query(
      'UPDATE users SET two_fa_enabled = true, two_fa_secret = $1 WHERE id = $2 RETURNING id, email, username, two_fa_enabled',
      [secret.base32, user.id]
    );

    console.log('\n✅ 2FA enabled for admin user');
    console.log('Updated user:', updateResult.rows[0]);

    console.log('\n🔐 2FA Secret (base32):');
    console.log(secret.base32);

    console.log('\n📱 Provisioning URI (scan with authenticator app):');
    console.log(secret.otpauth_url);

    // Generate a test OTP
    const testOTP = speakeasy.totp({
      secret: secret.base32,
      encoding: 'base32'
    });
    console.log('\n🧪 Current OTP code for testing:');
    console.log(testOTP);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupAdmin();
