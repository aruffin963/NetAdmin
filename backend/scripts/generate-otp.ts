import { pool } from '../src/config/database';
import speakeasy from 'speakeasy';

async function generateCurrentOTP() {
  try {
    const result = await pool.query(
      'SELECT id, username, two_fa_secret FROM users WHERE username = $1',
      ['admin']
    );

    if (result.rows.length === 0) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }

    const user = result.rows[0];
    
    if (!user.two_fa_secret) {
      console.log('❌ 2FA secret not configured for admin');
      process.exit(1);
    }

    // Generate current OTP
    const currentTime = Math.floor(Date.now() / 1000);
    const otpCode = speakeasy.totp({
      secret: user.two_fa_secret,
      encoding: 'base32',
      time: currentTime
    });

    console.log('\n✅ Current OTP code for admin (admin):');
    console.log(`\n🔐 OTP: ${otpCode}`);
    console.log('\n⏰ This code is valid for ~30 seconds from now');
    console.log('🔄 Run this script again if your code expires\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateCurrentOTP();
