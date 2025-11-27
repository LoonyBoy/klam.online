// ============================================================================
// KLAMBOT.RU - Email Service
// Сервис для отправки email уведомлений
// ============================================================================

import nodemailer from 'nodemailer';

interface AlbumNotificationData {
  albumCode: string;
  albumName: string;
  albumLink?: string;
  projectName: string;
  companyName: string;
  customerEmail: string;
  customerName: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Инициализация транспорта для отправки email
   */
  private initialize() {
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    };

    // Проверяем что настройки email заданы
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn('⚠️ Email service not configured. Set SMTP_USER and SMTP_PASSWORD in .env');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport(emailConfig);
      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
    }
  }

  /**
   * Отправка уведомления заказчику о том, что альбом отправлен
   */
  async sendAlbumSentNotification(data: AlbumNotificationData): Promise<boolean> {
    if (!this.transporter) {
      console.warn('⚠️ Email service not available, skipping email notification');
      return false;
    }

    try {
      const subject = `Альбом "${data.albumCode}" отправлен на проверку`;
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
            .album-info { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .album-info h3 { margin-top: 0; color: #1f2937; }
            .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .info-label { font-weight: bold; color: #6b7280; }
            .info-value { color: #1f2937; }
            .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📤 Альбом отправлен на проверку</h1>
            </div>
            <div class="content">
              <p>Здравствуйте, <strong>${data.customerName}</strong>!</p>
              
              <p>Уведомляем вас о том, что альбом был отправлен на проверку.</p>
              
              <div class="album-info">
                <h3>Информация об альбоме</h3>
                <div class="info-row">
                  <span class="info-label">Шифр альбома:</span>
                  <span class="info-value">${data.albumCode}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Название:</span>
                  <span class="info-value">${data.albumName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Проект:</span>
                  <span class="info-value">${data.projectName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Компания:</span>
                  <span class="info-value">${data.companyName}</span>
                </div>
              </div>
              
              ${data.albumLink ? `
                <p>Вы можете ознакомиться с альбомом по следующей ссылке:</p>
                <center>
                  <a href="${data.albumLink}" class="button">Открыть альбом</a>
                </center>
              ` : ''}
              
              <p>Просим вас проверить альбом и оставить комментарии в случае необходимости.</p>
              
              <p>С уважением,<br>Команда <strong>${data.companyName}</strong></p>
            </div>
            <div class="footer">
              <p>Это автоматическое уведомление от системы KlamBot.ru</p>
              <p>Пожалуйста, не отвечайте на это письмо</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"${data.companyName} - KlamBot.ru" <${process.env.SMTP_USER}>`,
        to: data.customerEmail,
        subject: subject,
        html: html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  /**
   * Проверка работоспособности email сервиса
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

// Экспортируем singleton
export const emailService = new EmailService();
