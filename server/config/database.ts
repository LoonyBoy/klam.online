/**
 * Database Configuration
 * Configuration for MySQL connection
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  charset: string;
  timezone: string;
  connectionLimit: number;
  connectTimeout: number;
  acquireTimeout: number;
  waitForConnections: boolean;
  queueLimit: number;
}

const config: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'klamonline',
  charset: 'utf8mb4',
  timezone: '+00:00',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  connectTimeout: 10000,
  acquireTimeout: 10000,
  waitForConnections: true,
  queueLimit: 0,
};

export default config;
