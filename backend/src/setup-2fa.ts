import { DatabaseService, pool } from './config/database';

async function setupTwoFactorTables() {
  try {
    console.log('🔄 Setting up 2FA tables...');

    const queries = [
      `CREATE TABLE IF NOT EXISTS user_totp_settings (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        totp_secret VARCHAR(255) NOT NULL,
        totp_enabled BOOLEAN DEFAULT FALSE,
        backup_codes_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_verified_at TIMESTAMP
      );`,

      `CREATE TABLE IF NOT EXISTS user_backup_codes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code VARCHAR(255) NOT NULL UNIQUE,
        used BOOLEAN DEFAULT FALSE,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      );`,

      `CREATE TABLE IF NOT EXISTS totp_login_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        verified BOOLEAN DEFAULT FALSE,
        ip_address VARCHAR(45),
        user_agent TEXT,
        attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP
      );`,

      `CREATE INDEX IF NOT EXISTS idx_user_totp_settings_user_id ON user_totp_settings(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_user_backup_codes_user_id ON user_backup_codes(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_user_backup_codes_code ON user_backup_codes(code);`,
      `CREATE INDEX IF NOT EXISTS idx_user_backup_codes_used ON user_backup_codes(used);`,
      `CREATE INDEX IF NOT EXISTS idx_totp_login_history_user_id ON totp_login_history(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_totp_login_history_verified ON totp_login_history(verified);`,
      `CREATE INDEX IF NOT EXISTS idx_totp_login_history_attempt_at ON totp_login_history(attempt_at DESC);`
    ];

    for (const query of queries) {
      try {
        await DatabaseService.query(query);
        console.log(`✅ Executed: ${query.substring(0, 50)}...`);
      } catch (error: any) {
        console.error(`❌ Failed: ${error.message}`);
      }
    }

    console.log('✨ 2FA tables setup complete!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupTwoFactorTables();
