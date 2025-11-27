# KlamBot.ru Server

Backend API сервер для системы управления проектами KlamBot.ru.

## Технологии

- **Node.js** + **TypeScript**
- **Express.js** - веб-фреймворк
- **MySQL 8+** - база данных
- **mysql2** - MySQL клиент для Node.js

## Требования

- Node.js 18+
- MySQL 8+
- npm или yarn

## Установка

### 1. Установите зависимости

```bash
cd server
npm install
```

### 2. Настройте переменные окружения

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Отредактируйте `.env` и укажите параметры подключения к MySQL:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=klamonline
```

### 3. Создайте и настройте базу данных

#### Вариант А: Автоматическая настройка

```bash
# Сбросить БД (удалит все данные!)
npm run db:reset

# Применить все миграции
npm run db:migrate
```

#### Вариант Б: Ручная настройка

Подключитесь к MySQL и выполните миграции вручную:

```bash
mysql -u root -p < migrations/001_initial_schema.sql
mysql -u root -p < migrations/002_seed_dictionaries.sql
```

## Запуск сервера

### Режим разработки (с hot-reload)

```bash
npm run dev
```

### Продакшн

```bash
# Скомпилировать TypeScript
npm run build

# Запустить скомпилированный код
npm start
```

## Структура базы данных

### Основные таблицы

#### 1. Пользователи и аутентификация
- `users` - пользователи системы (логин через Telegram)
- `auth_sessions` - активные сессии
- `notification_settings` - настройки уведомлений

#### 2. Компании (Multi-tenancy)
- `companies` - компании (tenant)
- `company_users` - связь пользователей с компаниями
- `company_invitations` - приглашения в компанию
- `email_settings` - SMTP настройки компании

#### 3. Участники проектов
- `participants` - исполнители и заказчики

#### 4. Справочники
- `departments` - отделы (КР, АР, ЭС, СС, ГП, ОВКВ)
- `album_statuses` - статусы альбомов

#### 5. Проекты
- `projects` - проекты компании
- `project_departments` - отделы проекта
- `project_participants` - участники проекта
- `project_channels` - Telegram-каналы проекта

#### 6. Альбомы
- `albums` - альбомы проекта
- `album_events` - история изменений статусов
- `album_templates` - шаблоны альбомов
- `album_template_items` - элементы шаблонов

## API Endpoints

### Health Check

```
GET /health
```

Возвращает статус сервера и подключения к БД.

### API Info

```
GET /api
```

Возвращает информацию о версии API.

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск в режиме разработки с hot-reload |
| `npm run build` | Компиляция TypeScript в JavaScript |
| `npm start` | Запуск скомпилированного сервера |
| `npm run db:migrate` | Применить все миграции |
| `npm run db:reset` | Сбросить базу данных (удалит все данные!) |

## Разработка

### Добавление новых миграций

1. Создайте новый SQL файл в `migrations/`:
   ```
   migrations/003_add_new_feature.sql
   ```

2. Примените миграцию:
   ```bash
   npm run db:migrate
   ```

### Структура проекта

```
server/
├── config/           # Конфигурационные файлы
│   └── database.ts   # Настройки БД
├── migrations/       # SQL миграции
│   ├── 001_initial_schema.sql
│   └── 002_seed_dictionaries.sql
├── scripts/          # Утилиты
│   ├── migrate.ts    # Скрипт миграций
│   └── reset.ts      # Скрипт сброса БД
└── src/
    ├── controllers/  # Контроллеры API
    ├── middleware/   # Middleware функции
    ├── models/       # Модели данных
    ├── routes/       # Маршруты API
    ├── db.ts         # Database connection pool
    └── index.ts      # Точка входа
```

## Лицензия

Proprietary
