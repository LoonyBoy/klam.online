import { Request, Response } from 'express';
import { pool } from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * GET /api/companies/:companyId/check
 * Проверить доступ пользователя к компании
 */
export async function checkUserAccess(req: Request, res: Response) {
  try {
    const { companyId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Проверяем, есть ли пользователь в таблице company_users
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT cu.id, cu.role_in_company, c.name as company_name
       FROM company_users cu
       INNER JOIN companies c ON cu.company_id = c.id
       WHERE cu.company_id = ? AND cu.user_id = ?`,
      [companyId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User is not a member of this company'
      });
    }

    res.json({
      success: true,
      hasAccess: true,
      companyName: rows[0].company_name,
      role: rows[0].role_in_company
    });

  } catch (error) {
    console.error('❌ Error in checkUserAccess:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check user access'
    });
  }
}

/**
 * GET /api/companies/invitations
 * Получить приглашения пользователя
 */
export async function getInvitations(req: Request, res: Response) {
  try {
    const { email, telegramUsername } = req.query;
    
    // Убираем @ из telegram username если он есть
    const cleanUsername = typeof telegramUsername === 'string' 
      ? telegramUsername.replace(/^@/, '') 
      : null;
    
    console.log('📥 Запрос приглашений:', { email, telegramUsername, cleanUsername });

    // Получаем приглашения по email или telegram username
    const [invitations] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ci.id,
        ci.company_id,
        ci.role_in_company,
        ci.token,
        ci.email,
        ci.telegram_username,
        ci.status,
        ci.expires_at,
        ci.created_at,
        c.name as company_name,
        u.first_name as invited_by_first_name,
        u.last_name as invited_by_last_name
      FROM company_invitations ci
      LEFT JOIN companies c ON ci.company_id = c.id
      LEFT JOIN users u ON ci.invited_by_user_id = u.id
      WHERE ci.status = 'pending'
        AND (ci.expires_at IS NULL OR ci.expires_at > NOW())
        AND (
          (ci.email IS NOT NULL AND ci.email = ?) 
          OR (ci.telegram_username IS NOT NULL AND ci.telegram_username = ?)
        )
      ORDER BY ci.created_at DESC`,
      [email || null, cleanUsername]
    );

    console.log(`✅ Найдено приглашений: ${invitations.length}`);

    // Форматируем ответ
    const formattedInvitations = invitations.map((inv: any) => ({
      id: inv.id.toString(),
      companyId: inv.company_id.toString(),
      companyName: inv.company_name,
      role: inv.role_in_company,
      invitedBy: inv.invited_by_first_name 
        ? `${inv.invited_by_first_name}${inv.invited_by_last_name ? ' ' + inv.invited_by_last_name : ''}`
        : null,
      status: inv.status,
      expiresAt: inv.expires_at,
      createdAt: inv.created_at
    }));

    res.json(formattedInvitations);

  } catch (error) {
    console.error('❌ Error in getInvitations:', error);
    console.error('❌ Stack:', error instanceof Error ? error.stack : 'No stack');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invitations',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * POST /api/companies/invitations/:id/accept
 * Принять приглашение в компанию
 */
export async function acceptInvitation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id; // Предполагаем, что есть middleware для аутентификации

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    console.log('📥 Принятие приглашения:', { invitationId: id, userId });

    // Получаем информацию о приглашении
    const [invitations] = await pool.query<RowDataPacket[]>(
      `SELECT id, company_id, role_in_company, status, expires_at 
       FROM company_invitations 
       WHERE id = ? AND status = 'pending'`,
      [id]
    );

    if (invitations.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found or already used'
      });
    }

    const invitation = invitations[0];

    // Проверяем срок действия
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      await pool.query(
        'UPDATE company_invitations SET status = ? WHERE id = ?',
        ['expired', id]
      );
      
      return res.status(400).json({
        success: false,
        error: 'Invitation has expired'
      });
    }

    // Начинаем транзакцию
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Обновляем статус приглашения
      await connection.query(
        'UPDATE company_invitations SET status = ? WHERE id = ?',
        ['accepted', id]
      );

      // Добавляем пользователя в компанию
      await connection.query(
        `INSERT INTO company_users (company_id, user_id, role_in_company, created_at)
         VALUES (?, ?, ?, NOW())`,
        [invitation.company_id, userId, invitation.role_in_company]
      );

      await connection.commit();
      connection.release();

      console.log('✅ Приглашение принято');

      res.json({
        success: true,
        companyId: invitation.company_id.toString()
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error in acceptInvitation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept invitation'
    });
  }
}

/**
 * POST /api/companies/invitations/:id/decline
 * Отклонить приглашение в компанию
 */
export async function declineInvitation(req: Request, res: Response) {
  try {
    const { id } = req.params;

    console.log('📥 Отклонение приглашения:', { invitationId: id });

    await pool.query(
      'UPDATE company_invitations SET status = ? WHERE id = ? AND status = ?',
      ['cancelled', id, 'pending']
    );

    console.log('✅ Приглашение отклонено');

    res.json({
      success: true
    });

  } catch (error) {
    console.error('❌ Error in declineInvitation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to decline invitation'
    });
  }
}

/**
 * GET /api/invitations/:token/info
 * Получить информацию о приглашении по токену
 */
export async function getInvitationInfo(req: Request, res: Response) {
  try {
    const { token } = req.params;

    console.log('🔍 Проверка токена приглашения:', token);

    // Получаем информацию о приглашении
    const [invitations] = await pool.query<RowDataPacket[]>(
      `SELECT i.id, i.company_id, i.role, i.expires_at, i.max_uses, i.used_count, c.name as company_name
       FROM invitations i
       INNER JOIN companies c ON i.company_id = c.id
       WHERE i.token = ?
         AND (i.expires_at IS NULL OR i.expires_at > NOW())
         AND (i.max_uses IS NULL OR i.used_count < i.max_uses)`,
      [token]
    );

    if (invitations.length === 0) {
      return res.status(404).json({
        success: false,
        isValid: false,
        error: 'Invitation not found or expired'
      });
    }

    const invitation = invitations[0];

    res.json({
      success: true,
      isValid: true,
      companyName: invitation.company_name,
      role: invitation.role,
      expiresAt: invitation.expires_at
    });

  } catch (error) {
    console.error('❌ Error in getInvitationInfo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get invitation info'
    });
  }
}

/**
 * POST /api/companies/:companyId/invitations/generate-link
 * Сгенерировать пригласительную ссылку
 */
export async function generateInviteLink(req: Request, res: Response) {
  try {
    const { companyId } = req.params;
    const { role } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    console.log('🔗 Генерация пригласительной ссылки:', { companyId, role, userId });

    // Проверяем, что пользователь имеет право приглашать (owner или admin)
    const [userRoles] = await pool.query<RowDataPacket[]>(
      'SELECT role_in_company FROM company_users WHERE company_id = ? AND user_id = ?',
      [companyId, userId]
    );

    if (userRoles.length === 0 || !['owner', 'admin'].includes(userRoles[0].role_in_company)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only owners and admins can generate invite links.'
      });
    }

    // Генерируем уникальный токен
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');

    // Создаем запись в таблице invitations
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO invitations 
        (token, company_id, role, created_by_user_id, max_uses, used_count, expires_at) 
       VALUES (?, ?, ?, ?, NULL, 0, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
      [token, companyId, role, userId]
    );

    console.log('✅ Пригласительная ссылка создана:', { token, invitationId: result.insertId });

    // Формируем полную ссылку
    // Используем переменную окружения для фронтенд URL или определяем по заголовкам
    const frontendUrl = process.env.FRONTEND_URL || 'https://waldo-gamic-clark.ngrok-free.dev';
    const inviteLink = `${frontendUrl}/invite/${token}`;

    res.json({
      success: true,
      token,
      inviteLink,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('❌ Error in generateInviteLink:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate invite link'
    });
  }
}

/**
 * POST /api/companies
 * Создать новую компанию
 */
export async function createCompany(req: Request, res: Response) {
  try {
    const { name } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Company name is required'
      });
    }

    console.log('📥 Создание компании:', { name, userId });

    // Начинаем транзакцию
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Создаем компанию
      const [result] = await connection.query<ResultSetHeader>(
        'INSERT INTO companies (name, created_by_user_id, created_at) VALUES (?, ?, NOW())',
        [name.trim(), userId]
      );

      const companyId = result.insertId;

      // Добавляем создателя как владельца компании
      await connection.query(
        `INSERT INTO company_users (company_id, user_id, role_in_company, created_at)
         VALUES (?, ?, 'owner', NOW())`,
        [companyId, userId]
      );

      await connection.commit();
      connection.release();

      console.log('✅ Компания создана:', companyId);

      res.json({
        success: true,
        companyId: companyId.toString(),
        company: {
          id: companyId.toString(),
          name: name.trim()
        }
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error in createCompany:', error);
    console.error('❌ Stack:', error instanceof Error ? error.stack : 'No stack');
    res.status(500).json({
      success: false,
      error: 'Failed to create company',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * GET /api/companies/:id
 * Получить данные компании
 */
export async function getCompany(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    console.log('📥 Запрос данных компании:', { companyId: id, userId });

    // Проверяем, что пользователь является членом компании
    const [userCompanies] = await pool.query<RowDataPacket[]>(
      `SELECT cu.role_in_company
       FROM company_users cu
       WHERE cu.company_id = ? AND cu.user_id = ?`,
      [id, userId]
    );

    if (userCompanies.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Получаем данные компании
    const [companies] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, created_at, created_by_user_id
       FROM companies
       WHERE id = ?`,
      [id]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    const company = companies[0];

    // Получаем членов компании
    const [members] = await pool.query<RowDataPacket[]>(
      `SELECT 
        cu.id,
        cu.role_in_company,
        cu.created_at as joined_at,
        u.id as user_id,
        u.telegram_id,
        u.telegram_username,
        u.first_name,
        u.last_name,
        u.email
       FROM company_users cu
       JOIN users u ON cu.user_id = u.id
       WHERE cu.company_id = ?
       ORDER BY cu.created_at ASC`,
      [id]
    );

    console.log(`✅ Компания найдена, членов: ${members.length}`);

    res.json({
      success: true,
      company: {
        id: company.id.toString(),
        name: company.name,
        createdAt: company.created_at,
        userRole: userCompanies[0].role_in_company,
        members: members.map((m: any) => ({
          id: m.id.toString(),
          userId: m.user_id.toString(),
          role: m.role_in_company,
          joinedAt: m.joined_at,
          user: {
            id: m.user_id.toString(),
            telegramId: m.telegram_id.toString(),
            username: m.telegram_username,
            firstName: m.first_name,
            lastName: m.last_name,
            email: m.email
          }
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error in getCompany:', error);
    console.error('❌ Stack:', error instanceof Error ? error.stack : 'No stack');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch company',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
