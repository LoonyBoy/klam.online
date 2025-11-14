import { pool } from '../src/db';

async function checkSchema() {
  try {
    const [rows] = await pool.query('DESCRIBE companies');
    console.log('Companies table structure:');
    console.table(rows);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSchema();
