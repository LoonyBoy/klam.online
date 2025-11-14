import { Request, Response } from 'express';
import TelegramBot from 'node-telegram-bot-api';

/**
 * POST /api/telegram/check-channel
 * Проверяет, добавлен ли бот в канал и имеет ли админ права
 */
export async function checkTelegramChannel(req: Request, res: Response) {
  try {
    const { channelUrl } = req.body;

    if (!channelUrl) {
      return res.status(400).json({
        success: false,
        error: 'channelUrl is required'
      });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN not set in .env');
      return res.status(500).json({
        success: false,
        error: 'Telegram bot token not configured'
      });
    }

    // Извлекаем chat_id из разных форматов URL
    let chatId: string | number = channelUrl.trim();

    // Если это web.telegram.org URL, извлекаем ID
    if (channelUrl.includes('web.telegram.org')) {
      const match = channelUrl.match(/#(-?\d+)/);
      if (match) {
        chatId = match[1];
      }
    }
    // Если это t.me URL с username
    else if (channelUrl.includes('t.me/')) {
      const match = channelUrl.match(/t\.me\/([^/?]+)/);
      if (match) {
        chatId = '@' + match[1];
      }
    }
    // Если это просто число
    else if (/^-?\d+$/.test(channelUrl)) {
      chatId = channelUrl;
    }

    console.log('🔍 Checking Telegram channel:', { original: channelUrl, parsed: chatId });

    // Создаём экземпляр бота
    const bot = new TelegramBot(botToken, { polling: false });

    try {
      // Получаем информацию о боте
      const botInfo = await bot.getMe();
      console.log('🤖 Bot info:', botInfo);

      // Получаем информацию о чате
      const chat = await bot.getChat(chatId);
      console.log('💬 Chat info:', chat);

      // Проверяем, является ли бот администратором
      const chatMember = await bot.getChatMember(chatId, botInfo.id);
      console.log('👤 Bot member status:', chatMember);

      const isAdmin = chatMember.status === 'administrator' || chatMember.status === 'creator';
      const isMember = chatMember.status === 'member';
      
      // Если бот не является даже участником - ошибка
      if (!isAdmin && !isMember) {
        return res.status(403).json({
          success: false,
          error: 'Бот не добавлен в канал',
          details: {
            chatTitle: chat.title,
            botStatus: chatMember.status
          }
        });
      }

      // Если бот просто участник (не админ) - требуем сделать его администратором
      if (!isAdmin && isMember) {
        console.warn(`⚠️ Bot is member but not admin in chat: ${chat.title} (${chat.id})`);
        return res.status(403).json({
          success: false,
          needsAdmin: true,
          error: 'Бот не является администратором',
          message: 'Пожалуйста, сделайте бота администратором канала и нажмите "Проверить соединение" снова',
          channel: {
            id: chat.id,
            title: chat.title,
            type: chat.type,
            username: (chat as any).username,
            isAdmin: false
          }
        });
      }

      // Проверяем права администратора (разные для каналов и групп)
      const isChannel = chat.type === 'channel';
      const memberData = chatMember as any; // Используем any для доступа к специфичным полям
      
      const hasRequiredPermissions = 
        chatMember.status === 'creator' || 
        (isChannel 
          ? (memberData.can_post_messages || memberData.can_edit_messages) // Для каналов
          : (memberData.can_manage_chat || memberData.can_delete_messages || memberData.can_invite_users) // Для групп
        );

      if (!hasRequiredPermissions) {
        return res.json({
          success: true,
          warning: 'Бот является администратором, но имеет ограниченные права',
          channel: {
            id: chat.id,
            title: chat.title,
            type: chat.type,
            username: (chat as any).username,
            isAdmin: true,
            hasLimitedPermissions: true,
            permissions: isChannel ? {
              canPostMessages: memberData.can_post_messages,
              canEditMessages: memberData.can_edit_messages
            } : {
              canManageChat: memberData.can_manage_chat,
              canDeleteMessages: memberData.can_delete_messages,
              canInviteUsers: memberData.can_invite_users
            }
          }
        });
      }

      return res.json({
        success: true,
        message: 'Бот успешно добавлен в канал с правами администратора',
        channel: {
          id: chat.id,
          title: chat.title,
          type: chat.type,
          username: (chat as any).username
        }
      });

    } catch (botError: any) {
      console.error('❌ Telegram Bot API error:', botError);
      console.error('❌ Error code:', botError.response?.body?.error_code);
      console.error('❌ Error description:', botError.response?.body?.description);

      // Обработка конкретных ошибок Telegram API
      if (botError.response?.body?.error_code === 400) {
        return res.status(400).json({
          success: false,
          error: 'Неверный ID канала или бот не добавлен в канал',
          details: botError.response.body.description
        });
      }

      if (botError.response?.body?.error_code === 403) {
        return res.status(403).json({
          success: false,
          error: 'Бот не имеет доступа к каналу',
          details: botError.response.body.description
        });
      }

      // Дополнительная обработка распространённых ошибок
      if (botError.message?.includes('chat not found')) {
        return res.status(404).json({
          success: false,
          error: 'Канал не найден. Убедитесь, что бот добавлен в канал и ID указан правильно.',
          details: 'Chat not found'
        });
      }

      if (botError.message?.includes('bot is not a member')) {
        return res.status(403).json({
          success: false,
          error: 'Бот не является участником канала. Добавьте бота в канал.',
          details: botError.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Не удалось проверить канал',
        details: botError.message || botError.response?.body?.description || 'Unknown error'
      });
    }

  } catch (error) {
    console.error('❌ Error in checkTelegramChannel:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
