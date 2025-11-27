# Настройка Telegram Login для @klamonline_bot

## Шаг 1: Настройка домена через BotFather

1. Откройте Telegram и найдите [@BotFather](https://t.me/BotFather)

2. Отправьте команду:
   ```
   /setdomain
   ```

3. Выберите вашего бота: `@klamonline_bot`

4. Укажите домен (для разработки):
   ```
   localhost
   ```
   
   **Важно:** Для production используйте реальный домен (например, `klambot.ru`)

## Шаг 2: Проверка настроек

После настройки домена, Telegram Login Widget будет работать на:
- `http://localhost:5173` (фронтенд)
- `http://localhost:3001` (backend API)

## Как это работает

1. Пользователь нажимает кнопку "Login with Telegram"
2. Открывается окно авторизации Telegram
3. После подтверждения, Telegram возвращает данные пользователя:
   ```typescript
   {
     id: number,           // Telegram ID
     first_name: string,
     last_name?: string,
     username?: string,
     photo_url?: string,
     auth_date: number,    // Unix timestamp
     hash: string          // Контрольная сумма для проверки
   }
   ```

4. Эти данные отправляются на backend для верификации

## Верификация на backend (TODO)

Необходимо создать endpoint для проверки данных от Telegram:

```typescript
// server/src/routes/auth.ts
import crypto from 'crypto';

function verifyTelegramAuth(data: TelegramAuthData, botToken: string): boolean {
  const { hash, ...userData } = data;
  
  // Создаем строку для проверки
  const dataCheckString = Object.keys(userData)
    .sort()
    .map(key => `${key}=${userData[key]}`)
    .join('\n');
  
  // Создаем секретный ключ
  const secretKey = crypto
    .createHash('sha256')
    .update(botToken)
    .digest();
  
  // Создаем HMAC
  const hmac = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  return hmac === hash;
}
```

## Безопасность

✅ **Всегда проверяйте hash** на backend
✅ **Проверяйте auth_date** (не старше 86400 секунд)
✅ **Используйте HTTPS** в production
✅ **Храните bot token в .env**

## Для production

В production необходимо:

1. Зарегистрировать реальный домен
2. Настроить HTTPS
3. Обновить домен через BotFather:
   ```
   /setdomain
   @klamonline_bot
   klambot.ru
   ```

4. Обновить CORS на backend:
   ```env
   CORS_ORIGIN=https://klambot.ru
   ```

## Troubleshooting

### "Bot domain invalid"
- Проверьте, что домен правильно настроен через `/setdomain`
- Убедитесь, что используете именно тот домен, который указали

### Callback не вызывается
- Откройте DevTools → Console
- Проверьте, что скрипт Telegram загружен
- Убедитесь, что нет ошибок CORS

### "Auth token has expired"
- Проверьте системное время
- auth_date не должен быть старше 24 часов

## Полезные ссылки

- [Telegram Login Widget Documentation](https://core.telegram.org/widgets/login)
- [Telegram Bot API](https://core.telegram.org/bots/api)
