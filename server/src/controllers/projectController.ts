import { Request, Response } from 'express';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2';

/**
 * GET /api/companies/:companyId/projects
 * Получить проекты компании
 */
export async function getCompanyProjects(req: Request, res: Response) {
  try {
    const { companyId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    console.log('📥 Запрос проектов компании:', { companyId, userId });

    // Проверяем, что пользователь является членом компании
    const [userCompanies] = await pool.query<RowDataPacket[]>(
      `SELECT cu.role_in_company
       FROM company_users cu
       WHERE cu.company_id = ? AND cu.user_id = ?`,
      [companyId, userId]
    );

    if (userCompanies.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Получаем проекты компании
    const [projects] = await pool.query<RowDataPacket[]>(
      `SELECT 
        p.id,
        p.name,
        p.code,
        p.customer_company_name,
        p.created_at,
        p.updated_at,
        u.id as owner_id,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        u.telegram_username as owner_username
       FROM projects p
       LEFT JOIN users u ON p.owner_user_id = u.id
       WHERE p.company_id = ?
       ORDER BY p.created_at DESC`,
      [companyId]
    );

    // Для каждого проекта получаем статистику альбомов
    const projectsWithStats = await Promise.all(
      projects.map(async (project: any) => {
        const [albumStats] = await pool.query<RowDataPacket[]>(
          `SELECT 
            COUNT(*) as total_albums,
            SUM(CASE WHEN status_id IN (SELECT id FROM album_statuses WHERE name IN ('В работе', 'На проверке')) THEN 1 ELSE 0 END) as active_albums
           FROM albums
           WHERE project_id = ?`,
          [project.id]
        );

        const stats = albumStats[0] || { total_albums: 0, active_albums: 0 };

        return {
          id: project.id.toString(),
          name: project.name,
          code: project.code,
          customerCompanyName: project.customer_company_name,
          createdAt: project.created_at,
          updatedAt: project.updated_at,
          owner: project.owner_id ? {
            id: project.owner_id.toString(),
            firstName: project.owner_first_name,
            lastName: project.owner_last_name,
            username: project.owner_username
          } : null,
          stats: {
            totalAlbums: parseInt(stats.total_albums || 0),
            activeAlbums: parseInt(stats.active_albums || 0)
          }
        };
      })
    );

    console.log(`✅ Найдено проектов: ${projects.length}`);

    res.json({
      success: true,
      projects: projectsWithStats
    });

  } catch (error) {
    console.error('❌ Error in getCompanyProjects:', error);
    console.error('❌ Stack:', error instanceof Error ? error.stack : 'No stack');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
