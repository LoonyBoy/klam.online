import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { parseStatusCommands, formatStatusChangeResponse, getReactionEmojiForStatus } from '../utils/statusAliases';
import { query } from '../db';
import { wsManager } from '../websocket';
import { emailService } from '../services/emailService';

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

        // Проверяем, что бота добавили или повысили до администратора
        const wasAdded = 
          (oldStatus === 'left' || oldStatus === 'kicked') && 
          (newStatus === 'member' || newStatus === 'administrator');
        
        const wasPromoted = oldStatus === 'member' && newStatus === 'administrator';

        // Бота добавили в канал/группу
        if (wasAdded) {
          console.log(`✅ Bot added to chat: ${chat.title} (${chat.id}) as ${newStatus}`);

          // Пытаемся получить существующую invite-ссылку канала через getChat
          let existingInviteLink = '';
          try {
            const chatInfo = await bot?.getChat(chat.id);
            if (chatInfo?.invite_link) {
              existingInviteLink = chatInfo.invite_link;
              console.log(`🔗 Found existing invite link for chat ${chat.id}: ${existingInviteLink}`);
            }
          } catch (chatError) {
            console.log(`⚠️ Could not get chat info for ${chat.id}:`, chatError);
          }

          // Пытаемся связать с проектом по invite-ссылке
          if (existingInviteLink) {
            try {
              const updateResult = await query(
                `UPDATE project_channels 
                 SET telegram_chat_id = ?, telegram_chat_title = ?
                 WHERE invite_link = ? AND (telegram_chat_id IS NULL OR telegram_chat_id = '')`,
                [chat.id.toString(), chat.title, existingInviteLink]
              );
              
              if ((updateResult as any).affectedRows > 0) {
                console.log(`✅ Linked chat ${chat.id} (${chat.title}) to project by invite link`);
              }
            } catch (dbError) {
              console.log(`⚠️ Could not link chat to project:`, dbError);
            }
          }

          // Если сразу добавили как администратора — создаём invite-ссылку и сохраняем в БД
          let inviteLink = existingInviteLink;
          if (newStatus === 'administrator') {
            try {
              // Создаём новую invite-ссылку
              const exportedLink = await bot?.exportChatInviteLink(chat.id);
              if (exportedLink) {
                inviteLink = exportedLink;
                console.log(`🔗 Created invite link for chat ${chat.id}: ${inviteLink}`);
                
                // Сохраняем invite_link в БД (если уже есть запись с этим chat_id)
                const updateResult = await query(
                  `UPDATE project_channels 
                   SET invite_link = ?, telegram_chat_title = ?
                   WHERE telegram_chat_id = ?`,
                  [inviteLink, chat.title, chat.id.toString()]
                );
                
                if ((updateResult as any).affectedRows > 0) {
                  console.log(`✅ Saved invite_link to project_channels for chat ${chat.id}`);
                }
              }
            } catch (linkError) {
              console.log(`⚠️ Could not create invite link for chat ${chat.id}:`, linkError);
            }
          }

          // Формируем сообщение с chat_id
          let message = `🤖 <b>KLAM Bot активирован!</b>\n\n`;
          message += `📋 <b>ID канала для привязки проекта:</b>\n`;
          message += `<code>${chat.id}</code>\n\n`;
          message += `Скопируйте этот ID и вставьте при создании проекта на KlamBot.ru\n\n`;
          message += `✅ Бот готов к работе!`;

          await bot?.sendMessage(chat.id, message, { 
            parse_mode: 'HTML',
            disable_notification: false
          });

          console.log(`✅ Welcome message sent to ${chat.id}`);
        }

        // Бота повысили до администратора (был member, стал administrator)
        if (wasPromoted) {
          console.log(`✅ Bot promoted to administrator in chat: ${chat.title} (${chat.id})`);
          
          // Создаём invite-ссылку и сохраняем в БД
          let inviteLink = '';
          let projectLinked = false;
          try {
            const exportedLink = await bot?.exportChatInviteLink(chat.id);
            if (exportedLink) {
              inviteLink = exportedLink;
              console.log(`🔗 Created invite link for chat ${chat.id}: ${inviteLink}`);
              
              // Обновляем invite_link в project_channels если есть запись с этим chat_id
              const updateResult = await query(
                `UPDATE project_channels 
                 SET invite_link = ?, telegram_chat_title = ?
                 WHERE telegram_chat_id = ?`,
                [inviteLink, chat.title, chat.id.toString()]
              );
              
              if ((updateResult as any).affectedRows > 0) {
                console.log(`✅ Saved invite_link to project_channels for chat ${chat.id}`);
                projectLinked = true;
              } else {
                console.log(`ℹ️ No project found with chat_id ${chat.id} yet`);
              }
            }
          } catch (linkError) {
            console.log(`⚠️ Could not create invite link for chat ${chat.id}:`, linkError);
          }
          
          let message = `✅ <b>Бот получил права администратора!</b>\n\n`;
          if (projectLinked) {
            message += `Теперь бот полноценно подключен к проекту.`;
          } else {
            message += `📋 <b>ID канала:</b> <code>${chat.id}</code>\n\n`;
            message += `Укажите этот ID при создании проекта на KlamBot.ru`;
          }
          
          await bot?.sendMessage(chat.id, message, { parse_mode: 'HTML' });
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
          `👋 <b>Привет! Я KLAM Bot.</b>\n\n` +
          `📋 <b>Как подключить бота к проекту:</b>\n\n` +
          `1️⃣ Создайте канал или группу в Telegram\n` +
          `2️⃣ Добавьте меня в канал\n` +
          `3️⃣ Сделайте меня администратором с правом приглашать пользователей\n` +
          `4️⃣ Я автоматически отправлю ссылку для подключения\n` +
          `5️⃣ Скопируйте ссылку при создании проекта на KlamBot.ru`,
          { parse_mode: 'HTML' }
        );
      } else {
        // В группе/канале пробуем получить ссылку
        let inviteLink = '';
        try {
          const exportedLink = await bot?.exportChatInviteLink(chatId);
          if (exportedLink) {
            inviteLink = exportedLink;
          }
        } catch (e) {
          // Игнорируем ошибку
        }

        if (inviteLink) {
          await bot?.sendMessage(
            chatId,
            `🤖 <b>KLAM Bot активен!</b>\n\n` +
            `🔗 <b>Ссылка для подключения проекта:</b>\n` +
            `<code>${inviteLink}</code>\n\n` +
            `📋 Скопируйте эту ссылку при создании проекта на KlamBot.ru`,
            { parse_mode: 'HTML' }
          );
        } else {
          await bot?.sendMessage(
            chatId,
            `🤖 <b>KLAM Bot активен!</b>\n\n` +
            `⚠️ Для получения ссылки сделайте бота администратором с правом приглашать пользователей.\n\n` +
            `После этого напишите /link`,
            { parse_mode: 'HTML' }
          );
        }
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

    // Обработчик команды /link - получить и сохранить invite-ссылку
    bot.onText(/\/link/, async (msg) => {
      const chatId = msg.chat.id;
      const chatType = msg.chat.type;

      if (chatType === 'private') {
        await bot?.sendMessage(chatId, '❌ Эта команда работает только в группах и каналах.');
        return;
      }

      try {
        // Пробуем экспортировать invite-ссылку
        const inviteLink = await bot?.exportChatInviteLink(chatId);
        
        if (inviteLink) {
          // Сначала пытаемся обновить запись по chat_id
          const updateResult = await query(
            `UPDATE project_channels 
             SET invite_link = ?, telegram_chat_title = ?
             WHERE telegram_chat_id = ?`,
            [inviteLink, msg.chat.title || '', chatId.toString()]
          );
          
          // Если не нашли по chat_id, пробуем связать по invite_link
          if ((updateResult as any).affectedRows === 0) {
            await query(
              `UPDATE project_channels 
               SET telegram_chat_id = ?, telegram_chat_title = ?
               WHERE invite_link = ? AND (telegram_chat_id IS NULL OR telegram_chat_id = '')`,
              [chatId.toString(), msg.chat.title || '', inviteLink]
            );
          }
          
          await bot?.sendMessage(
            chatId,
            `🔗 <b>Ссылка на канал:</b>\n\n` +
            `<code>${inviteLink}</code>\n\n` +
            `✅ Ссылка сохранена в системе.`,
            { parse_mode: 'HTML' }
          );
        }
      } catch (error: any) {
        console.error('❌ Error getting invite link:', error);
        await bot?.sendMessage(
          chatId,
          `❌ Не удалось получить ссылку.\n\n` +
          `Убедитесь, что бот имеет права администратора с возможностью приглашать пользователей.`,
          { parse_mode: 'HTML' }
        );
      }
    });

    // Обработчик всех текстовых сообщений для парсинга алиасов статусов
    bot.on('message', async (msg) => {
      try {
        // Пропускаем сообщения без текста или команды (начинающиеся с /)
        if (!msg.text || msg.text.startsWith('/')) {
          return;
        }

        const chatId = msg.chat.id.toString();

        console.log(`📩 Received message: "${msg.text}" from chat ${chatId}`);

        // Парсим сообщение на наличие команд смены статуса
        const commands = parseStatusCommands(msg.text);
        
        console.log(`🔍 Parsed commands:`, commands);
        
        if (commands.length === 0) {
          console.log(`⚠️ No status commands found in message`);
          return; // Нет команд смены статуса
        }

        console.log(`📋 Detected ${commands.length} status change command(s) in chat ${chatId}`);

        // Обрабатываем каждую команду
        for (const command of commands) {
          try {
            // Находим проект по chat_id через project_channels
            const projects = await query<any[]>(
              `SELECT p.id, p.code, p.name 
               FROM projects p
               JOIN project_channels pc ON p.id = pc.project_id
               WHERE pc.telegram_chat_id = ?`,
              [msg.chat.id.toString()]
            );

            console.log(`🔍 Found projects:`, projects);

            if (!projects || projects.length === 0) {
              console.log(`⚠️ No project found for chat ${msg.chat.id}`);
              continue;
            }

            const project = projects[0];
            console.log(`📁 Using project:`, project);

            if (!project || !project.id) {
              console.error(`❌ Project data is invalid:`, project);
              continue;
            }

            // Находим альбом по коду в проекте
            const albums = await query<any[]>(
              `SELECT a.id, a.status_id, a.code, a.name, a.customer_id, a.link 
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
            console.log('📀 Album data:', JSON.stringify(album, null, 2));

            // Получаем ID нового статуса
            const statuses = await query<any[]>(
              'SELECT id FROM album_statuses WHERE code = ?',
              [command.statusCode]
            );

            if (!statuses || statuses.length === 0) {
              console.error(`❌ Status code ${command.statusCode} not found`);
              continue;
            }

            const newStatusId = statuses[0].id;

            // Обновляем статус альбома (и local_link если указан путь)
            if (command.localPath) {
              await query(
                `UPDATE albums 
                 SET status_id = ?, local_link = ?, last_status_at = NOW(), updated_at = NOW() 
                 WHERE id = ?`,
                [newStatusId, command.localPath, album.id]
              );
              console.log(`📂 Updated local_link for album ${command.albumCode}: ${command.localPath}`);
            } else {
              await query(
                `UPDATE albums 
                 SET status_id = ?, last_status_at = NOW(), updated_at = NOW() 
                 WHERE id = ?`,
                [newStatusId, album.id]
              );
            }

            // Записываем событие в album_events
            await query(
              `INSERT INTO album_events 
               (album_id, status_id, created_at, source, telegram_message_id) 
               VALUES (?, ?, NOW(), 'telegram', ?)`,
              [
                album.id, 
                newStatusId, 
                msg.message_id
              ]
            );

            // Отправляем обновление в реальном времени через WebSocket
            wsManager.broadcastAlbumStatusUpdate(album.id, project.id, project.company_id || 0, {
              albumCode: command.albumCode,
              albumName: album.name,
              oldStatusId,
              newStatusId,
              statusCode: command.statusCode,
            });

            // Если статус изменен на "Отправлено" (sent), отправляем email заказчику
            if (command.statusCode === 'sent') {
              try {
                // Получаем информацию о заказчике альбома напрямую из participants
                const customers = await query<any>(
                  `SELECT p.email, p.first_name, p.last_name
                   FROM participants p
                   WHERE p.id = ?`,
                  [album.customer_id]
                );

                console.log('📧 Customer data:', customers);

                if (customers && customers.length > 0 && customers[0].email) {
                  const customer = customers[0];
                  await emailService.sendAlbumSentNotification({
                    albumCode: command.albumCode,
                    albumName: album.name,
                    albumLink: album.link || '',
                    projectName: project.name,
                    companyName: 'KlamBot.ru', // TODO: Get from company table
                    customerEmail: customer.email,
                    customerName: `${customer.first_name} ${customer.last_name || ''}`.trim(),
                  });
                  console.log(`📧 Email notification sent to ${customer.email}`);
                } else {
                  console.log('⚠️ Customer email not found, skipping email notification');
                  console.log('📧 Album customer_id:', album.customer_id);
                }
              } catch (emailError) {
                console.error('❌ Failed to send email notification:', emailError);
                // Не прерываем процесс, если email не отправился
              }
            }

            // Ставим реакцию на сообщение (если не получается - отправляем текст)
            try {
              const reactionEmoji = getReactionEmojiForStatus(command.statusCode) as any;
              await bot?.setMessageReaction(msg.chat.id, msg.message_id, {
                reaction: [{ type: 'emoji', emoji: reactionEmoji }],
                is_big: false
              });
              console.log(`✅ Set reaction ${reactionEmoji} for album ${command.albumCode}`);
              
              // Если был сохранён путь, отправляем дополнительное уведомление
              if (command.localPath) {
                await bot?.sendMessage(
                  msg.chat.id,
                  `📂 Путь сохранён для ${command.albumCode}: ${command.localPath}`,
                  { reply_to_message_id: msg.message_id }
                );
              }
            } catch (reactionError) {
              // Если не удалось поставить реакцию (например, в приватном канале),
              // отправляем короткое текстовое подтверждение
              const response = formatStatusChangeResponse(command.albumCode, command.statusCode, true, command.localPath);
              try {
                await bot?.sendMessage(msg.chat.id, response, {
                  reply_to_message_id: msg.message_id,
                });
              } catch (sendError) {
                await bot?.sendMessage(msg.chat.id, response);
              }
            }

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
