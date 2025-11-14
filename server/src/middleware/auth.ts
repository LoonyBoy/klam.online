import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';

// Расширяем тип Request для добавления user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        telegramId: number;
      };
    }
  }
}

/**
 * Middleware для проверки JWT токена
 * Добавляет информацию о пользователе в req.user
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token required'
      });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Добавляем информацию о пользователе в request
    req.user = {
      id: decoded.userId,
      telegramId: decoded.telegramId
    };

    next();
  } catch (error) {
    console.error('❌ Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

/**
 * Опциональная аутентификация
 * Не требует токен, но если он есть - добавляет user в request
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        req.user = {
          id: decoded.userId,
          telegramId: decoded.telegramId
        };
      }
    }

    next();
  } catch (error) {
    // Игнорируем ошибки и просто продолжаем без аутентификации
    next();
  }
}
