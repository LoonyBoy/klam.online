// ============================================================================
// KLAMBOT.RU - Telegram Channel Parser
// Утилита для парсинга Telegram ID каналов и ссылок
// ============================================================================

/**
 * Результат парсинга Telegram канала
 */
export interface TelegramChannelInfo {
  chatId: string | null;
  inviteLink: string | null;
  username: string | null;
}

/**
 * Парсит Telegram канал (ID или ссылку) и извлекает информацию
 * @param input ID канала или ссылка (например: "-4994560833" или "https://t.me/mychannel")
 * @returns Объект с информацией о канале
 */
export function parseTelegramChannel(input: string): TelegramChannelInfo {
  const trimmedInput = input.trim();

  // Случай 1: Просто Chat ID (начинается с минуса и содержит только цифры)
  // Примеры: "-4994560833", "-100123456789"
  if (/^-\d+$/.test(trimmedInput)) {
    return {
      chatId: trimmedInput,
      inviteLink: null,
      username: null,
    };
  }

  // Случай 2: Ссылка на публичный канал t.me/username
  // Примеры: "https://t.me/mychannel", "t.me/mychannel", "@mychannel"
  const publicChannelMatch = trimmedInput.match(/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)/);
  if (publicChannelMatch) {
    const username = publicChannelMatch[1];
    return {
      chatId: null, // Для публичных каналов Chat ID нужно получать через Bot API
      inviteLink: `https://t.me/${username}`,
      username: username,
    };
  }

  // Случай 3: Username с @ (например: @mychannel)
  const usernameMatch = trimmedInput.match(/^@([a-zA-Z0-9_]+)$/);
  if (usernameMatch) {
    const username = usernameMatch[1];
    return {
      chatId: null,
      inviteLink: `https://t.me/${username}`,
      username: username,
    };
  }

  // Случай 4: Приватная ссылка-приглашение (t.me/+hash)
  // Примеры: "https://t.me/+AbcDefGhiJk", "t.me/+AbcDefGhiJk"
  const privateInviteMatch = trimmedInput.match(/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/\+([a-zA-Z0-9_-]+)/);
  if (privateInviteMatch) {
    return {
      chatId: null, // Chat ID можно получить только когда бот присоединится
      inviteLink: `https://t.me/+${privateInviteMatch[1]}`,
      username: null,
    };
  }

  // Случай 5: Старый формат приватных ссылок (joinchat/)
  // Примеры: "https://t.me/joinchat/AbcDefGhiJk"
  const oldPrivateInviteMatch = trimmedInput.match(/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/joinchat\/([a-zA-Z0-9_-]+)/);
  if (oldPrivateInviteMatch) {
    return {
      chatId: null,
      inviteLink: `https://t.me/joinchat/${oldPrivateInviteMatch[1]}`,
      username: null,
    };
  }

  // Если ничего не подошло, возвращаем как есть
  console.warn(`⚠️ Could not parse Telegram channel: "${input}"`);
  return {
    chatId: null,
    inviteLink: trimmedInput,
    username: null,
  };
}

/**
 * Проверяет, является ли строка валидным Chat ID
 * @param input Строка для проверки
 * @returns true, если это Chat ID
 */
export function isTelegramChatId(input: string): boolean {
  return /^-\d+$/.test(input.trim());
}

/**
 * Проверяет, является ли строка ссылкой на Telegram канал
 * @param input Строка для проверки
 * @returns true, если это ссылка
 */
export function isTelegramLink(input: string): boolean {
  return /(?:https?:\/\/)?(?:t\.me|telegram\.me)\//.test(input.trim());
}

/**
 * Форматирует Chat ID для отображения
 * @param chatId Chat ID канала
 * @returns Форматированный Chat ID
 */
export function formatChatId(chatId: string): string {
  return chatId.startsWith('-') ? chatId : `-${chatId}`;
}
