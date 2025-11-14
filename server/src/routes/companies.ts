import { Router } from 'express';
import * as companyController from '../controllers/companyController';
import * as projectController from '../controllers/projectController';
import * as albumController from '../controllers/albumController';
import * as templateController from '../controllers/templateController';
import * as userController from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Получить приглашения (не требует аутентификации, т.к. проверка по email/username)
router.get('/invitations', companyController.getInvitations);

// Принять приглашение (требует аутентификацию)
router.post('/invitations/:id/accept', authenticateToken, companyController.acceptInvitation);

// Отклонить приглашение
router.post('/invitations/:id/decline', companyController.declineInvitation);

// Получить проекты компании (требует аутентификацию)
router.get('/:companyId/projects', authenticateToken, projectController.getCompanyProjects);

// Получить статистику по альбомам компании (требует аутентификацию)
router.get('/:companyId/albums/statistics', authenticateToken, albumController.getAlbumsStatistics);

// Получить список альбомов с ближайшими дедлайнами (требует аутентификацию)
router.get('/:companyId/albums/deadlines', authenticateToken, albumController.getUpcomingDeadlines);

// Получить последние события по альбомам (требует аутентификацию)
router.get('/:companyId/albums/events', authenticateToken, albumController.getRecentEvents);

// Получить шаблоны альбомов компании (требует аутентификацию)
router.get('/:companyId/templates', authenticateToken, templateController.getCompanyTemplates);

// Создать шаблон альбомов (требует аутентификацию)
router.post('/:companyId/templates', authenticateToken, templateController.createTemplate);

// Обновить шаблон альбомов (требует аутентификацию)
router.put('/:companyId/templates/:templateId', authenticateToken, templateController.updateTemplate);

// Удалить шаблон альбомов (требует аутентификацию)
router.delete('/:companyId/templates/:templateId', authenticateToken, templateController.deleteTemplate);

// Получить пользователей компании (требует аутентификацию)
router.get('/:companyId/users', authenticateToken, userController.getCompanyUsers);

// Получить статистику по пользователям компании (требует аутентификацию)
router.get('/:companyId/users/stats', authenticateToken, userController.getCompanyUsersStats);

// Получить данные компании (требует аутентификацию)
router.get('/:id', authenticateToken, companyController.getCompany);

// Создать компанию (требует аутентификацию)
router.post('/', authenticateToken, companyController.createCompany);

export default router;
