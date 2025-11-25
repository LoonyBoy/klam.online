// ============================================================================
// KLAM.ONLINE - Status Aliases Parser
// Парсер коротких алиасов для смены статусов альбомов через Telegram
// ============================================================================

/**
 * Маппинг алиасов на коды статусов
 */
const STATUS_ALIASES: Record<string, string> = {
  // Ожидание
  'ожидание': 'waiting',
  'ожидаем': 'waiting',
  'ожидает': 'waiting',
  '⏳': 'waiting',
  
  // Выгрузка
  'выгрузка': 'upload',
  'загрузка': 'upload',
  'выгрузил': 'upload',
  'загрузил': 'upload',
  '📤': 'upload',
  '⬆️': 'upload',
  
  // Отправлено
  'отправлено': 'sent',
  'отправил': 'sent',
  'отправила': 'sent',
  'отправили': 'sent',
  '→': 'sent',
  '➡️': 'sent',
  '✉️': 'sent',
  
  // Принято
  'принято': 'accepted',
  'принял': 'accepted',
  'приняла': 'accepted',
  'приняли': 'accepted',
  'ок': 'accepted',
  'ok': 'accepted',
  '+': 'accepted',
  '✓': 'accepted',
  '✅': 'accepted',
  '👍': 'accepted',
  
  // Замечания
  'замечания': 'remarks',
  'замечание': 'remarks',
  'доработка': 'remarks',
  'доработать': 'remarks',
  '!': 'remarks',
  '!!': 'remarks',
  '❌': 'remarks',
  '⚠️': 'remarks',
  '👎': 'remarks',
  
  // В производстве
  'производство': 'production',
  'впроизводстве': 'production',
  'впроизводство': 'production',
  '🏭': 'production',
  '⚙️': 'production',
};

/**
 * Регулярное выражение для поиска паттернов смены статуса
 * Формат: <КОД_АЛЬБОМА> <АЛИАС_СТАТУСА>
 * Примеры: "АР-001 ок", "КР-002 +", "АР-003 замечания"
 */
const ALBUM_STATUS_PATTERN = /([А-ЯA-Z]{2,4}-\d{3,4})\s+(.+?)(?:\s|$)/gi;

/**
 * Интерфейс распознанной команды смены статуса
 */
export interface StatusChangeCommand {
  albumCode: string;
  statusCode: string;
  originalAlias: string;
}

/**
 * Парсит текст сообщения и извлекает команды смены статуса
 * @param text Текст сообщения из Telegram
 * @returns Массив распознанных команд смены статуса
 */
export function parseStatusCommands(text: string): StatusChangeCommand[] {
  const commands: StatusChangeCommand[] = [];
  const matches = text.matchAll(ALBUM_STATUS_PATTERN);

  for (const match of matches) {
    const albumCode = match[1].toUpperCase();
    const alias = match[2].trim().toLowerCase();
    
    // Проверяем, является ли алиас валидным статусом
    const statusCode = STATUS_ALIASES[alias];
    
    if (statusCode) {
      commands.push({
        albumCode,
        statusCode,
        originalAlias: alias,
      });
    }
  }

  return commands;
}

/**
 * Проверяет, содержит ли сообщение команды смены статуса
 * @param text Текст сообщения
 * @returns true, если сообщение содержит команды смены статуса
 */
export function hasStatusCommands(text: string): boolean {
  return parseStatusCommands(text).length > 0;
}

/**
 * Получает код статуса по алиасу
 * @param alias Алиас статуса
 * @returns Код статуса или undefined, если алиас не найден
 */
export function getStatusByAlias(alias: string): string | undefined {
  return STATUS_ALIASES[alias.toLowerCase()];
}

/**
 * Получает все доступные алиасы для статуса
 * @param statusCode Код статуса
 * @returns Массив алиасов
 */
export function getAliasesForStatus(statusCode: string): string[] {
  return Object.entries(STATUS_ALIASES)
    .filter(([_, code]) => code === statusCode)
    .map(([alias]) => alias);
}

/**
 * Форматирует результат смены статуса для ответа в Telegram
 * @param albumCode Код альбома
 * @param statusCode Код нового статуса
 * @param success Успешность операции
 * @returns Текст ответа
 */
export function formatStatusChangeResponse(
  albumCode: string,
  statusCode: string,
  success: boolean
): string {
  const statusEmojis: Record<string, string> = {
    waiting: '⏳',
    upload: '📤',
    sent: '✉️',
    accepted: '✅',
    remarks: '⚠️',
    production: '🏭',
  };

  const statusNames: Record<string, string> = {
    waiting: 'Ожидание',
    upload: 'Выгрузка',
    sent: 'Отправлено',
    accepted: 'Принято',
    remarks: 'Замечания',
    production: 'В производстве',
  };

  const emoji = statusEmojis[statusCode] || '📋';
  const name = statusNames[statusCode] || statusCode;

  if (success) {
    return `${emoji} Альбом ${albumCode} → ${name}`;
  } else {
    return `❌ Не удалось изменить статус альбома ${albumCode}`;
  }
}
