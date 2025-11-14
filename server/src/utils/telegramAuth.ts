import crypto from 'crypto';

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/**
 * Верифицирует данные авторизации от Telegram Login Widget
 * @param data - данные от Telegram
 * @param botToken - токен бота из .env
 * @returns true если данные подлинные
 */
export function verifyTelegramAuth(data: TelegramAuthData, botToken: string): boolean {
  const { hash, ...userData } = data;

  // Проверяем, что auth_date не старше 24 часов (86400 секунд)
  const currentTime = Math.floor(Date.now() / 1000);
  if (currentTime - data.auth_date > 86400) {
    console.warn('⚠️ Telegram auth_date is too old');
    return false;
  }

  // Создаем строку для проверки
  const dataCheckString = Object.keys(userData)
    .sort()
    .map((key) => `${key}=${userData[key as keyof typeof userData]}`)
    .join('\n');

  // Создаем секретный ключ из токена бота
  const secretKey = crypto
    .createHash('sha256')
    .update(botToken)
    .digest();

  // Создаем HMAC подпись
  const hmac = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // Сравниваем подписи
  return hmac === hash;
}
