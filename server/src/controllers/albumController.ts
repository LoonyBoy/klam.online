import { Request, Response } from 'express';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2';
import { emailService } from '../services/emailService';

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
      album: {
        name: row.albumName,
        code: row.albumCode
      },
      project: {
        name: row.projectName
      },
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
export async function getProjectAlbums(req: Request, res: Response): Promise<void> {
  try {
    const { companyId, projectId } = req.params;
    const category = req.query.category as string; // 'СВОК ПД' или 'СВОК РД'
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
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
      res.status(404).json({
        success: false,
        error: 'Project not found'
      });
      return;
    }

    // Получаем альбомы проекта
    let query = `
      SELECT 
        a.id,
        a.name,
        a.code,
        a.category,
        a.deadline,
        a.comment,
        a.link,
        a.local_link,
        a.last_status_at,
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
        ast.name as status_name,
        ast.color_hex as status_color,
        (
          SELECT ae.created_at 
          FROM album_events ae 
          WHERE ae.album_id = a.id 
          ORDER BY ae.created_at DESC 
          LIMIT 1
        ) as last_event_date,
        (
          SELECT ast2.name 
          FROM album_events ae2
          LEFT JOIN album_statuses ast2 ON ae2.status_id = ast2.id
          WHERE ae2.album_id = a.id 
          ORDER BY ae2.created_at DESC 
          LIMIT 1
        ) as last_event_status
      FROM albums a
      LEFT JOIN departments d ON a.department_id = d.id
      LEFT JOIN participants exec ON a.executor_id = exec.id
      LEFT JOIN participants cust ON a.customer_id = cust.id
      LEFT JOIN album_statuses ast ON a.status_id = ast.id
      WHERE a.project_id = ?
    `;

    const params: any[] = [projectId];

    // Фильтр по категории
    if (category) {
      query += ` AND a.category = ?`;
      params.push(category);
    }

    query += ` ORDER BY d.name, a.code`;

    const [albums] = await pool.query<RowDataPacket[]>(query, params);

    console.log('🔍 Raw albums from DB:', albums.map(a => ({
      id: a.id,
      code: a.code,
      executor: { id: a.executor_id, first: a.executor_first_name, last: a.executor_last_name },
      customer: { id: a.customer_id, first: a.customer_first_name, last: a.customer_last_name }
    })));

    // Форматируем результат
    const formattedAlbums = albums.map(row => ({
      id: row.id.toString(),
      name: row.name,
      code: row.code,
      category: row.category || 'СВОК ПД',
      department: row.department_name || '',
      departmentCode: row.department_code || '',
      executor: {
        name: row.executor_first_name && row.executor_last_name 
          ? `${row.executor_first_name} ${row.executor_last_name}`.trim()
          : '',
        id: row.executor_id?.toString() || '',
        telegram: row.executor_telegram || ''
      },
      customer: {
        name: row.customer_first_name && row.customer_last_name
          ? `${row.customer_first_name} ${row.customer_last_name}`.trim()
          : '',
        id: row.customer_id?.toString() || '',
        telegram: row.customer_telegram || ''
      },
      deadline: row.deadline,
      status: row.status_name || '',
      statusCode: row.status_code || '',
      statusColor: row.status_color || '',
      lastEvent: {
        status: row.last_event_status || row.status_name || '',
        date: row.last_event_date || row.last_status_at || row.created_at
      },
      albumLink: row.link || '',
      localLink: row.local_link || '',
      comment: row.comment || '',
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
export async function getAlbumTemplates(req: Request, res: Response): Promise<void> {
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
      res.status(403).json({
        success: false,
        error: 'Access denied to this company'
      });
      return;
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

/**
 * POST /api/companies/:companyId/projects/:projectId/albums
 * Создать новый альбом в проекте
 */
export async function createAlbum(req: Request, res: Response): Promise<void> {
  const connection = await pool.getConnection();
  
  try {
    const { companyId, projectId } = req.params;
    const { 
      name, 
      code, 
      category,
      departmentId, 
      executorId, 
      customerId, 
      deadline, 
      comment, 
      link,
      localLink 
    } = req.body;

    const userId = (req as any).user?.id;

    console.log('📥 Creating album:', { 
      companyId, 
      projectId, 
      name, 
      code,
      category, 
      departmentId, 
      executorId, 
      customerId,
      userId 
    });

    // Валидация обязательных полей
    if (!name || !code || !departmentId) {
      res.status(400).json({ 
        error: 'Missing required fields: name, code, departmentId' 
      });
      return;
    }

    // Проверяем, что проект принадлежит компании
    const [projects] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM projects WHERE id = ? AND company_id = ?',
      [projectId, companyId]
    );

    if (projects.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Проверяем, нет ли уже альбома с таким кодом в этом проекте (в любой категории)
    const [existingAlbums] = await connection.query<RowDataPacket[]>(
      'SELECT id, category FROM albums WHERE project_id = ? AND code = ?',
      [projectId, code]
    );

    if (existingAlbums.length > 0) {
      const existingCategory = existingAlbums[0].category;
      res.status(400).json({ 
        error: `Альбом с кодом "${code}" уже существует в этом проекте (${existingCategory})`,
        code: 'DUPLICATE_ALBUM_CODE'
      });
      return;
    }

    await connection.beginTransaction();

    // Получаем статус "Ожидание" (pending) по умолчанию
    const [statusRows] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM album_statuses WHERE code = 'pending' LIMIT 1"
    );

    const defaultStatusId = statusRows[0]?.id || 4; // 4 - это ID статуса pending из вашей БД

    // Создаем альбом
    const [result] = await connection.query<any>(
      `INSERT INTO albums 
        (project_id, name, code, category, department_id, executor_id, customer_id, 
         deadline, status_id, last_status_at, comment, link, local_link, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)`,
      [
        projectId, 
        name, 
        code,
        category || 'СВОК ПД', 
        departmentId, 
        executorId || null, 
        customerId || null, 
        deadline || null,
        defaultStatusId,
        comment || null,
        link || null,
        localLink || null,
        userId
      ]
    );

    const albumId = result.insertId;

    // Создаем первое событие для альбома - статус "Ожидание" (pending)
    await connection.query(
      `INSERT INTO album_events 
        (album_id, status_id, comment, created_by_user_id, source)
       VALUES (?, ?, ?, ?, 'web')`,
      [albumId, defaultStatusId, 'Альбом создан', userId]
    );

    await connection.commit();

    console.log(`✅ Album created with ID: ${albumId}, status: pending`);

    res.status(201).json({
      success: true,
      albumId,
      message: 'Album created successfully'
    });

  } catch (error: any) {
    await connection.rollback();
    console.error('❌ Error creating album:', error);
    
    // Обработка ошибки дубликата
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({
        error: 'Альбом с таким кодом уже существует в этом проекте',
        code: 'DUPLICATE_ALBUM_CODE'
      });
      return;
    }
    
    res.status(500).json({
      error: 'Failed to create album',
      details: error instanceof Error ? error.message : String(error)
    });
  } finally {
    connection.release();
  }
}

/**
 * PUT /api/companies/:companyId/projects/:projectId/albums/:albumId
 * Обновить альбом в проекте
 */
export async function updateAlbum(req: Request, res: Response): Promise<void> {
  const connection = await pool.getConnection();
  
  try {
    const { companyId, projectId, albumId } = req.params;
    const { 
      name, 
      code, 
      departmentId, 
      executorId, 
      customerId, 
      deadline, 
      comment, 
      link,
      localLink 
    } = req.body;

    const userId = (req as any).user?.id;

    console.log('📝 Updating album:', { 
      companyId, 
      projectId, 
      albumId, 
      name, 
      code, 
      departmentId, 
      executorId, 
      customerId,
      deadline,
      comment,
      link,
      userId 
    });

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Проверяем, что проект принадлежит компании
    const [projects] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM projects WHERE id = ? AND company_id = ?',
      [projectId, companyId]
    );

    if (projects.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Проверяем, что альбом принадлежит проекту
    const [albums] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM albums WHERE id = ? AND project_id = ?',
      [albumId, projectId]
    );

    if (albums.length === 0) {
      res.status(404).json({ error: 'Album not found' });
      return;
    }

    // Если меняется код, проверяем на дубликат
    if (code) {
      const [existingAlbums] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM albums WHERE project_id = ? AND code = ? AND id != ?',
        [projectId, code, albumId]
      );

      if (existingAlbums.length > 0) {
        res.status(400).json({ 
          error: `Альбом с кодом "${code}" уже существует в этом проекте`,
          code: 'DUPLICATE_ALBUM_CODE'
        });
        return;
      }
    }

    await connection.beginTransaction();

    // Формируем запрос UPDATE только для переданных полей
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (code !== undefined) {
      updates.push('code = ?');
      values.push(code);
    }
    if (departmentId !== undefined) {
      updates.push('department_id = ?');
      values.push(departmentId);
    }
    if (executorId !== undefined) {
      updates.push('executor_id = ?');
      values.push(executorId || null);
    }
    if (customerId !== undefined) {
      updates.push('customer_id = ?');
      values.push(customerId || null);
    }
    if (deadline !== undefined) {
      updates.push('deadline = ?');
      values.push(deadline || null);
    }
    if (comment !== undefined) {
      updates.push('comment = ?');
      values.push(comment || null);
    }
    if (link !== undefined) {
      updates.push('link = ?');
      values.push(link || null);
    }
    if (localLink !== undefined) {
      updates.push('local_link = ?');
      values.push(localLink || null);
    }

    if (updates.length === 0) {
      await connection.rollback();
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    // Добавляем updated_at
    updates.push('updated_at = NOW()');

    // Добавляем albumId в конец values
    values.push(albumId);

    const updateQuery = `UPDATE albums SET ${updates.join(', ')} WHERE id = ?`;
    
    console.log('📝 Update query:', updateQuery);
    console.log('📝 Values:', values);

    await connection.query(updateQuery, values);

    await connection.commit();

    console.log(`✅ Album updated with ID: ${albumId}`);

    res.json({
      success: true,
      message: 'Album updated successfully'
    });

  } catch (error: any) {
    await connection.rollback();
    console.error('❌ Error updating album:', error);
    
    res.status(500).json({
      error: 'Failed to update album',
      details: error instanceof Error ? error.message : String(error)
    });
  } finally {
    connection.release();
  }
}

export async function deleteAlbum(req: Request, res: Response): Promise<void> {
  const { albumId, projectId, companyId } = req.params;
  const connection = await pool.getConnection();
  
  console.log('🗑️ Delete album request:', { albumId, projectId, companyId });
  
  try {
    await connection.beginTransaction();
    
    // Сначала проверим, существует ли альбом вообще
    const [albumCheck] = await connection.query<RowDataPacket[]>(
      'SELECT id, project_id FROM albums WHERE id = ?',
      [albumId]
    );
    console.log('🔍 Album check:', albumCheck);
    
    // Проверим проект
    const [projectCheck] = await connection.query<RowDataPacket[]>(
      'SELECT id, company_id FROM projects WHERE id = ?',
      [projectId]
    );
    console.log('🔍 Project check:', projectCheck);
    
    // Проверяем, что альбом принадлежит проекту и компании
    const [albums] = await connection.query<RowDataPacket[]>(
      `SELECT a.id 
       FROM albums a
       JOIN projects p ON a.project_id = p.id
       WHERE a.id = ? AND a.project_id = ? AND p.company_id = ?`,
      [albumId, projectId, companyId]
    );
    
    console.log('🔍 Albums found:', albums);
    
    if (albums.length === 0) {
      await connection.rollback();
      console.log('❌ Album not found with params:', { albumId, projectId, companyId });
      res.status(404).json({ error: 'Album not found' });
      return;
    }
    
    // Удаляем события альбома
    await connection.query('DELETE FROM album_events WHERE album_id = ?', [albumId]);
    
    // Удаляем альбом
    await connection.query('DELETE FROM albums WHERE id = ?', [albumId]);
    
    await connection.commit();
    res.json({ message: 'Album deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting album:', error);
    res.status(500).json({
      error: 'Failed to delete album',
      details: error instanceof Error ? error.message : String(error)
    });
  } finally {
    connection.release();
  }
}

/**
 * PUT /api/companies/:companyId/projects/:projectId/albums/:albumId/status
 * Изменить статус альбома
 */
export async function updateAlbumStatus(req: Request, res: Response) {
  const connection = await pool.getConnection();
  const { companyId, projectId, albumId } = req.params;
  const { statusCode, comment } = req.body;
  const userId = (req as any).user?.id;

  console.log('🔄 Update album status request:', { albumId, projectId, companyId, statusCode });

  // Валидация
  if (!statusCode) {
    res.status(400).json({ error: 'Status code is required' });
    return;
  }

  const validStatusCodes = ['waiting', 'upload', 'sent', 'accepted', 'remarks', 'production'];
  if (!validStatusCodes.includes(statusCode)) {
    res.status(400).json({ 
      error: 'Invalid status code',
      validCodes: validStatusCodes 
    });
    return;
  }

  try {
    await connection.beginTransaction();

    // Проверяем, что альбом принадлежит проекту и компании
    const [albums] = await connection.query<RowDataPacket[]>(
      `SELECT a.id, a.status_id, a.code, a.name
       FROM albums a
       JOIN projects p ON a.project_id = p.id
       WHERE a.id = ? AND a.project_id = ? AND p.company_id = ?`,
      [albumId, projectId, companyId]
    );

    if (albums.length === 0) {
      await connection.rollback();
      res.status(404).json({ error: 'Album not found' });
      return;
    }

    const album = albums[0];
    const oldStatusId = album.status_id;

    // Получаем ID нового статуса
    const [statuses] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM album_statuses WHERE code = ?',
      [statusCode]
    );

    if (statuses.length === 0) {
      await connection.rollback();
      res.status(400).json({ error: 'Invalid status code' });
      return;
    }

    const newStatusId = statuses[0].id;

    // Проверяем, изменился ли статус
    if (oldStatusId === newStatusId) {
      await connection.rollback();
      res.json({ 
        message: 'Status is already set to this value',
        album: {
          id: album.id,
          code: album.code,
          name: album.name,
          statusCode
        }
      });
      return;
    }

    // Обновляем статус альбома
    await connection.query(
      `UPDATE albums 
       SET status_id = ?, last_status_at = NOW(), updated_at = NOW() 
       WHERE id = ?`,
      [newStatusId, albumId]
    );

    // Записываем в историю
    await connection.query(
      `INSERT INTO album_status_history 
       (album_id, old_status_id, new_status_id, changed_by_user_id, comment, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [albumId, oldStatusId, newStatusId, userId || null, comment || null]
    );

    await connection.commit();

    console.log(`✅ Updated album ${album.code} status from ${oldStatusId} to ${newStatusId}`);

    // Если статус изменился на "отправлено" - отправляем email заказчику
    if (statusCode === 'sent') {
      try {
        // Получаем данные для отправки email
        const [albumDetails] = await connection.query<RowDataPacket[]>(
          `SELECT 
            a.code as albumCode,
            a.name as albumName,
            a.link as albumLink,
            p.name as projectName,
            c.name as companyName,
            customer.email as customerEmail,
            CONCAT(customer.first_name, ' ', COALESCE(customer.last_name, '')) as customerName
           FROM albums a
           JOIN projects p ON a.project_id = p.id
           JOIN companies c ON p.company_id = c.id
           LEFT JOIN participants customer ON a.customer_id = customer.id
           WHERE a.id = ?`,
          [albumId]
        );

        if (albumDetails.length > 0 && albumDetails[0].customerEmail) {
          const details = albumDetails[0];
          await emailService.sendAlbumSentNotification({
            albumCode: details.albumCode,
            albumName: details.albumName,
            albumLink: details.albumLink,
            projectName: details.projectName,
            companyName: details.companyName,
            customerEmail: details.customerEmail,
            customerName: details.customerName
          });
          console.log(`📧 Email sent to customer: ${details.customerEmail}`);
        } else {
          console.warn('⚠️ Customer email not found, skipping notification');
        }
      } catch (emailError) {
        console.error('❌ Failed to send email notification:', emailError);
        // Не возвращаем ошибку клиенту, так как статус уже обновлен
      }
    }

    res.json({ 
      message: 'Album status updated successfully',
      album: {
        id: album.id,
        code: album.code,
        name: album.name,
        oldStatusId,
        newStatusId,
        statusCode
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating album status:', error);
    res.status(500).json({
      error: 'Failed to update album status',
      details: error instanceof Error ? error.message : String(error)
    });
  } finally {
    connection.release();
  }
}

/**
 * GET /api/companies/:companyId/projects/:projectId/albums/:albumId/status-history
 * Получить историю изменений статуса альбома
 */
export async function getAlbumStatusHistory(req: Request, res: Response) {
  try {
    const { companyId, projectId, albumId } = req.params;

    console.log('📜 Get status history request:', { albumId, projectId, companyId });

    // Проверяем, что альбом принадлежит проекту и компании
    const [albums] = await pool.query<RowDataPacket[]>(
      `SELECT a.id 
       FROM albums a
       JOIN projects p ON a.project_id = p.id
       WHERE a.id = ? AND a.project_id = ? AND p.company_id = ?`,
      [albumId, projectId, companyId]
    );

    if (albums.length === 0) {
      res.status(404).json({ error: 'Album not found' });
      return;
    }

    // Получаем историю изменений статусов
    const [history] = await pool.query<RowDataPacket[]>(
      `SELECT 
        h.id,
        h.created_at,
        h.comment,
        old_status.code as old_status_code,
        old_status.name as old_status_name,
        new_status.code as new_status_code,
        new_status.name as new_status_name,
        u.first_name as changed_by_first_name,
        u.last_name as changed_by_last_name,
        h.changed_by_telegram_id
       FROM album_status_history h
       LEFT JOIN album_statuses old_status ON h.old_status_id = old_status.id
       JOIN album_statuses new_status ON h.new_status_id = new_status.id
       LEFT JOIN users u ON h.changed_by_user_id = u.id
       WHERE h.album_id = ?
       ORDER BY h.created_at DESC`,
      [albumId]
    );

    // Форматируем результат
    const formattedHistory = history.map(row => ({
      id: row.id,
      createdAt: row.created_at,
      comment: row.comment,
      oldStatus: row.old_status_code ? {
        code: row.old_status_code,
        name: row.old_status_name
      } : null,
      newStatus: {
        code: row.new_status_code,
        name: row.new_status_name
      },
      changedBy: row.changed_by_first_name ? {
        firstName: row.changed_by_first_name,
        lastName: row.changed_by_last_name
      } : null,
      changedByTelegramId: row.changed_by_telegram_id
    }));

    res.json(formattedHistory);

  } catch (error) {
    console.error('Error fetching album status history:', error);
    res.status(500).json({
      error: 'Failed to fetch album status history',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * GET /api/companies/:companyId/projects/:projectId/albums/:albumId/events
 * Получить историю событий альбома из таблицы album_events
 */
export async function getAlbumEvents(req: Request, res: Response) {
  try {
    const { companyId, projectId, albumId } = req.params;

    // Проверяем доступ к проекту
    const [projects] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM projects WHERE id = ? AND company_id = ?`,
      [projectId, companyId]
    );

    if (projects.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Получаем события альбома
    const [events] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ae.id,
        ae.album_id,
        ae.status_id,
        ast.code as statusCode,
        ast.name as statusName,
        ae.comment,
        ae.created_by_user_id,
        ae.created_by_participant_id,
        ae.created_at,
        ae.source,
        ae.telegram_message_id,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        p.first_name as participant_first_name,
        p.last_name as participant_last_name
      FROM album_events ae
      LEFT JOIN album_statuses ast ON ae.status_id = ast.id
      LEFT JOIN users u ON ae.created_by_user_id = u.id
      LEFT JOIN participants p ON ae.created_by_participant_id = p.id
      WHERE ae.album_id = ?
      ORDER BY ae.created_at DESC
      LIMIT 20`,
      [albumId]
    );

    const formattedEvents = events.map(event => ({
      id: event.id,
      albumId: event.album_id,
      statusId: event.status_id,
      statusCode: event.statusCode,
      statusName: event.statusName,
      comment: event.comment,
      createdAt: event.created_at,
      source: event.source,
      telegramMessageId: event.telegram_message_id,
      createdBy: event.user_first_name 
        ? `${event.user_first_name} ${event.user_last_name || ''}`.trim()
        : event.participant_first_name 
        ? `${event.participant_first_name} ${event.participant_last_name || ''}`.trim()
        : null
    }));

    res.json({ success: true, events: formattedEvents });

  } catch (error) {
    console.error('Error fetching album events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch album events',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
