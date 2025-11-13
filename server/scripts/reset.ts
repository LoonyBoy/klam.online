/**
 * Database Reset Script
 * Drops and recreates the database schema
 * WARNING: This will delete all data!
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import * as readline from 'readline';

// Load environment variables
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

const dbName = process.env.DB_NAME || 'klamonline';

async function askConfirmation(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(
      `⚠️  WARNING: This will DROP the database "${dbName}" and all its data!\nAre you sure? (yes/no): `,
      answer => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes');
      }
    );
  });
}

async function resetDatabase() {
  console.log('🔄 Database Reset Script\n');

  // Skip confirmation in CI/CD or if FORCE_RESET is set
  if (process.env.FORCE_RESET !== 'true') {
    const confirmed = await askConfirmation();
    if (!confirmed) {
      console.log('❌ Reset cancelled');
      process.exit(0);
    }
  }

  let connection: mysql.Connection | null = null;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('\n✓ Connected to MySQL server\n');

    // Drop database if exists
    console.log(`🗑️  Dropping database: ${dbName}`);
    await connection.query(`DROP DATABASE IF EXISTS ${dbName}`);
    console.log('✓ Database dropped\n');

    // Create database
    console.log(`🏗️  Creating database: ${dbName}`);
    await connection.query(
      `CREATE DATABASE ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log('✓ Database created\n');

    console.log('✓ Database reset completed successfully!');
    console.log('\n💡 Run "npm run db:migrate" to apply migrations');
  } catch (error: any) {
    console.error('✗ Reset failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run reset
resetDatabase();
