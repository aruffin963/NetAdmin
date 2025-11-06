import { DatabaseService } from './config/database';

async function checkUsersTable() {
  try {
    const result = await DatabaseService.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'users' 
       ORDER BY ordinal_position`
    );
    
    console.log('Users table structure:');
    console.log(JSON.stringify(result.rows, null, 2));
    
    // Check if table exists
    if (result.rows.length === 0) {
      console.log('Users table does not exist yet.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkUsersTable();
