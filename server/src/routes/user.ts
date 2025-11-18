import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2';

const router = Router();

/**
 * GET /api/user/companies
 * Получить список компаний пользователя
 */
router.get('/companies', authenticateToken, async (req, res) => {
  console.log('🎯 === ВЫЗВАН ЭНДПОИНТ /api/user/companies ===');
  try {
    const userId = (req as any).user?.id;
    console.log('👤 User из токена:', userId);

    if (!userId) {
      console.log('❌ userId отсутствует в токене!');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    console.log('📥 Получение компаний пользователя:', userId);

    // Получаем компании, в которых состоит пользователь
    const [companies] = await pool.query<RowDataPacket[]>(
      `SELECT 
        c.id,
        c.name,
        cu.role_in_company
       FROM company_users cu
       INNER JOIN companies c ON cu.company_id = c.id
       WHERE cu.user_id = ?
       ORDER BY cu.created_at DESC`,
      [userId]
    );

    console.log(`✅ Найдено компаний: ${companies.length}`);

    res.json(companies);

  } catch (error) {
    console.error('❌ Error in getUserCompanies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user companies'
    });
  }
});

export default router;
