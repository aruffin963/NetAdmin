import { pool } from '../src/config/database';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';

async function resetAndCreateAdmin() {
  try {
    console.log('\n🔄 Starting admin user reset...\n');

    // Step 1: Delete all users
    console.log('🗑️  Deleting all users from database...');
    const deleteResult = await pool.query('DELETE FROM users');
    console.log(`✅ Deleted ${deleteResult.rowCount} users`);

    // Step 2: Generate secure password
    const newPassword = 'Admin@Netadmin123!Security2026';
    console.log('\n🔐 Generated admin password');

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Step 3: Generate 2FA secret
    const secret = speakeasy.generateSecret({
      name: 'Netadmin (admin@netadmin.local)',
      issuer: 'Netadmin',
      length: 32
    });

    // Step 4: Create new admin user
    console.log('\n👤 Creating new admin user...');
    const createResult = await pool.query(
      `INSERT INTO users (
        email, 
        username,
        password, 
        name,
        two_fa_enabled, 
        two_fa_secret,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING id, email, username, name, two_fa_enabled`,
      ['admin@netadmin.local', 'admin', hashedPassword, 'Administrator', true, secret.base32]
    );

    const adminUser = createResult.rows[0];
    console.log('✅ Admin user created successfully');

    // Step 5: Generate current OTP
    const currentOTP = speakeasy.totp({
      secret: secret.base32,
      encoding: 'base32'
    });

    // Display credentials
    console.log('\n' + '='.repeat(60));
    console.log('📋 ADMIN CREDENTIALS');
    console.log('='.repeat(60));
    console.log(`\nEmail:    ${adminUser.email}`);
    console.log(`Username: ${adminUser.username}`);
    console.log(`Password: ${newPassword}`);
    console.log(`\n2FA Enabled: ${adminUser.two_fa_enabled}`);
    console.log(`\n🔐 2FA Secret (base32):`);
    console.log(`${secret.base32}`);
    console.log(`\n📱 Provisioning URI (scan with authenticator app):`);
    console.log(`${secret.otpauth_url}`);
    console.log(`\n🧪 Current OTP code for testing:`);
    console.log(`${currentOTP}`);
    console.log('\n' + '='.repeat(60));

    console.log('\n✨ Admin setup completed successfully!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAndCreateAdmin();
