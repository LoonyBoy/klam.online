import { Request, Response } from 'express';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2';

/**
 * GET /api/dictionaries/departments
 * Получить список всех отделов
 */
export async function getDepartments(req: Request, res: Response) {
  try {
    const [departments] = await pool.query<RowDataPacket[]>(
      `SELECT id, code, name, sort_order 
       FROM departments 
       ORDER BY sort_order`
    );

    res.json({ departments });
  } catch (error) {
    console.error('❌ Ошибка при получении отделов:', error);
    res.status(500).json({
      error: 'Failed to fetch departments',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/dictionaries/statuses
 * Получить список всех статусов альбомов
 */
export async function getAlbumStatuses(req: Request, res: Response) {
  try {
    const [statuses] = await pool.query<RowDataPacket[]>(
      `SELECT id, code, name, color_hex 
       FROM album_statuses 
       ORDER BY id`
    );

    res.json({ statuses });
  } catch (error) {
    console.error('❌ Ошибка при получении статусов:', error);
    res.status(500).json({
      error: 'Failed to fetch statuses',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
