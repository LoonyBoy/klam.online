import { Router } from 'express';
import * as dictionaryController from '../controllers/dictionaryController';

const router = Router();

// Получить список отделов (публичный доступ для загрузки справочников)
router.get('/departments', dictionaryController.getDepartments);

// Получить список статусов альбомов
router.get('/statuses', dictionaryController.getAlbumStatuses);

export default router;
