import { Request, Response } from 'express';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2';

/**
 * GET /api/companies/:companyId/albums/statistics
 * Получить статистику по альбомам компании
 */
export async function getAlbumsStatistics(req: Request, res: Response) {
  try {
    const { companyId } = req.params;

    // Получаем статистику по замечаниям
    const [remarksStats] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as activeRemarks
       FROM albums a
       INNER JOIN projects p ON a.project_id = p.id
       INNER JOIN album_statuses ast ON a.status_id = ast.id
       WHERE p.company_id = ? AND ast.code = 'remarks'`,
      [companyId]
    );

    const activeRemarks = remarksStats[0]?.activeRemarks || 0;

    res.json({ activeRemarks });
  } catch (error) {
    console.error('❌ Ошибка при получении статистики по альбомам:', error);
    res.status(500).json({ 
      error: 'Failed to fetch albums statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/companies/:companyId/albums/deadlines
 * Получить список альбомов с ближайшими дедлайнами
 */
export async function getUpcomingDeadlines(req: Request, res: Response) {
  try {
    const { companyId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    // Получаем альбомы с дедлайнами, отсортированные по дате
    const [deadlines] = await pool.query<RowDataPacket[]>(
      `SELECT 
        a.id,
        a.name as albumName,
        a.code as albumCode,
        a.deadline,
        p.id as projectId,
        p.name as projectName,
        p.code as projectCode,
        d.code as departmentCode,
        d.name as departmentName,
        ast.code as statusCode,
        ast.name as statusName,
        DATEDIFF(a.deadline, CURDATE()) as daysUntilDeadline
       FROM albums a
       INNER JOIN projects p ON a.project_id = p.id
       INNER JOIN departments d ON a.department_id = d.id
       INNER JOIN album_statuses ast ON a.status_id = ast.id
       WHERE p.company_id = ? 
         AND a.deadline IS NOT NULL
         AND ast.code NOT IN ('accepted', 'production')
       ORDER BY a.deadline ASC
       LIMIT ?`,
      [companyId, limit]
    );

    // Форматируем результат
    const formattedDeadlines = deadlines.map(row => ({
      id: row.id,
      albumName: row.albumName,
      albumCode: row.albumCode,
      projectName: row.projectName,
      projectCode: row.projectCode,
      deadline: row.deadline,
      daysUntilDeadline: row.daysUntilDeadline,
      department: {
        code: row.departmentCode,
        name: row.departmentName
      },
      status: {
        code: row.statusCode,
        name: row.statusName
      },
      isOverdue: row.daysUntilDeadline < 0
    }));

    res.json(formattedDeadlines);
  } catch (error) {
    console.error('❌ Ошибка при получении дедлайнов:', error);
    res.status(500).json({ 
      error: 'Failed to fetch deadlines',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/companies/:companyId/albums/events
 * Получить последние события по альбомам компании
 */
export async function getRecentEvents(req: Request, res: Response) {
  try {
    const { companyId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    // Получаем последние события
    const [events] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ae.id,
        ae.comment,
        ae.created_at,
        ae.source,
        a.name as albumName,
        a.code as albumCode,
        p.name as projectName,
        ast.code as statusCode,
        ast.name as statusName,
        COALESCE(u.first_name, part.first_name) as createdByFirstName,
        COALESCE(u.last_name, part.last_name) as createdByLastName,
        CASE 
          WHEN ae.created_by_user_id IS NOT NULL THEN 'member'
          WHEN part.role_type = 'customer' THEN 'customer'
          ELSE 'executor'
        END as createdByRole
       FROM album_events ae
       INNER JOIN albums a ON ae.album_id = a.id
       INNER JOIN projects p ON a.project_id = p.id
       INNER JOIN album_statuses ast ON ae.status_id = ast.id
       LEFT JOIN users u ON ae.created_by_user_id = u.id
       LEFT JOIN participants part ON ae.created_by_participant_id = part.id
       WHERE p.company_id = ?
       ORDER BY ae.created_at DESC
       LIMIT ?`,
      [companyId, limit]
    );

    // Форматируем результат
    const formattedEvents = events.map(row => ({
      id: row.id,
      albumName: row.albumName,
      albumCode: row.albumCode,
      projectName: row.projectName,
      status: {
        code: row.statusCode,
        name: row.statusName
      },
      comment: row.comment,
      createdBy: {
        firstName: row.createdByFirstName,
        lastName: row.createdByLastName,
        role: row.createdByRole
      },
      createdAt: row.created_at,
      source: row.source
    }));

    res.json(formattedEvents);
  } catch (error) {
    console.error('❌ Ошибка при получении событий:', error);
    res.status(500).json({ 
      error: 'Failed to fetch events',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
