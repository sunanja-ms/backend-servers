import env from '../config/env.js';
import logger from '../utils/logger.js';

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
    logger.info({ to, subject }, `[EMAIL DEV] To: ${to} | Subject: ${subject}`);
    logger.info(`[EMAIL DEV] Body:\n${body}`);
    return
  }

  if (!env.SMTP_HOST) {
    logger.warn('SMTP not configured — email not sent');
    return
  }

  try {
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.default.createTransport({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT || '587', 10),
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
    await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, text: body })
    logger.info({ to, subject }, 'Email sent')
  } catch (err) {
    logger.error({ err, to, subject }, 'Failed to send email')
  }
}

export function buildVerifyEmailLink(token: string): string {
  return `${env.APP_URL}/verify-email?token=${token}`
}

export function buildResetPasswordLink(token: string): string {
  return `${env.APP_URL}/reset-password?token=${token}`
}
