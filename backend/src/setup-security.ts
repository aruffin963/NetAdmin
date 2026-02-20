import { DatabaseService, pool } from './config/database';

async function setupSecurityTables() {
  try {
    console.log('🔄 Setting up security tables...');

    const queries = [
      `CREATE TABLE IF NOT EXISTS login_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ip_address VARCHAR(45),
        user_agent TEXT,
        method VARCHAR(20) NOT NULL, -- 'session' or 'jwt'
        success BOOLEAN DEFAULT true,
        failure_reason TEXT,
        login_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        logout_at TIMESTAMP,
        country VARCHAR(100),
        city VARCHAR(100),
        device_name VARCHAR(255)
      );`,

      `CREATE TABLE IF NOT EXISTS password_change_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,

      `CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_login_history_login_at ON login_history(login_at DESC);`,
      `CREATE INDEX IF NOT EXISTS idx_password_change_history_user_id ON password_change_history(user_id);`
    ];

    for (const query of queries) {
      try {
        await DatabaseService.query(query);
        console.log(`✅ Executed: ${query.substring(0, 50)}...`);
      } catch (error: any) {
        console.error(`❌ Failed: ${error.message}`);
      }
    }

    console.log('✨ Security tables setup complete!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupSecurityTables();
