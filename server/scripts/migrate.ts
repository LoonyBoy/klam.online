/**
 * Database Migration Script
 * Applies all SQL migration files from the migrations directory
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
};

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

  let connection: mysql.Connection | null = null;

  try {
    // Create connection without specifying database
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Connected to MySQL server\n');

    // Get migration files
    const migrationsDir = join(__dirname, '..', 'migrations');
    const files = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('⚠ No migration files found');
      return;
    }

    console.log(`Found ${files.length} migration file(s):\n`);

    // Execute each migration file
    for (const file of files) {
      console.log(`📄 Executing: ${file}`);
      const filePath = join(migrationsDir, file);
      const sql = readFileSync(filePath, 'utf8');

      try {
        await connection.query(sql);
        console.log(`✓ ${file} completed successfully\n`);
      } catch (error: any) {
        console.error(`✗ Error in ${file}:`, error.message);
        throw error;
      }
    }

    console.log('✓ All migrations completed successfully!');
  } catch (error: any) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Connection closed');
    }
  }
}

// Run migrations
runMigrations();
