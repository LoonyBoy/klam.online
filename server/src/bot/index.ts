import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { parseStatusCommands, formatStatusChangeResponse } from '../utils/statusAliases';
import { query } from '../db';

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

    // Обработчик всех текстовых сообщений для парсинга алиасов статусов
    bot.on('message', async (msg) => {
      try {
        // Пропускаем сообщения без текста или команды (начинающиеся с /)
        if (!msg.text || msg.text.startsWith('/')) {
          return;
        }

        // Парсим сообщение на наличие команд смены статуса
        const commands = parseStatusCommands(msg.text);
        
        if (commands.length === 0) {
          return; // Нет команд смены статуса
        }

        console.log(`📋 Detected ${commands.length} status change command(s) in chat ${msg.chat.id}`);

        // Обрабатываем каждую команду
        for (const command of commands) {
          try {
            // Находим проект по chat_id через project_channels
            const [projects] = await query<any[]>(
              `SELECT p.id, p.code, p.name 
               FROM projects p
               JOIN project_channels pc ON p.id = pc.project_id
               WHERE pc.telegram_chat_id = ?`,
              [msg.chat.id.toString()]
            );

            if (!projects || projects.length === 0) {
              console.log(`⚠️ No project found for chat ${msg.chat.id}`);
              continue;
            }

            const project = projects[0];

            // Находим альбом по коду в проекте
            const [albums] = await query<any[]>(
              `SELECT a.id, a.status_id, a.code, a.name 
               FROM albums a 
               WHERE a.project_id = ? AND a.code = ?`,
              [project.id, command.albumCode]
            );

            if (!albums || albums.length === 0) {
              await bot?.sendMessage(
                msg.chat.id,
                `⚠️ Альбом ${command.albumCode} не найден в проекте "${project.name}"`,
                { reply_to_message_id: msg.message_id }
              );
              continue;
            }

            const album = albums[0];
            const oldStatusId = album.status_id;

            // Получаем ID нового статуса
            const [statuses] = await query<any[]>(
              'SELECT id FROM album_statuses WHERE code = ?',
              [command.statusCode]
            );

            if (!statuses || statuses.length === 0) {
              console.error(`❌ Status code ${command.statusCode} not found`);
              continue;
            }

            const newStatusId = statuses[0].id;

            // Обновляем статус альбома
            await query(
              `UPDATE albums 
               SET status_id = ?, last_status_at = NOW(), updated_at = NOW() 
               WHERE id = ?`,
              [newStatusId, album.id]
            );

            // Записываем в историю
            await query(
              `INSERT INTO album_status_history 
               (album_id, old_status_id, new_status_id, changed_by_telegram_id, created_at) 
               VALUES (?, ?, ?, ?, NOW())`,
              [album.id, oldStatusId, newStatusId, msg.from?.id || null]
            );

            // Отправляем подтверждение
            const response = formatStatusChangeResponse(command.albumCode, command.statusCode, true);
            await bot?.sendMessage(msg.chat.id, response, {
              reply_to_message_id: msg.message_id,
            });

            console.log(`✅ Updated album ${command.albumCode} status to ${command.statusCode}`);

          } catch (error) {
            console.error(`❌ Error processing command for ${command.albumCode}:`, error);
            await bot?.sendMessage(
              msg.chat.id,
              formatStatusChangeResponse(command.albumCode, command.statusCode, false),
              { reply_to_message_id: msg.message_id }
            );
          }
        }

      } catch (error) {
        console.error('❌ Error handling message:', error);
      }
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
