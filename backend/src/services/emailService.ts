import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configuration nodemailer
    const emailConfig = {
      host: process.env.EMAIL_HOST || 'localhost',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: process.env.EMAIL_USER && process.env.EMAIL_PASSWORD ? {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      } : undefined
    };

    this.transporter = nodemailer.createTransport(emailConfig);
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('✅ Email service connected successfully');
      return true;
    } catch (error: any) {
      logger.warn('⚠️  Email service connection failed:', error.message);
      return false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@netadmin.local',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || ''
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`✅ Email sent to ${options.to} - Message ID: ${info.messageId}`);
      return true;
    } catch (error: any) {
      logger.error(`❌ Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, userName: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { 
              display: inline-block; 
              background: #667eea; 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
            }
            .footer { font-size: 12px; color: #666; margin-top: 20px; }
            .warning { color: #856404; background: #fff3cd; padding: 10px; border-radius: 4px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Réinitialisation de mot de passe</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${userName}</strong>,</p>
              
              <p>Vous avez demandé une réinitialisation de mot de passe pour votre compte NetAdmin Pro.</p>
              
              <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe :</p>
              
              <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
              
              <p>Ou copiez ce lien dans votre navigateur :</p>
              <p><code>${resetUrl}</code></p>
              
              <div class="warning">
                ⏰ <strong>Attention :</strong> Ce lien de réinitialisation expirera dans 1 heure.
              </div>
              
              <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
              
              <div class="footer">
                <p>© 2026 NetAdmin Pro. Tous droits réservés.</p>
                <p>Cet email a été envoyé à ${email}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
      Réinitialisation de mot de passe

      Bonjour ${userName},

      Cliquez sur ce lien pour réinitialiser votre mot de passe :
      ${resetUrl}

      Ce lien expirera dans 1 heure.

      Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

      © 2026 NetAdmin Pro
    `;

    return this.sendEmail({
      to: email,
      subject: '🔐 Réinitialisation de votre mot de passe NetAdmin Pro',
      html: htmlContent,
      text: textContent
    });
  }

  async sendPasswordResetConfirmation(email: string, userName: string): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { 
              display: inline-block; 
              background: #10b981; 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
            }
            .footer { font-size: 12px; color: #666; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Mot de passe réinitialisé</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${userName}</strong>,</p>
              
              <p>Votre mot de passe a été réinitialisé avec succès.</p>
              
              <p>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
              
              <a href="http://localhost:5173/login" class="button">Se connecter à NetAdmin Pro</a>
              
              <p>Si vous n'avez pas effectué cette action, contactez immédiatement un administrateur.</p>
              
              <div class="footer">
                <p>© 2026 NetAdmin Pro. Tous droits réservés.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '✅ Confirmation de réinitialisation de mot de passe',
      html: htmlContent
    });
  }

  async sendPasswordResetOTP(email: string, otp: string, userName: string): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp-box { 
              background: white; 
              padding: 20px; 
              margin: 20px 0;
              border: 2px solid #667eea;
              border-radius: 8px;
              text-align: center;
            }
            .otp-code {
              font-size: 32px;
              font-weight: bold;
              color: #667eea;
              letter-spacing: 4px;
              font-family: 'Courier New', monospace;
            }
            .warning { 
              background: #fef3c7; 
              border-left: 4px solid #f59e0b;
              padding: 12px;
              margin: 20px 0;
              border-radius: 4px;
              color: #92400e;
            }
            .footer { font-size: 12px; color: #666; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Code de vérification OTP</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${userName}</strong>,</p>
              
              <p>Vous avez demandé une réinitialisation de mot de passe. Voici votre code OTP :</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              
              <p><strong>Ce code expire dans 10 minutes.</strong></p>
              
              <div class="warning">
                <strong>⚠️  Important :</strong> Ne partagez jamais ce code avec quelqu'un d'autre. NetAdmin Pro ne vous le demandera jamais.
              </div>
              
              <p>Si vous n'avez pas demandé une réinitialisation de mot de passe, vous pouvez ignorer cet email.</p>
              
              <div class="footer">
                <p>© 2026 NetAdmin Pro. Tous droits réservés.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '🔐 Votre code de vérification OTP - NetAdmin Pro',
      html: htmlContent
    });
  }
}

export default new EmailService();
