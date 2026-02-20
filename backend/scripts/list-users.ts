import { pool } from '../src/config/database';

async function listUsers() {
  try {
    const result = await pool.query(
      'SELECT id, username, email, two_fa_enabled FROM users LIMIT 20'
    );

    console.log('\n📋 Users in database:');
    if (result.rows.length === 0) {
      console.log('❌ No users found');
    } else {
      console.table(result.rows);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listUsers();
