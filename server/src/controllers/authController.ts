import { Request, Response } from 'express';
import { pool } from '../db';
import { verifyTelegramAuth, TelegramAuthData } from '../utils/telegramAuth';
import { generateToken } from '../utils/jwt';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * POST /api/auth/telegram
 * Авторизация через Telegram Login Widget
 */
export async function telegramAuth(req: Request, res: Response) {
  try {
    const telegramData: TelegramAuthData = req.body;
    
    console.log('📥 Получены данные от клиента:', JSON.stringify(telegramData, null, 2));

    // Валидация входных данных
    if (!telegramData.id || !telegramData.first_name || !telegramData.hash || !telegramData.auth_date) {
      console.error('❌ Отсутствуют обязательные поля:', {
        hasId: !!telegramData.id,
        hasFirstName: !!telegramData.first_name,
        hasHash: !!telegramData.hash,
        hasAuthDate: !!telegramData.auth_date
      });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Проверяем подлинность данных от Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN not set in .env');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    const isValid = verifyTelegramAuth(telegramData, botToken);
    if (!isValid) {
      console.warn('⚠️ Invalid Telegram auth data for user:', telegramData.id);
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication data'
      });
    }

    console.log('✅ Telegram auth verified for user:', telegramData.id);

    // Убираем @ из username если он есть
    const cleanUsername = telegramData.username 
      ? telegramData.username.replace(/^@/, '') 
      : null;

    // Ищем пользователя в БД по telegram_id
    const [existingUsers] = await pool.query<RowDataPacket[]>(
      'SELECT id, telegram_id, telegram_username, first_name, last_name, email FROM users WHERE telegram_id = ?',
      [telegramData.id]
    );

    let userId: number;
    let isNewUser = false;

    if (existingUsers.length > 0) {
      // Пользователь уже существует - обновляем данные
      const user = existingUsers[0];
      userId = user.id;

      await pool.query(
        `UPDATE users 
         SET telegram_username = ?, first_name = ?, last_name = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          cleanUsername,
          telegramData.first_name,
          telegramData.last_name || null,
          userId
        ]
      );

      console.log('📝 Updated existing user:', userId);
    } else {
      // Новый пользователь - создаем запись
      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO users (telegram_id, telegram_username, first_name, last_name, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [
          telegramData.id,
          cleanUsername,
          telegramData.first_name,
          telegramData.last_name || null
        ]
      );

      userId = result.insertId;
      isNewUser = true;

      console.log('✨ Created new user:', userId);
    }

    // Создаем JWT токен
    const token = generateToken({
      userId,
      telegramId: telegramData.id
    });

    // Создаем сессию в БД
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 дней

    await pool.query(
      `INSERT INTO auth_sessions (user_id, expires_at, ip, user_agent, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [
        userId,
        expiresAt,
        req.ip || req.connection.remoteAddress || null,
        req.get('user-agent') || null
      ]
    );

    console.log('🔑 Session created for user:', userId);

    // Возвращаем токен и данные пользователя
    res.json({
      success: true,
      isNewUser,
      token,
      user: {
        id: userId,
        telegramId: telegramData.id,
        username: telegramData.username || null,
        firstName: telegramData.first_name,
        lastName: telegramData.last_name || null,
        photoUrl: telegramData.photo_url || null
      }
    });

  } catch (error) {
    console.error('❌ Error in telegramAuth:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
