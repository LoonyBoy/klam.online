import { Router } from 'express';
import * as companyController from '../controllers/companyController';
import * as projectController from '../controllers/projectController';
import * as albumController from '../controllers/albumController';
import * as templateController from '../controllers/templateController';
import * as userController from '../controllers/userController';
import * as settingsController from '../controllers/settingsController';
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

// Получить детальную информацию о проекте (требует аутентификацию)
router.get('/:companyId/projects/:projectId', authenticateToken, projectController.getProjectDetails);

// Получить альбомы проекта (требует аутентификацию)
router.get('/:companyId/projects/:projectId/albums', authenticateToken, albumController.getProjectAlbums);

// Создать новый проект (требует аутентификацию)
router.post('/:companyId/projects', authenticateToken, projectController.createProject);

// Получить статистику по альбомам компании (требует аутентификацию)
router.get('/:companyId/albums/statistics', authenticateToken, albumController.getAlbumsStatistics);

// Получить список альбомов с ближайшими дедлайнами (требует аутентификацию)
router.get('/:companyId/albums/deadlines', authenticateToken, albumController.getUpcomingDeadlines);

// Получить последние события по альбомам (требует аутентификацию)
router.get('/:companyId/albums/events', authenticateToken, albumController.getRecentEvents);

// Получить отфильтрованные события для отчётов (требует аутентификацию)
router.get('/:companyId/reports/events', authenticateToken, albumController.getFilteredEvents);

// Получить шаблоны альбомов компании (требует аутентификацию)
router.get('/:companyId/album-templates', authenticateToken, albumController.getAlbumTemplates);

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

// Добавить участника в компанию (требует аутентификацию)
router.post('/:companyId/participants', authenticateToken, userController.addParticipant);

// Обновить участника компании (требует аутентификацию)
router.put('/:companyId/participants/:participantId', authenticateToken, userController.updateParticipant);

// Удалить участника из компании (требует аутентификацию)
router.delete('/:companyId/participants/:participantId', authenticateToken, userController.deleteParticipant);

// Получить профиль текущего пользователя (требует аутентификацию)
router.get('/:companyId/settings/profile', authenticateToken, settingsController.getUserProfile);

// Обновить профиль текущего пользователя (требует аутентификацию)
router.put('/:companyId/settings/profile', authenticateToken, settingsController.updateUserProfile);

// Получить настройки компании (требует аутентификацию)
router.get('/:companyId/settings', authenticateToken, settingsController.getCompanySettings);

// Обновить настройки компании (требует аутентификацию, только owner)
router.put('/:companyId/settings', authenticateToken, settingsController.updateCompanySettings);

// Создать компанию (требует аутентификацию)
router.post('/', authenticateToken, companyController.createCompany);

// Получить данные компании (требует аутентификацию) - ДОЛЖЕН БЫТЬ ПОСЛЕДНИМ
router.get('/:id', authenticateToken, companyController.getCompany);

export default router;
