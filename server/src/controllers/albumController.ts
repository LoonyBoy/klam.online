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

/**
 * Получить события альбомов с фильтрацией для отчётов
 */
export async function getFilteredEvents(req: Request, res: Response) {
  try {
    const { companyId } = req.params;
    const { dateFrom, dateTo, projectId, statusId, userId } = req.query;

    let query = `
      SELECT 
        ae.id,
        ae.comment,
        ae.created_at,
        ae.source,
        a.id as albumId,
        a.name as albumName,
        a.code as albumCode,
        p.id as projectId,
        p.name as projectName,
        p.code as projectCode,
        ast.id as statusId,
        ast.code as statusCode,
        ast.name as statusName,
        COALESCE(u.first_name, part.first_name) as createdByFirstName,
        COALESCE(u.last_name, part.last_name) as createdByLastName,
        COALESCE(u.id, part.id) as createdById,
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
      WHERE p.company_id = ?`;

    const params: any[] = [companyId];

    if (dateFrom) {
      query += ` AND ae.created_at >= ?`;
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ` AND ae.created_at <= ?`;
      params.push(dateTo);
    }

    if (projectId && projectId !== 'all') {
      query += ` AND p.id = ?`;
      params.push(projectId);
    }

    if (statusId && statusId !== 'all') {
      query += ` AND ast.id = ?`;
      params.push(statusId);
    }

    if (userId && userId !== 'all') {
      query += ` AND (u.id = ? OR part.id = ?)`;
      params.push(userId, userId);
    }

    query += ` ORDER BY ae.created_at DESC LIMIT 100`;

    const [events] = await pool.query<RowDataPacket[]>(query, params);

    // Форматируем результат
    const formattedEvents = events.map(row => ({
      id: row.id,
      album: {
        id: row.albumId,
        name: row.albumName,
        code: row.albumCode
      },
      project: {
        id: row.projectId,
        name: row.projectName,
        code: row.projectCode
      },
      status: {
        id: row.statusId,
        code: row.statusCode,
        name: row.statusName
      },
      comment: row.comment,
      createdBy: {
        id: row.createdById,
        firstName: row.createdByFirstName,
        lastName: row.createdByLastName,
        role: row.createdByRole
      },
      createdAt: row.created_at,
      source: row.source
    }));

    res.json({ events: formattedEvents, total: formattedEvents.length });
  } catch (error) {
    console.error('❌ Ошибка при получении отфильтрованных событий:', error);
    res.status(500).json({ 
      error: 'Failed to fetch filtered events',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/companies/:companyId/projects/:projectId/albums
 * Получить альбомы проекта
 */
export async function getProjectAlbums(req: Request, res: Response) {
  try {
    const { companyId, projectId } = req.params;
    const category = req.query.category as string; // 'СВОК ПД' или 'СВОК РД'
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    console.log('📥 Запрос альбомов проекта:', { companyId, projectId, category, userId });

    // Проверяем доступ к проекту
    const [projects] = await pool.query<RowDataPacket[]>(
      `SELECT p.id 
       FROM projects p
       WHERE p.id = ? AND p.company_id = ?`,
      [projectId, companyId]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Получаем альбомы проекта
    let query = `
      SELECT 
        a.id,
        a.name,
        a.code,
        a.deadline,
        a.comment,
        a.link,
        a.created_at,
        a.updated_at,
        d.id as department_id,
        d.name as department_name,
        d.code as department_code,
        exec.id as executor_id,
        exec.first_name as executor_first_name,
        exec.last_name as executor_last_name,
        exec.telegram_username as executor_telegram,
        cust.id as customer_id,
        cust.first_name as customer_first_name,
        cust.last_name as customer_last_name,
        cust.telegram_username as customer_telegram,
        ast.id as status_id,
        ast.code as status_code,
        ast.name as status_name
      FROM albums a
      LEFT JOIN departments d ON a.department_id = d.id
      LEFT JOIN participants exec ON a.executor_id = exec.id
      LEFT JOIN participants cust ON a.customer_id = cust.id
      LEFT JOIN album_statuses ast ON a.status_id = ast.id
      WHERE a.project_id = ?
    `;

    const params: any[] = [projectId];

    // Фильтр по категории (через код альбома)
    if (category) {
      if (category === 'СВОК ПД') {
        // ПД альбомы обычно имеют коды: ПЗ, ПЗУ, АР, КР и т.д.
        query += ` AND a.code REGEXP '^(ПЗ|ПЗУ|АР|КР|ИОС|ОВ|ВК|СС|ТХ|ПОС|ООС|ПБ|ОДИ)'`;
      } else if (category === 'СВОК РД') {
        // РД альбомы имеют коды с буквами после точки
        query += ` AND a.code REGEXP '\\.'`;
      }
    }

    query += ` ORDER BY d.name, a.code`;

    const [albums] = await pool.query<RowDataPacket[]>(query, params);

    // Форматируем результат
    const formattedAlbums = albums.map(row => ({
      id: row.id.toString(),
      name: row.name,
      code: row.code,
      department: row.department_name || '',
      departmentCode: row.department_code || '',
      executor: row.executor_first_name && row.executor_last_name 
        ? `${row.executor_first_name} ${row.executor_last_name}`.trim()
        : '',
      executorId: row.executor_id?.toString() || '',
      customer: row.customer_first_name && row.customer_last_name
        ? `${row.customer_first_name} ${row.customer_last_name}`.trim()
        : '',
      customerId: row.customer_id?.toString() || '',
      deadline: row.deadline,
      status: row.status_name || '',
      statusCode: row.status_code || '',
      albumLink: row.link || '',
      comment: row.comment || '',
      category: category || 'СВОК ПД', // Временно возвращаем переданную категорию
      projectId: projectId
    }));

    console.log(`✅ Найдено альбомов: ${formattedAlbums.length}`);

    res.json({
      success: true,
      albums: formattedAlbums
    });

  } catch (error) {
    console.error('❌ Error in getProjectAlbums:', error);
    console.error('❌ Stack:', error instanceof Error ? error.stack : 'No stack');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project albums',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * GET /api/companies/:companyId/album-templates
 * Получить список шаблонов альбомов компании
 */
export async function getAlbumTemplates(req: Request, res: Response) {
  try {
    const { companyId } = req.params;
    const userId = req.user?.id;

    console.log(`📋 Fetching album templates for company ${companyId}, userId: ${userId}`);

    // Проверяем права доступа пользователя к компании
    const [access] = await pool.query<RowDataPacket[]>(
      `SELECT role_in_company FROM company_users 
       WHERE company_id = ? AND user_id = ?`,
      [companyId, userId]
    );

    console.log(`🔐 Access check result:`, access);

    if (!access || access.length === 0) {
      console.log(`❌ Access denied: user ${userId} not found in company ${companyId}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied to this company'
      });
    }

    // Получаем шаблоны альбомов с элементами
    const [templates] = await pool.query<RowDataPacket[]>(
      `SELECT 
        t.id,
        t.name as template_name,
        t.created_at,
        i.id as item_id,
        i.name as item_name,
        i.code as item_code,
        i.department_id,
        d.code as department_code,
        d.name as department_name,
        i.default_status_id,
        i.default_deadline_days
       FROM album_templates t
       LEFT JOIN album_template_items i ON i.template_id = t.id
       LEFT JOIN departments d ON d.id = i.department_id
       WHERE t.company_id = ?
       ORDER BY t.name, i.code`,
      [companyId]
    );

    // Группируем элементы по шаблонам
    const templatesMap = new Map<string, any>();

    templates.forEach(row => {
      const templateId = row.id.toString();
      
      if (!templatesMap.has(templateId)) {
        templatesMap.set(templateId, {
          id: templateId,
          name: row.template_name,
          createdAt: row.created_at,
          items: []
        });
      }

      // Добавляем элемент, если он существует
      if (row.item_id) {
        templatesMap.get(templateId).items.push({
          id: row.item_id.toString(),
          name: row.item_name,
          code: row.item_code,
          departmentId: row.department_id?.toString() || '',
          departmentCode: row.department_code || '',
          departmentName: row.department_name || '',
          defaultStatusId: row.default_status_id?.toString() || null,
          defaultDeadlineDays: row.default_deadline_days || null
        });
      }
    });

    const formattedTemplates = Array.from(templatesMap.values());

    console.log(`✅ Найдено шаблонов: ${formattedTemplates.length}`);

    res.json({
      success: true,
      templates: formattedTemplates
    });

  } catch (error) {
    console.error('❌ Error in getAlbumTemplates:', error);
    console.error('❌ Stack:', error instanceof Error ? error.stack : 'No stack');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch album templates',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

