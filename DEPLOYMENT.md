# Deployment Guide - KLAM.Online

## Подготовка к деплою

### 1. Подготовка репозитория

Убедитесь, что все изменения закоммичены и запушены в Git:

```bash
git add .
git commit -m "Production ready"
git push origin main
```

### 2. Подключение к серверу

```bash
ssh root@80.87.98.48
```

## Установка на сервер

### Шаг 1: Установка необходимых пакетов

```bash
# Обновление системы
apt update && apt upgrade -y

# Установка Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Установка MySQL 8
apt install -y mysql-server

# Установка Nginx
apt install -y nginx

# Установка PM2 для управления процессами
npm install -g pm2

# Установка Git
apt install -y git
```

### Шаг 2: Настройка MySQL

```bash
# Запуск MySQL
systemctl start mysql
systemctl enable mysql

# Безопасная настройка
mysql_secure_installation

# Создание базы данных и пользователя
mysql -u root -p
```

В MySQL консоли:

```sql
CREATE DATABASE klamonline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'klamuser'@'localhost' IDENTIFIED BY 'СИЛЬНЫЙ_ПАРОЛЬ';
GRANT ALL PRIVILEGES ON klamonline.* TO 'klamuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Шаг 3: Клонирование проекта

```bash
# Переход в директорию
cd /var/www

# Клонирование репозитория
git clone https://github.com/LoonyBoy/klam.online.git
cd klam.online

# Установка зависимостей фронтенда
npm install

# Установка зависимостей backend
cd server
npm install
cd ..
```

### Шаг 4: Настройка окружения

```bash
# Создание .env для backend
cd server
cp .env.example .env
nano .env
```

Отредактируйте `.env`:

```env
NODE_ENV=production
PORT=3001

DB_HOST=localhost
DB_PORT=3306
DB_USER=klamuser
DB_PASSWORD=ВАШ_ПАРОЛЬ_MYSQL
DB_NAME=klamonline
DB_CONNECTION_LIMIT=20

JWT_SECRET=СГЕНЕРИРУЙТЕ_СЛУЧАЙНЫЙ_КЛЮЧ_64_СИМВОЛА
JWT_EXPIRES_IN=7d

TELEGRAM_BOT_TOKEN=8401385119:AAFhkT72xEU4D5YmjnRIpWDTmPfy3rLGpHs
TELEGRAM_BOT_USERNAME=klamonline_bot

CORS_ORIGIN=https://klam.online

SESSION_SECRET=СГЕНЕРИРУЙТЕ_СЛУЧАЙНЫЙ_КЛЮЧ_64_СИМВОЛА
SESSION_MAX_AGE=604800000

LOG_LEVEL=info
```

### Шаг 5: Инициализация базы данных

```bash
# Применение миграций
npm run db:migrate
```

### Шаг 6: Сборка фронтенда

```bash
cd /var/www/klam.online

# Создание production build
npm run build
```

### Шаг 7: Запуск backend с PM2

```bash
cd server

# Компиляция TypeScript
npm run build

# Запуск через PM2
pm2 start dist/index.js --name klam-backend

# Автозапуск при перезагрузке
pm2 startup
pm2 save
```

### Шаг 8: Настройка Nginx

```bash
nano /etc/nginx/sites-available/klam.online
```

Конфигурация Nginx:

```nginx
# Frontend
server {
    listen 80;
    server_name klam.online www.klam.online;

    root /var/www/klam.online/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Backend API
server {
    listen 80;
    server_name api.klam.online;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активация конфигурации:

```bash
ln -s /etc/nginx/sites-available/klam.online /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Шаг 9: SSL сертификат (Let's Encrypt)

```bash
# Установка Certbot
apt install -y certbot python3-certbot-nginx

# Получение сертификата
certbot --nginx -d klam.online -d www.klam.online -d api.klam.online

# Автообновление
certbot renew --dry-run
```

### Шаг 10: Настройка Firewall

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## Обновление проекта

```bash
cd /var/www/klam.online

# Получение изменений
git pull origin main

# Обновление зависимостей
npm install
cd server
npm install
cd ..

# Пересборка фронтенда
npm run build

# Пересборка и перезапуск backend
cd server
npm run build
pm2 restart klam-backend
cd ..
```

## Управление PM2

```bash
# Просмотр статуса
pm2 status

# Просмотр логов
pm2 logs klam-backend

# Перезапуск
pm2 restart klam-backend

# Остановка
pm2 stop klam-backend

# Удаление
pm2 delete klam-backend
```

## Настройка DNS

В панели управления доменом добавьте A-записи:

```
klam.online         A    80.87.98.48
www.klam.online     A    80.87.98.48
api.klam.online     A    80.87.98.48
```

## Мониторинг

### Логи Nginx
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Логи приложения
```bash
pm2 logs klam-backend --lines 100
```

### Статус MySQL
```bash
systemctl status mysql
```

## Backup

### База данных
```bash
# Создание backup
mysqldump -u klamuser -p klamonline > backup_$(date +%Y%m%d).sql

# Восстановление
mysql -u klamuser -p klamonline < backup_20250114.sql
```

### Автоматический backup (crontab)
```bash
crontab -e
```

Добавьте:
```
0 2 * * * mysqldump -u klamuser -pПАРОЛЬ klamonline > /root/backups/klam_$(date +\%Y\%m\%d).sql
0 3 * * * find /root/backups -name "klam_*.sql" -mtime +7 -delete
```

## Troubleshooting

### Backend не запускается
```bash
pm2 logs klam-backend
cd /var/www/klam.online/server
npm run db:test
```

### 502 Bad Gateway
```bash
pm2 status
systemctl status nginx
```

### База данных недоступна
```bash
systemctl status mysql
mysql -u klamuser -p
```

## Безопасность

1. **Отключите root SSH:**
   ```bash
   nano /etc/ssh/sshd_config
   # PermitRootLogin no
   systemctl restart sshd
   ```

2. **Создайте отдельного пользователя:**
   ```bash
   adduser deploy
   usermod -aG sudo deploy
   ```

3. **Регулярно обновляйте систему:**
   ```bash
   apt update && apt upgrade -y
   ```

4. **Настройте fail2ban:**
   ```bash
   apt install -y fail2ban
   systemctl enable fail2ban
   ```

## Готово! 🎉

Ваше приложение доступно по адресу:
- **Frontend:** https://klam.online
- **Backend API:** https://api.klam.online
- **Health Check:** https://api.klam.online/health
