import { Router } from 'express';
import { telegramAuth } from '../controllers/authController';

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

export default router;
