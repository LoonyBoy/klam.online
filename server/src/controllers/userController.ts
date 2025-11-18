import { Request, Response } from 'express';
import pool from '../db';
import { RowDataPacket } from 'mysql2';

/**
 * Получить всех пользователей компании с их ролями и отделами
 */
export const getCompanyUsers = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    // Проверяем, есть ли колонка department_id в таблице participants
    const [columns] = await pool.query<RowDataPacket[]>(
      `SHOW COLUMNS FROM participants LIKE 'department_id'`
    );
    
    const hasDepartmentId = columns.length > 0;

    // Получаем всех участников (participants) компании
    let query;
    if (hasDepartmentId) {
      query = `SELECT 
        p.id,
        p.telegram_id,
        p.telegram_username,
        p.first_name,
        p.last_name,
        p.email,
        p.role_type,
        p.is_active,
        p.department_id,
        d.code as department_code,
        d.name as department_name
      FROM participants p
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE p.company_id = ? AND p.is_active = 1
      ORDER BY p.first_name, p.last_name`;
    } else {
      query = `SELECT 
        p.id,
        p.telegram_id,
        p.telegram_username,
        p.first_name,
        p.last_name,
        p.email,
        p.role_type,
        p.is_active
      FROM participants p
      WHERE p.company_id = ? AND p.is_active = 1
      ORDER BY p.first_name, p.last_name`;
    }

    const [participantRows] = await pool.query<RowDataPacket[]>(query, [companyId]);

    // Формируем ответ
    const users = participantRows.map((row: any) => {
      let department = null;
      
      if (hasDepartmentId && row.department_id) {
        department = {
          id: row.department_id,
          code: row.department_code,
          name: row.department_name
        };
      }

      return {
        id: row.id,
        telegramId: row.telegram_id,
        telegramUsername: row.telegram_username,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        roleInCompany: 'member',
        roleType: row.role_type,
        department
      };
    });

    res.json({ users });
  } catch (error) {
    console.error('❌ Error fetching company users:', error);
    res.status(500).json({ error: 'Failed to fetch company users' });
  }
};

/**
 * Получить статистику по пользователям компании
 */
export const getCompanyUsersStats = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    // Общее количество активных участников
    const [totalRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total
       FROM participants
       WHERE company_id = ? AND is_active = 1`,
      [companyId]
    );

    // Количество исполнителей (участников с role_type = 'executor')
    const [executorsRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total
       FROM participants
       WHERE company_id = ? 
       AND role_type = 'executor'
       AND is_active = 1`,
      [companyId]
    );

    // Количество заказчиков (участников с role_type = 'customer')
    const [customersRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total
       FROM participants
       WHERE company_id = ? 
       AND role_type = 'customer'
       AND is_active = 1`,
      [companyId]
    );

    res.json({
      totalUsers: totalRows[0]?.total || 0,
      executors: executorsRows[0]?.total || 0,
      customers: customersRows[0]?.total || 0
    });
  } catch (error) {
    console.error('❌ Error fetching company users stats:', error);
    res.status(500).json({ error: 'Failed to fetch company users stats' });
  }
};

/**
 * Получить участников компании (participants)
 * Возвращает активных участников для использования в выпадающих списках
 */
export const getCompanyParticipants = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    // Проверяем, есть ли колонка department_id в таблице participants
    const [columns] = await pool.query<RowDataPacket[]>(
      `SHOW COLUMNS FROM participants LIKE 'department_id'`
    );
    
    const hasDepartmentId = columns.length > 0;

    // Получаем всех активных участников компании
    let query;
    if (hasDepartmentId) {
      query = `SELECT 
        p.id,
        p.telegram_id,
        p.telegram_username,
        p.first_name,
        p.last_name,
        p.email,
        p.role_type,
        p.department_id,
        d.code as department_code,
        d.name as department_name
      FROM participants p
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE p.company_id = ? AND p.is_active = 1
      ORDER BY p.first_name, p.last_name`;
    } else {
      query = `SELECT 
        p.id,
        p.telegram_id,
        p.telegram_username,
        p.first_name,
        p.last_name,
        p.email,
        p.role_type
      FROM participants p
      WHERE p.company_id = ? AND p.is_active = 1
      ORDER BY p.first_name, p.last_name`;
    }

    const [participantRows] = await pool.query<RowDataPacket[]>(query, [companyId]);

    // Формируем ответ
    const participants = participantRows.map((row: any) => {
      let department = null;
      
      if (hasDepartmentId && row.department_id) {
        department = {
          id: row.department_id,
          code: row.department_code,
          name: row.department_name
        };
      }

      return {
        id: row.id,
        telegramId: row.telegram_id,
        telegramUsername: row.telegram_username,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        roleType: row.role_type,
        department
      };
    });

    res.json(participants);
  } catch (error) {
    console.error('❌ Error fetching company participants:', error);
    res.status(500).json({ error: 'Failed to fetch company participants' });
  }
};

/**
 * Добавить участника (participant) в компанию
 */
export const addParticipant = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { firstName, lastName, telegramUsername, email, roleType, departmentId, departmentCode } = req.body;

    console.log('📥 Received participant data:', { companyId, firstName, lastName, telegramUsername, email, roleType, departmentId, departmentCode });

    // Валидация
    if (!firstName || firstName.trim() === '' || !roleType) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ error: 'Missing required fields: firstName, roleType' });
    }

    if (!['executor', 'customer'].includes(roleType)) {
      console.error('❌ Invalid roleType:', roleType);
      return res.status(400).json({ error: 'Invalid roleType. Must be "executor" or "customer"' });
    }

    // Если передан departmentCode, получаем departmentId из словаря
    let finalDepartmentId = departmentId;
    if (departmentCode && !departmentId) {
      const [deptRows] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM departments WHERE code = ?',
        [departmentCode]
      );

      if (deptRows.length === 0) {
        console.error('❌ Department not found:', departmentCode);
        return res.status(400).json({ error: `Department with code ${departmentCode} not found` });
      }

      finalDepartmentId = deptRows[0].id;
      console.log('✅ Found department:', { code: departmentCode, id: finalDepartmentId });
    }

    // Извлекаем telegram_id из username (если указан)
    let telegramId = null;
    if (telegramUsername) {
      // Убираем @ если есть
      const cleanUsername = telegramUsername.replace('@', '');
      
      // Пытаемся найти пользователя по username
      const [userRows] = await pool.query<RowDataPacket[]>(
        `SELECT telegram_id FROM users WHERE telegram_username = ?`,
        [cleanUsername]
      );
      
      if (userRows.length > 0) {
        telegramId = userRows[0].telegram_id;
      }
    }

    // Создаем участника
    const cleanLastName = lastName && lastName.trim() !== '' ? lastName : '';
    
    // Проверяем, есть ли колонка department_id в таблице
    const [columns] = await pool.query<RowDataPacket[]>(
      `SHOW COLUMNS FROM participants LIKE 'department_id'`
    );
    
    const hasDepartmentId = columns.length > 0;
    
    let result;
    if (hasDepartmentId && finalDepartmentId) {
      // Если поле есть и departmentId передан
      [result] = await pool.query(
        `INSERT INTO participants (company_id, first_name, last_name, telegram_username, telegram_id, email, role_type, department_id, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [companyId, firstName.trim(), cleanLastName, telegramUsername?.replace('@', ''), telegramId, email, roleType, finalDepartmentId]
      );
    } else {
      // Если поля нет или departmentId не передан
      [result] = await pool.query(
        `INSERT INTO participants (company_id, first_name, last_name, telegram_username, telegram_id, email, role_type, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [companyId, firstName.trim(), cleanLastName, telegramUsername?.replace('@', ''), telegramId, email, roleType]
      );
    }

    console.log('✅ Participant added successfully:', (result as any).insertId);

    return res.json({
      success: true,
      participantId: (result as any).insertId,
      message: 'Participant added successfully'
    });
  } catch (error) {
    console.error('❌ Error adding participant:', error);
    return res.status(500).json({ error: 'Failed to add participant' });
  }
};

/**
 * Удалить участника (мягкое удаление - установка is_active = 0)
 */
export const deleteParticipant = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    const { companyId, participantId } = req.params;

    console.log('🗑️ Deleting participant:', { companyId, participantId });

    // Начинаем транзакцию
    await connection.beginTransaction();

    // 1. Удаляем все связи участника с проектами
    await connection.query(
      `DELETE FROM project_participants 
       WHERE participant_id = ?`,
      [participantId]
    );

    console.log('✅ Removed participant from all projects');

    // 2. Мягкое удаление участника - устанавливаем is_active = 0
    const [result] = await connection.query(
      `UPDATE participants 
       SET is_active = 0 
       WHERE id = ? AND company_id = ?`,
      [participantId, companyId]
    );

    if ((result as any).affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: 'Participant not found' });
    }

    // Коммитим транзакцию
    await connection.commit();
    console.log('✅ Participant deleted successfully');

    return res.json({
      success: true,
      message: 'Participant deleted successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error deleting participant:', error);
    return res.status(500).json({ error: 'Failed to delete participant' });
  } finally {
    connection.release();
  }
};

/**
 * Обновить данные участника
 */
export const updateParticipant = async (req: Request, res: Response) => {
  try {
    const { companyId, participantId } = req.params;
    const { firstName, lastName, telegramUsername, email, roleType, departmentId } = req.body;

    console.log('📝 Updating participant:', { companyId, participantId, firstName, lastName, email, roleType, departmentId });

    // Валидация
    if (!firstName || firstName.trim() === '') {
      console.error('❌ Missing required field: firstName');
      return res.status(400).json({ error: 'Missing required field: firstName' });
    }

    if (roleType && !['executor', 'customer'].includes(roleType)) {
      console.error('❌ Invalid roleType:', roleType);
      return res.status(400).json({ error: 'Invalid roleType. Must be "executor" or "customer"' });
    }

    const cleanLastName = lastName && lastName.trim() !== '' ? lastName : '';

    // Проверяем, есть ли колонка department_id в таблице
    const [columns] = await pool.query<RowDataPacket[]>(
      `SHOW COLUMNS FROM participants LIKE 'department_id'`
    );
    
    const hasDepartmentId = columns.length > 0;

    // Формируем запрос обновления
    let updateFields = [
      'first_name = ?',
      'last_name = ?',
      'email = ?',
      'telegram_username = ?'
    ];
    let values = [
      firstName.trim(),
      cleanLastName,
      email || null,
      telegramUsername?.replace('@', '') || null
    ];

    if (roleType) {
      updateFields.push('role_type = ?');
      values.push(roleType);
    }

    if (hasDepartmentId) {
      updateFields.push('department_id = ?');
      values.push(departmentId || null);
    }

    values.push(participantId, companyId);

    const [result] = await pool.query(
      `UPDATE participants 
       SET ${updateFields.join(', ')}
       WHERE id = ? AND company_id = ?`,
      values
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    console.log('✅ Participant updated successfully');

    return res.json({
      success: true,
      message: 'Participant updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating participant:', error);
    return res.status(500).json({ error: 'Failed to update participant' });
  }
};
