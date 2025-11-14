import { Request, Response } from 'express';
import pool from '../db';
import { RowDataPacket } from 'mysql2';

/**
 * Получить всех пользователей компании с их ролями и отделами
 */
export const getCompanyUsers = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    // Получаем всех пользователей компании
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        u.id,
        u.telegram_id,
        u.telegram_username,
        u.first_name,
        u.last_name,
        u.email,
        cu.role_in_company
      FROM users u
      INNER JOIN company_users cu ON u.id = cu.user_id
      WHERE cu.company_id = ?
      ORDER BY u.first_name, u.last_name`,
      [companyId]
    );

    // Для каждого пользователя получаем информацию об участии (participants)
    const usersWithDetails = await Promise.all(
      rows.map(async (row: any) => {
        // Ищем участника по telegram_id
        const [participantRows] = await pool.query<RowDataPacket[]>(
          `SELECT 
            p.id,
            p.role_type
          FROM participants p
          WHERE p.company_id = ? AND p.telegram_id = ?
          LIMIT 1`,
          [companyId, row.telegram_id]
        );

        const participant = participantRows[0];
        
        // Если участник найден, получаем отдел из альбомов
        let department = null;
        if (participant) {
          const [albumRows] = await pool.query<RowDataPacket[]>(
            `SELECT 
              d.id,
              d.code,
              d.name
            FROM albums a
            INNER JOIN departments d ON a.department_id = d.id
            WHERE (a.executor_id = ? OR a.customer_id = ?)
            LIMIT 1`,
            [participant.id, participant.id]
          );
          
          if (albumRows.length > 0) {
            department = {
              id: albumRows[0].id,
              code: albumRows[0].code,
              name: albumRows[0].name
            };
          }
        }

        return {
          id: row.id,
          telegramId: row.telegram_id,
          telegramUsername: row.telegram_username,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          roleInCompany: row.role_in_company,
          roleType: participant?.role_type || null, // executor | customer
          department
        };
      })
    );

    res.json({ users: usersWithDetails });
  } catch (error) {
    console.error('❌ Error fetching company users:', error);
    res.status(500).json({ error: 'Failed to fetch company users' });
  }
};

/**
 * Получить статистику по пользователям компании
 */
export const getCompanyUsersStats = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    // Общее количество пользователей
    const [totalRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total
       FROM company_users
       WHERE company_id = ?`,
      [companyId]
    );

    // Количество исполнителей (участников с role_type = 'executor')
    const [executorsRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT p.id) as total
       FROM participants p
       INNER JOIN company_users cu ON p.telegram_id = (
         SELECT telegram_id FROM users WHERE id = cu.user_id
       )
       WHERE p.company_id = ? 
       AND p.role_type = 'executor'
       AND p.is_active = TRUE`,
      [companyId]
    );

    // Количество заказчиков (участников с role_type = 'customer')
    const [customersRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT p.id) as total
       FROM participants p
       INNER JOIN company_users cu ON p.telegram_id = (
         SELECT telegram_id FROM users WHERE id = cu.user_id
       )
       WHERE p.company_id = ? 
       AND p.role_type = 'customer'
       AND p.is_active = TRUE`,
      [companyId]
    );

    res.json({
      totalUsers: totalRows[0]?.total || 0,
      executors: executorsRows[0]?.total || 0,
      customers: customersRows[0]?.total || 0
    });
  } catch (error) {
    console.error('❌ Error fetching company users stats:', error);
    res.status(500).json({ error: 'Failed to fetch company users stats' });
  }
};
