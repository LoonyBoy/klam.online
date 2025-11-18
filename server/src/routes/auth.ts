import { Router } from 'express';
import { telegramAuth } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/telegram
 * Авторизация через Telegram Login Widget
 * 
 * Body:
 * {
 *   id: number,
 *   first_name: string,
 *   last_name?: string,
 *   username?: string,
 *   photo_url?: string,
 *   auth_date: number,
 *   hash: string
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   isNewUser: boolean,
 *   token: string,
 *   user: {
 *     id: number,
 *     telegramId: number,
 *     username: string | null,
 *     firstName: string,
 *     lastName: string | null,
 *     photoUrl: string | null
 *   }
 * }
 */
router.post('/telegram', telegramAuth);

/**
 * GET /api/auth/verify
 * Проверка валидности JWT токена
 * 
 * Headers:
 * Authorization: Bearer <token>
 * 
 * Response:
 * {
 *   valid: true,
 *   user: { id, telegramId, ... }
 * }
 */
router.get('/verify', authenticateToken, (req, res) => {
  // Если middleware authenticateToken не выбросил ошибку, токен валиден
  res.json({
    valid: true,
    user: (req as any).user
  });
});

export default router;
