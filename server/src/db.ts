/**
 * Database Connection Pool
 * MySQL connection pool using mysql2
 */

import mysql from 'mysql2/promise';
import dbConfig from '../config/database';

// Create connection pool
const pool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  charset: dbConfig.charset,
  timezone: dbConfig.timezone,
  connectionLimit: dbConfig.connectionLimit,
  connectTimeout: dbConfig.connectTimeout,
  waitForConnections: dbConfig.waitForConnections,
  queueLimit: dbConfig.queueLimit,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    console.log('✓ Database connection established successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    return false;
  }
}

/**
 * Get a connection from the pool
 */
export async function getConnection() {
  return pool.getConnection();
}

/**
 * Execute a query
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Close all connections in the pool
 */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('✓ Database connection pool closed');
}

export default pool;
