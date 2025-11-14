import { Router } from 'express';
import * as telegramController from '../controllers/telegramController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * POST /api/telegram/check-channel
 * Проверяет, добавлен ли бот в Telegram канал и имеет ли админ права
 * 
 * Body:
 * - channelUrl: string (URL канала или chat ID)
 * 
 * Returns:
 * - success: boolean
 * - channel?: { id, title, type, username }
 * - error?: string
 */
router.post('/check-channel', authenticateToken, telegramController.checkTelegramChannel);

export default router;
