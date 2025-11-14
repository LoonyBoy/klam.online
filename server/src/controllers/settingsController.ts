import { Request, Response } from 'express';
import { pool } from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Get user profile (from users table + current user's role in company from company_users)
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { companyId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('📋 getUserProfile:', { userId, companyId });

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        u.id,
        u.telegram_id,
        u.telegram_username,
        u.first_name,
        u.last_name,
        u.email,
        cu.role_in_company
      FROM users u
      LEFT JOIN company_users cu ON cu.user_id = u.id AND cu.company_id = ?
      WHERE u.id = ?`,
      [companyId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('Error getting user profile:', error);
    return res.status(500).json({ error: 'Failed to get user profile' });
  }
};

// Update user profile (first_name, last_name, email)
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { first_name, last_name, email } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await pool.query<ResultSetHeader>(
      `UPDATE users 
       SET first_name = ?, last_name = ?, email = ?
       WHERE id = ?`,
      [first_name, last_name, email, userId]
    );

    return res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ error: 'Failed to update user profile' });
  }
};

// Get company settings
export const getCompanySettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { companyId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('🏢 getCompanySettings:', { userId, companyId });

    // Check if user belongs to this company and get their role
    const [userCheck] = await pool.query<RowDataPacket[]>(
      `SELECT role_in_company FROM company_users 
       WHERE company_id = ? AND user_id = ?`,
      [companyId, userId]
    );

    console.log('👥 userCheck result:', userCheck);

    if (userCheck.length === 0) {
      return res.status(403).json({ error: 'You do not have access to this company' });
    }

    const userRole = userCheck[0].role_in_company;

    // Get company data
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        id,
        name,
        email,
        address,
        created_by_user_id
      FROM companies
      WHERE id = ?`,
      [companyId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    return res.json({
      ...rows[0],
      userRole, // Include user's role for frontend permission checks
      canEdit: userRole === 'owner' // Only owner can edit
    });
  } catch (error) {
    console.error('Error getting company settings:', error);
    return res.status(500).json({ error: 'Failed to get company settings' });
  }
};

// Update company settings (only owner can update)
export const updateCompanySettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { companyId } = req.params;
    const {
      name,
      email,
      address
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is owner
    const [userCheck] = await pool.query<RowDataPacket[]>(
      `SELECT role_in_company FROM company_users 
       WHERE company_id = ? AND user_id = ?`,
      [companyId, userId]
    );

    if (userCheck.length === 0) {
      return res.status(403).json({ error: 'You do not have access to this company' });
    }

    if (userCheck[0].role_in_company !== 'owner') {
      return res.status(403).json({ error: 'Only company owner can update settings' });
    }

    // Update company data
    await pool.query<ResultSetHeader>(
      `UPDATE companies 
       SET name = ?, 
           email = ?, 
           address = ?
       WHERE id = ?`,
      [name, email, address, companyId]
    );

    return res.json({ success: true, message: 'Company settings updated successfully' });
  } catch (error) {
    console.error('Error updating company settings:', error);
    return res.status(500).json({ error: 'Failed to update company settings' });
  }
};
