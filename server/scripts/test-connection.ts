/**
 * Test Database Connection
 * Simple script to verify database connection
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'klamonline',
};

async function testConnection() {
  console.log('🔌 Testing database connection...\n');
  console.log('Configuration:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  User: ${config.user}`);
  console.log(`  Database: ${config.database}`);
  console.log('');

  let connection: mysql.Connection | null = null;

  try {
    // Connect to database
    connection = await mysql.createConnection(config);
    console.log('✓ Connected to MySQL server\n');

    // Test query
    const [rows] = await connection.query('SELECT VERSION() as version');
    const version = (rows as any)[0].version;
    console.log(`✓ MySQL version: ${version}\n`);

    // Check if database exists
    const [databases] = await connection.query(
      'SHOW DATABASES LIKE ?',
      [config.database]
    );
    
    if ((databases as any[]).length > 0) {
      console.log(`✓ Database '${config.database}' exists\n`);

      // Get table count
      const [tables] = await connection.query(
        `SELECT COUNT(*) as count FROM information_schema.tables 
         WHERE table_schema = ?`,
        [config.database]
      );
      const tableCount = (tables as any)[0].count;
      console.log(`✓ Tables in database: ${tableCount}\n`);

      if (tableCount > 0) {
        // List tables
        const [tableList] = await connection.query(
          `SELECT table_name FROM information_schema.tables 
           WHERE table_schema = ? 
           ORDER BY table_name`,
          [config.database]
        );
        console.log('Tables:');
        (tableList as any[]).forEach(table => {
          console.log(`  - ${table.table_name}`);
        });
      } else {
        console.log('⚠️  No tables found. Run migrations: npm run db:migrate');
      }
    } else {
      console.log(`⚠️  Database '${config.database}' does not exist`);
      console.log('💡 Run: npm run db:reset && npm run db:migrate');
    }

    console.log('\n✅ Connection test successful!');
  } catch (error: any) {
    console.error('\n❌ Connection test failed!');
    console.error('\nError:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Check your database credentials in .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure MySQL server is running');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Database does not exist. Run: npm run db:reset && npm run db:migrate');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Connection closed');
    }
  }
}

testConnection();
