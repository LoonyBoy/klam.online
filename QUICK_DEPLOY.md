# 🚀 Быстрая установка на сервер

## Вариант 1: Автоматическая установка (Рекомендуется)

На вашем компьютере закоммитьте и запушьте все изменения:

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

На сервере:

```bash
# Подключение к серверу
ssh root@80.87.98.48

# Скачать и запустить скрипт установки
curl -o setup.sh https://raw.githubusercontent.com/LoonyBoy/klam.online/main/setup-server.sh
chmod +x setup.sh
./setup.sh
```

Скрипт автоматически:
- ✅ Установит Node.js, MySQL, Nginx
- ✅ Склонирует проект
- ✅ Настроит базу данных
- ✅ Соберет и запустит приложение

## Вариант 2: Ручная установка

### 1. Подключение к серверу

```bash
ssh root@80.87.98.48
```

### 2. Установка базовых пакетов

```bash
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs mysql-server nginx git
npm install -g pm2
```

### 3. Настройка MySQL

```bash
systemctl start mysql
mysql -u root
```

В MySQL:
```sql
CREATE DATABASE klamonline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'klamuser'@'localhost' IDENTIFIED BY 'Pelevin3322';
GRANT ALL PRIVILEGES ON klamonline.* TO 'klamuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. Клонирование проекта

```bash
cd /var/www
git clone https://github.com/LoonyBoy/klam.online.git
cd klam.online
```

### 5. Установка зависимостей

```bash
npm install
cd server
npm install
```

### 6. Настройка .env

```bash
cd server
cp .env.example .env
nano .env
```

Измените:
```env
NODE_ENV=production
DB_PASSWORD=Pelevin3322
CORS_ORIGIN=https://klam.online
```

### 7. Миграции

```bash
npm run db:migrate
cd ..
```

### 8. Сборка

```bash
npm run build
cd server
npm run build
```

### 9. Запуск backend

```bash
pm2 start dist/index.js --name klam-backend
pm2 startup
pm2 save
cd ..
```

### 10. Настройка Nginx

```bash
nano /etc/nginx/sites-available/klam.online
```

Вставьте конфигурацию из `DEPLOYMENT.md`

```bash
ln -s /etc/nginx/sites-available/klam.online /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 11. Firewall

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 12. SSL (опционально)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d klam.online -d www.klam.online -d api.klam.online
```

## Проверка

```bash
# Статус backend
pm2 status

# Логи
pm2 logs klam-backend

# Проверка API
curl http://localhost:3001/health
```

## Обновление

После изменений в коде:

```bash
cd /var/www/klam.online
git pull
./deploy.sh
```

## Важно!

1. **DNS записи:** Добавьте A-записи для `klam.online`, `www.klam.online`, `api.klam.online` → `80.87.98.48`

2. **Telegram Bot:** Обновите домен через BotFather:
   ```
   /setdomain
   @klamonline_bot
   klam.online
   ```

3. **Firewall:** Убедитесь что порты 80 и 443 открыты

4. **Backup:** Настройте автоматический backup через cron

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
curl http://localhost:3001/health
```

### База данных недоступна
```bash
systemctl status mysql
mysql -u klamuser -pPelevin3322 klamonline
```

## Полная документация

Смотрите `DEPLOYMENT.md` для подробной информации.
