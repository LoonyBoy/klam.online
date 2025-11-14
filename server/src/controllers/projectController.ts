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

/**
 * POST /api/companies/:companyId/projects
 * Создать новый проект
 */
export async function createProject(req: Request, res: Response) {
  const connection = await pool.getConnection();
  
  try {
    const { companyId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      connection.release();
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const {
      projectName,
      projectCode,
      clientCompany,
      departments,
      users,
      channelUrl
    } = req.body;

    console.log('📥 Creating new project:', {
      companyId,
      projectName,
      projectCode,
      clientCompany,
      departmentsCount: departments?.length || 0,
      usersCount: users?.length || 0
    });

    // Валидация обязательных полей
    if (!projectName || !projectCode || !clientCompany) {
      connection.release();
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: projectName, projectCode, clientCompany'
      });
    }

    if (!departments || departments.length === 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        error: 'At least one department is required'
      });
    }

    if (!users || users.length === 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        error: 'At least one user is required'
      });
    }

    // Проверяем права пользователя в компании
    const [userCompanies] = await connection.query<RowDataPacket[]>(
      `SELECT role_in_company FROM company_users WHERE company_id = ? AND user_id = ?`,
      [companyId, userId]
    );

    if (userCompanies.length === 0) {
      connection.release();
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const userRole = userCompanies[0].role_in_company;
    if (userRole !== 'owner' && userRole !== 'admin') {
      connection.release();
      return res.status(403).json({
        success: false,
        error: 'Only owners and admins can create projects'
      });
    }

    // Начинаем транзакцию
    await connection.beginTransaction();

    // 1. Создаём проект
    const [projectResult] = await connection.query<any>(
      `INSERT INTO projects (company_id, name, code, customer_company_name, owner_user_id)
       VALUES (?, ?, ?, ?, ?)`,
      [companyId, projectName, projectCode, clientCompany, userId]
    );

    const projectId = projectResult.insertId;
    console.log(`✅ Project created with ID: ${projectId}`);

    // 2. Добавляем отделы проекта
    const departmentCodes = departments.map((d: any) => d.code);
    
    // Получаем ID отделов по их кодам
    const [departmentRows] = await connection.query<RowDataPacket[]>(
      `SELECT id, code FROM departments WHERE code IN (?)`,
      [departmentCodes]
    );

    const departmentMap = new Map(departmentRows.map((d: any) => [d.code, d.id]));

    for (const dept of departments) {
      const departmentId = departmentMap.get(dept.code);
      if (departmentId) {
        await connection.query(
          `INSERT INTO project_departments (project_id, department_id) VALUES (?, ?)`,
          [projectId, departmentId]
        );
      }
    }

    console.log(`✅ Added ${departments.length} departments to project`);

    // 3. Создаём участников (participants) и привязываем к проекту
    const participantIds: number[] = [];

    for (const user of users) {
      const departmentId = departmentMap.get(
        departments.find((d: any) => d.id === user.departmentId)?.code
      );

      if (!departmentId) {
        console.warn(`⚠️ Department not found for user ${user.name}`);
        continue;
      }

      // Проверяем, существует ли уже participant с таким email в компании
      const [existingParticipants] = await connection.query<RowDataPacket[]>(
        `SELECT id, role_type FROM participants WHERE company_id = ? AND email = ?`,
        [companyId, user.email]
      );

      let participantId: number;

      if (existingParticipants.length > 0) {
        // Используем существующего участника
        participantId = existingParticipants[0].id;
        const existingRoleType = existingParticipants[0].role_type;
        
        // Обновляем role_type если он отличается
        if (existingRoleType !== user.role) {
          await connection.query(
            `UPDATE participants SET role_type = ? WHERE id = ?`,
            [user.role, participantId]
          );
          console.log(`✅ Updated participant role: ${user.email} (${existingRoleType} → ${user.role})`);
        } else {
          console.log(`✅ Using existing participant: ${user.email} (${user.role})`);
        }
      } else {
        // Создаём нового участника
        const nameParts = user.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const [participantResult] = await connection.query<any>(
          `INSERT INTO participants (company_id, first_name, last_name, telegram_username, email, role_type)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [companyId, firstName, lastName, user.telegramUsername, user.email, user.role]
        );

        participantId = participantResult.insertId;
        console.log(`✅ Created new participant: ${user.email}`);
      }

      // Добавляем участника в проект
      await connection.query(
        `INSERT INTO project_participants (project_id, participant_id, role_project, added_by)
         VALUES (?, ?, ?, ?)`,
        [projectId, participantId, 'member', userId]
      );

      participantIds.push(participantId);
    }

    console.log(`✅ Added ${participantIds.length} participants to project`);

    // 4. Сохраняем информацию о Telegram канале
    if (channelUrl) {
      await connection.query(
        `INSERT INTO project_channels (project_id, invite_link, added_by)
         VALUES (?, ?, ?)`,
        [projectId, channelUrl, userId]
      );
      console.log(`✅ Saved Telegram channel URL`);
    }

    // Коммитим транзакцию
    await connection.commit();

    console.log(`✅ Project "${projectName}" created successfully!`);

    // Возвращаем созданный проект
    res.status(201).json({
      success: true,
      project: {
        id: projectId.toString(),
        name: projectName,
        code: projectCode,
        customerCompanyName: clientCompany,
        departmentsCount: departments.length,
        participantsCount: participantIds.length
      }
    });

  } catch (error) {
    // Откатываем транзакцию при ошибке
    await connection.rollback();
    
    console.error('❌ Error in createProject:', error);
    console.error('❌ Stack:', error instanceof Error ? error.stack : 'No stack');
    
    res.status(500).json({
      success: false,
      error: 'Failed to create project',
      details: error instanceof Error ? error.message : String(error)
    });
  } finally {
    connection.release();
  }
}

/**
 * GET /api/companies/:companyId/projects/:projectId
 * Получить детальную информацию о проекте
 */
export async function getProjectDetails(req: Request, res: Response) {
  try {
    const { companyId, projectId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    console.log('📥 Запрос деталей проекта:', { companyId, projectId, userId });

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

    // Получаем основную информацию о проекте
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
       WHERE p.id = ? AND p.company_id = ?`,
      [projectId, companyId]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const project = projects[0];

    // Получаем список участников проекта с их ролями
    const [participants] = await pool.query<RowDataPacket[]>(
      `SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.telegram_username,
        p.email,
        p.role_type,
        d.id as department_id,
        d.name as department_name,
        d.code as department_code,
        pp.role_project
       FROM project_participants pp
       JOIN participants p ON pp.participant_id = p.id
       LEFT JOIN departments d ON p.department_id = d.id
       WHERE pp.project_id = ?
       ORDER BY p.last_name, p.first_name`,
      [projectId]
    );

    console.log(`📋 Raw participants from DB for project ${projectId}:`, {
      count: participants.length,
      data: participants.map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        email: p.email,
        role_type: p.role_type,
        department: p.department_name
      }))
    });

    // Разделяем участников на исполнителей и заказчиков
    const executors = participants
      .filter(p => p.role_type === 'executor')
      .map(p => ({
        id: p.id.toString(),
        participantId: p.id,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
        email: p.email || '',
        telegramUsername: p.telegram_username || '',
        role: 'executor' as const,
        department: p.department_name || '',
        departmentId: p.department_id?.toString() || '',
        departmentCode: p.department_code || ''
      }));

    const clients = participants
      .filter(p => p.role_type === 'client')
      .map(p => ({
        id: p.id.toString(),
        participantId: p.id,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
        email: p.email || '',
        telegramUsername: p.telegram_username || '',
        role: 'client' as const,
        department: p.department_name || 'Отдел заказчика',
        departmentId: p.department_id?.toString() || '',
        departmentCode: p.department_code || ''
      }));

    console.log(`📊 Участники проекта ${project.code}:`, {
      total: participants.length,
      executors: executors.length,
      clients: clients.length,
      executorsList: executors.map(e => ({ name: e.name, email: e.email })),
      clientsList: clients.map(c => ({ name: c.name, email: c.email }))
    });

    // Получаем список отделов проекта
    const [departments] = await pool.query<RowDataPacket[]>(
      `SELECT 
        d.id,
        d.name,
        d.code
       FROM project_departments pd
       JOIN departments d ON pd.department_id = d.id
       WHERE pd.project_id = ?
       ORDER BY d.name`,
      [projectId]
    );

    const departmentsList = departments.map(d => ({
      id: d.id.toString(),
      name: d.name,
      code: d.code
    }));

    // Получаем информацию о Telegram канале
    const [channels] = await pool.query<RowDataPacket[]>(
      `SELECT 
        telegram_chat_id,
        telegram_chat_title,
        invite_link,
        created_at
       FROM project_channels
       WHERE project_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [projectId]
    );

    const telegramChannel = channels.length > 0 ? {
      chatId: channels[0].telegram_chat_id?.toString() || '',
      chatTitle: channels[0].telegram_chat_title || '',
      inviteLink: channels[0].invite_link || ''
    } : null;

    // Получаем статистику по альбомам
    const [albumStats] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_albums,
        SUM(CASE WHEN status_id IN (SELECT id FROM album_statuses WHERE code = 'in_progress') THEN 1 ELSE 0 END) as active_albums
       FROM albums
       WHERE project_id = ?`,
      [projectId]
    );

    const stats = albumStats[0] || { total_albums: 0, active_albums: 0 };

    // Формируем ответ
    const projectDetails = {
      id: project.id.toString(),
      name: project.name,
      code: project.code,
      customerCompanyName: project.customer_company_name || '',
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      owner: project.owner_id ? {
        id: project.owner_id.toString(),
        firstName: project.owner_first_name,
        lastName: project.owner_last_name,
        username: project.owner_username
      } : null,
      participants: {
        executors,
        clients
      },
      departments: departmentsList,
      telegramChannel,
      stats: {
        totalAlbums: parseInt(stats.total_albums || 0),
        activeAlbums: parseInt(stats.active_albums || 0)
      }
    };

    console.log(`✅ Получены детали проекта ${project.code}`);

    res.json({
      success: true,
      project: projectDetails
    });

  } catch (error) {
    console.error('❌ Error in getProjectDetails:', error);
    console.error('❌ Stack:', error instanceof Error ? error.stack : 'No stack');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project details',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
