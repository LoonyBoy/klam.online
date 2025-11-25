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
  'жду': 'waiting',
  'ждем': 'waiting',
  'ждёт': 'waiting',
  'hold': 'waiting',
  'pending': 'waiting',
  '⏳': 'waiting',
  '⏸️': 'waiting',
  '⌛': 'waiting',
  
  // Выгрузка
  'выгрузка': 'upload',
  'загрузка': 'upload',
  'выгрузил': 'upload',
  'загрузил': 'upload',
  'выгружаю': 'upload',
  'загружаю': 'upload',
  'выложил': 'upload',
  'upload': 'upload',
  '📤': 'upload',
  '⬆️': 'upload',
  '📂': 'upload',
  
  // Отправлено
  'отправлено': 'sent',
  'отправил': 'sent',
  'отправила': 'sent',
  'отправили': 'sent',
  'отправляю': 'sent',
  'sent': 'sent',
  'send': 'sent',
  'отпр': 'sent',
  'готово': 'sent',
  '→': 'sent',
  '➡️': 'sent',
  '✉️': 'sent',
  '📧': 'sent',
  '📮': 'sent',
  
  // Принято
  'принято': 'accepted',
  'принял': 'accepted',
  'приняла': 'accepted',
  'приняли': 'accepted',
  'принимаю': 'accepted',
  'ок': 'accepted',
  'ok': 'accepted',
  'окей': 'accepted',
  'okay': 'accepted',
  'good': 'accepted',
  'норм': 'accepted',
  'нормально': 'accepted',
  'отлично': 'accepted',
  'супер': 'accepted',
  'да': 'accepted',
  'yes': 'accepted',
  'approved': 'accepted',
  '+': 'accepted',
  '++': 'accepted',
  '✓': 'accepted',
  '✅': 'accepted',
  '👍': 'accepted',
  '👌': 'accepted',
  '💯': 'accepted',
  '🔥': 'accepted',
  
  // Замечания
  'замечания': 'remarks',
  'замечание': 'remarks',
  'доработка': 'remarks',
  'доработать': 'remarks',
  'исправить': 'remarks',
  'переделать': 'remarks',
  'правки': 'remarks',
  'корректировка': 'remarks',
  'нет': 'remarks',
  'no': 'remarks',
  'не': 'remarks',
  'отклонено': 'remarks',
  'rejected': 'remarks',
  'remarks': 'remarks',
  '!': 'remarks',
  '!!': 'remarks',
  '!!!': 'remarks',
  '-': 'remarks',
  '--': 'remarks',
  '❌': 'remarks',
  '⚠️': 'remarks',
  '⛔': 'remarks',
  '🚫': 'remarks',
  '👎': 'remarks',
  '🔴': 'remarks',
  
  // В производстве
  'производство': 'production',
  'впроизводстве': 'production',
  'впроизводство': 'production',
  'производим': 'production',
  'делаем': 'production',
  'работаем': 'production',
  'production': 'production',
  'prod': 'production',
  'wip': 'production',
  '🏭': 'production',
  '⚙️': 'production',
  '🔧': 'production',
  '⚡': 'production',
};

/**
 * Регулярное выражение для поиска кодов альбомов в тексте
 * Поддерживаются форматы: АР-001, АР001, КР1, OVVK-123, КР-1, АР-12
 */
const ALBUM_CODE_PATTERN = /(?:^|[^\wА-Яа-я])([А-ЯA-Z]{2,4}-?\d{1,4})(?:[^\wА-Яа-я]|$)/gi;

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
 * Логика: ищет код альбома в начале сообщения, затем проверяет весь текст на наличие алиасов статусов
 * @param text Текст сообщения из Telegram
 * @param validAlbumCodes Список валидных кодов альбомов (опционально, для фильтрации)
 * @returns Массив распознанных команд смены статуса
 */
export function parseStatusCommands(text: string, validAlbumCodes?: string[]): StatusChangeCommand[] {
  const commands: StatusChangeCommand[] = [];
  
  console.log(`[parseStatusCommands] Input text: "${text}"`);
  
  // Ищем все коды альбомов в тексте
  const albumMatches = text.matchAll(ALBUM_CODE_PATTERN);
  const foundAlbumCodes: string[] = [];
  
  for (const match of albumMatches) {
    const albumCode = match[1].toUpperCase();
    if (!foundAlbumCodes.includes(albumCode)) {
      foundAlbumCodes.push(albumCode);
    }
  }
  
  console.log(`[parseStatusCommands] Found album codes:`, foundAlbumCodes);
  
  // Если коды альбомов не найдены, возвращаем пустой массив
  if (foundAlbumCodes.length === 0) {
    console.log(`[parseStatusCommands] No album codes found`);
    return commands;
  }
  
  // Нормализуем текст для поиска алиасов
  const normalizedText = text.toLowerCase().trim();
  console.log(`[parseStatusCommands] Normalized text: "${normalizedText}"`);
  
  // Проверяем каждый найденный код альбома
  for (const albumCode of foundAlbumCodes) {
    // Ищем алиас статуса во всем тексте
    let foundStatusCode: string | null = null;
    let foundAlias: string | null = null;
    
    // Проходим по всем возможным алиасам и ищем совпадение
    for (const [alias, statusCode] of Object.entries(STATUS_ALIASES)) {
      // Ищем алиас как отдельное слово или эмодзи
      const aliasPattern = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b|${alias}`, 'i');
      if (aliasPattern.test(normalizedText)) {
        foundStatusCode = statusCode;
        foundAlias = alias;
        console.log(`[parseStatusCommands] Found alias "${alias}" -> status "${statusCode}" for album ${albumCode}`);
        break;
      }
    }
    
    // Если нашли алиас статуса, добавляем команду
    if (foundStatusCode && foundAlias) {
      commands.push({
        albumCode,
        statusCode: foundStatusCode,
        originalAlias: foundAlias,
      });
    } else {
      console.log(`[parseStatusCommands] No status alias found for album ${albumCode}`);
    }
  }

  console.log(`[parseStatusCommands] Final commands:`, commands);
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

/**
 * Получить эмодзи реакции для статуса (для Telegram reactions)
 * Использует только официально поддерживаемые эмодзи для реакций Telegram Bot API
 * @param statusCode Код статуса
 * @returns Эмодзи для реакции
 */
export function getReactionEmojiForStatus(statusCode: string): string {
  const reactions: Record<string, string> = {
    waiting: '👀',      // Ожидание → глаза (следит)
    upload: '🔥',       // Выгрузка → огонь (загрузка)
    sent: '✍',         // Отправлено → пишет
    accepted: '👍',     // Принято → лайк
    remarks: '🤔',      // Замечания → думает
    production: '🏆',   // В производстве → трофей (результат)
  };
  return reactions[statusCode] || '👌';
}
