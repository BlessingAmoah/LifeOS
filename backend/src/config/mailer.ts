import nodemailer from 'nodemailer';
import { config } from './env';

// Only create transporter if SMTP is configured
let transporter: nodemailer.Transporter | null = null;

if (config.smtp.host && config.smtp.user && config.smtp.pass) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465, // true for 465, false for other ports
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
  console.log('✓ SMTP transporter configured');
} else {
  console.warn('⚠️  SMTP not configured - email sending will be disabled');
  console.warn('⚠️  Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables to enable email');
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  if (!transporter) {
    console.warn(`⚠️  Email sending disabled - SMTP not configured. Would send to ${options.to}: ${options.subject}`);
    console.warn(`⚠️  Email content: ${options.text || options.html.substring(0, 100)}...`);
    // Don't throw error - allow registration to continue without email
    // In production, you should configure SMTP
    return;
  }

  try {
    await transporter.sendMail({
      from: `"LifeOS" <${config.smtp.user}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    console.log(`✓ Email sent successfully to ${options.to}`);
  } catch (error) {
    console.error('✗ Error sending email:', error);
    throw error;
  }
};

export const sendVerificationEmail = async (email: string, code: string): Promise<void> => {
  const html = `
    <h1>Verify your LifeOS account</h1>
    <p>Your verification code is: <strong>${code}</strong></p>
    <p>This code expires in 5 minutes. Please verify your account soon to complete registration.</p>
  `;

  const text = `Verify your LifeOS account\n\nYour verification code is: ${code}\n\nThis code expires in 5 minutes. Please verify your account soon to complete registration.`;

  await sendEmail({
    to: email,
    subject: 'Verify your LifeOS account',
    html,
    text,
  });
};
