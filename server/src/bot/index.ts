import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

let bot: TelegramBot | null = null;

/**
 * Инициализация Telegram бота
 */
export function initBot() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    console.error('❌ TELEGRAM_BOT_TOKEN not set in .env');
    return null;
  }

  try {
    // Создаём экземпляр бота с polling
    bot = new TelegramBot(botToken, { polling: true });

    console.log('🤖 Telegram bot started');

    // Обработчик события добавления бота в канал/группу
    bot.on('my_chat_member', async (update) => {
      try {
        const chat = update.chat;
        const newStatus = update.new_chat_member.status;
        const oldStatus = update.old_chat_member.status;

        // Проверяем, что бота добавили (изменился статус на member или administrator)
        const wasAdded = 
          (oldStatus === 'left' || oldStatus === 'kicked') && 
          (newStatus === 'member' || newStatus === 'administrator');

        if (wasAdded) {
          console.log(`✅ Bot added to chat: ${chat.title} (${chat.id})`);

          // Формируем сообщение с информацией о чате
          let message = `🤖 <b>KLAM Bot активирован!</b>\n\n`;
          message += `📋 <b>Информация о чате:</b>\n`;
          message += `• <b>ID чата:</b> <code>${chat.id}</code>\n`;
          message += `• <b>Название:</b> ${chat.title}\n`;
          message += `• <b>Тип:</b> ${chat.type === 'channel' ? 'Канал' : chat.type === 'supergroup' ? 'Супергруппа' : 'Группа'}\n`;
          
          if ((chat as any).username) {
            message += `• <b>Username:</b> @${(chat as any).username}\n`;
          }

          message += `\n💡 <b>Как использовать ID чата:</b>\n`;
          message += `Скопируйте ID чата <code>${chat.id}</code> и вставьте его в форму создания проекта в KLAM.Online.\n\n`;
          message += `Бот готов к работе! 🚀`;

          // Отправляем сообщение в чат
          await bot?.sendMessage(chat.id, message, { 
            parse_mode: 'HTML',
            disable_notification: false
          });

          console.log(`✅ Welcome message sent to ${chat.id}`);
        }

        // Проверяем, что бота сделали администратором
        if (oldStatus === 'member' && newStatus === 'administrator') {
          console.log(`✅ Bot promoted to administrator in chat: ${chat.title} (${chat.id})`);
          
          await bot?.sendMessage(
            chat.id, 
            `✅ Отлично! Бот получил права администратора.\n\nТеперь можно использовать этот канал для проекта в KLAM.Online.`,
            { parse_mode: 'HTML' }
          );
        }

      } catch (error) {
        console.error('❌ Error handling my_chat_member event:', error);
      }
    });

    // Обработчик команды /start
    bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const chatType = msg.chat.type;

      if (chatType === 'private') {
        await bot?.sendMessage(
          chatId,
          `👋 Привет! Я KLAM Bot.\n\n` +
          `Добавь меня в свой канал или группу для управления проектами.\n\n` +
          `После добавления я отправлю ID чата, который нужен для настройки проекта в KLAM.Online.`
        );
      } else {
        await bot?.sendMessage(
          chatId,
          `🤖 KLAM Bot активен в этом чате!\n\n` +
          `📋 ID чата: <code>${chatId}</code>\n\n` +
          `Используйте этот ID при создании проекта.`,
          { parse_mode: 'HTML' }
        );
      }
    });

    // Обработчик команды /chatid - получить ID текущего чата
    bot.onText(/\/chatid/, async (msg) => {
      const chatId = msg.chat.id;
      const chatTitle = msg.chat.title || 'Личный чат';
      const chatType = msg.chat.type;

      let message = `📋 <b>Информация о чате:</b>\n\n`;
      message += `• <b>ID:</b> <code>${chatId}</code>\n`;
      message += `• <b>Название:</b> ${chatTitle}\n`;
      message += `• <b>Тип:</b> ${chatType === 'channel' ? 'Канал' : chatType === 'supergroup' ? 'Супергруппа' : chatType === 'group' ? 'Группа' : 'Личный чат'}\n`;

      if ((msg.chat as any).username) {
        message += `• <b>Username:</b> @${(msg.chat as any).username}\n`;
      }

      await bot?.sendMessage(chatId, message, { parse_mode: 'HTML' });
    });

    // Обработчик ошибок polling
    bot.on('polling_error', (error) => {
      console.error('❌ Polling error:', error.message);
    });

    return bot;

  } catch (error) {
    console.error('❌ Failed to initialize bot:', error);
    return null;
  }
}

/**
 * Остановка бота
 */
export function stopBot() {
  if (bot) {
    bot.stopPolling();
    console.log('🛑 Telegram bot stopped');
  }
}

/**
 * Получить экземпляр бота
 */
export function getBot() {
  return bot;
}
