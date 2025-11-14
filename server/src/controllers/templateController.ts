import { Request, Response } from 'express';
import { pool } from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * GET /api/companies/:companyId/templates
 * Получить все шаблоны альбомов компании
 */
export async function getCompanyTemplates(req: Request, res: Response) {
  try {
    const { companyId } = req.params;

    const [templates] = await pool.query<RowDataPacket[]>(
      `SELECT 
        at.id,
        at.name,
        at.created_at,
        u.first_name as created_by_first_name,
        u.last_name as created_by_last_name
       FROM album_templates at
       LEFT JOIN users u ON at.user_id = u.id
       WHERE at.company_id = ?
       ORDER BY at.created_at DESC`,
      [companyId]
    );

    // Получаем элементы для каждого шаблона
    const templatesWithItems = await Promise.all(
      templates.map(async (template) => {
        const [items] = await pool.query<RowDataPacket[]>(
          `SELECT 
            ati.id,
            ati.name,
            ati.code,
            ati.default_deadline_days,
            d.id as department_id,
            d.code as department_code,
            d.name as department_name,
            ast.id as status_id,
            ast.code as status_code,
            ast.name as status_name
           FROM album_template_items ati
           INNER JOIN departments d ON ati.department_id = d.id
           LEFT JOIN album_statuses ast ON ati.default_status_id = ast.id
           WHERE ati.template_id = ?
           ORDER BY ati.created_at`,
          [template.id]
        );

        return {
          id: template.id,
          name: template.name,
          createdAt: template.created_at,
          createdBy: template.created_by_first_name
            ? {
                firstName: template.created_by_first_name,
                lastName: template.created_by_last_name,
              }
            : null,
          itemsCount: items.length,
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            code: item.code,
            defaultDeadlineDays: item.default_deadline_days,
            department: {
              id: item.department_id,
              code: item.department_code,
              name: item.department_name,
            },
            defaultStatus: item.status_id
              ? {
                  id: item.status_id,
                  code: item.status_code,
                  name: item.status_name,
                }
              : null,
          })),
        };
      })
    );

    res.json({ templates: templatesWithItems });
  } catch (error) {
    console.error('❌ Ошибка при получении шаблонов:', error);
    res.status(500).json({
      error: 'Failed to fetch templates',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/companies/:companyId/templates
 * Создать новый шаблон альбомов
 */
export async function createTemplate(req: Request, res: Response) {
  const connection = await pool.getConnection();
  
  try {
    const { companyId } = req.params;
    const { name, items } = req.body;
    const userId = (req as any).user?.id;

    if (!name || !items || !Array.isArray(items)) {
      res.status(400).json({ error: 'Name and items are required' });
      return;
    }

    await connection.beginTransaction();

    // Создаем шаблон
    const [templateResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO album_templates (company_id, user_id, name) VALUES (?, ?, ?)`,
      [companyId, userId || null, name]
    );

    const templateId = templateResult.insertId;

    // Создаем элементы шаблона
    if (items.length > 0) {
      const itemsValues = items.map((item: any) => [
        templateId,
        item.name,
        item.code,
        item.departmentId,
        item.defaultStatusId || null,
        item.defaultDeadlineDays || null,
      ]);

      await connection.query(
        `INSERT INTO album_template_items 
         (template_id, name, code, department_id, default_status_id, default_deadline_days) 
         VALUES ?`,
        [itemsValues]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      templateId,
      message: 'Template created successfully',
    });
  } catch (error) {
    await connection.rollback();
    console.error('❌ Ошибка при создании шаблона:', error);
    res.status(500).json({
      error: 'Failed to create template',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    connection.release();
  }
}

/**
 * DELETE /api/companies/:companyId/templates/:templateId
 * Удалить шаблон альбомов
 */
export async function deleteTemplate(req: Request, res: Response) {
  try {
    const { companyId, templateId } = req.params;

    // Проверяем, принадлежит ли шаблон компании
    const [templates] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM album_templates WHERE id = ? AND company_id = ?`,
      [templateId, companyId]
    );

    if (templates.length === 0) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    // Удаляем шаблон (элементы удалятся каскадно)
    await pool.query(
      `DELETE FROM album_templates WHERE id = ?`,
      [templateId]
    );

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('❌ Ошибка при удалении шаблона:', error);
    res.status(500).json({
      error: 'Failed to delete template',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * PUT /api/companies/:companyId/templates/:templateId
 * Обновить шаблон альбомов
 */
export async function updateTemplate(req: Request, res: Response) {
  const connection = await pool.getConnection();
  
  try {
    const { companyId, templateId } = req.params;
    const { name, items } = req.body;

    if (!name || !items || !Array.isArray(items)) {
      res.status(400).json({ error: 'Name and items are required' });
      return;
    }

    // Проверяем, принадлежит ли шаблон компании
    const [templates] = await connection.query<RowDataPacket[]>(
      `SELECT id FROM album_templates WHERE id = ? AND company_id = ?`,
      [templateId, companyId]
    );

    if (templates.length === 0) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    await connection.beginTransaction();

    // Обновляем название шаблона
    await connection.query(
      `UPDATE album_templates SET name = ? WHERE id = ?`,
      [name, templateId]
    );

    // Удаляем старые элементы
    await connection.query(
      `DELETE FROM album_template_items WHERE template_id = ?`,
      [templateId]
    );

    // Создаем новые элементы
    if (items.length > 0) {
      const itemsValues = items.map((item: any) => [
        templateId,
        item.name,
        item.code,
        item.departmentId,
        item.defaultStatusId || null,
        item.defaultDeadlineDays || null,
      ]);

      await connection.query(
        `INSERT INTO album_template_items 
         (template_id, name, code, department_id, default_status_id, default_deadline_days) 
         VALUES ?`,
        [itemsValues]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Template updated successfully',
    });
  } catch (error) {
    await connection.rollback();
    console.error('❌ Ошибка при обновлении шаблона:', error);
    res.status(500).json({
      error: 'Failed to update template',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    connection.release();
  }
}
