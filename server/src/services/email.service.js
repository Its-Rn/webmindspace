import nodemailer from 'nodemailer';

import { appEnv } from '../config/env.js';

let cachedTransporter = null;

const getTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  if (appEnv.smtpHost && appEnv.smtpUser && appEnv.smtpPass) {
    cachedTransporter = nodemailer.createTransport({
      host: appEnv.smtpHost,
      port: appEnv.smtpPort,
      secure: appEnv.smtpPort === 465,
      auth: {
        user: appEnv.smtpUser,
        pass: appEnv.smtpPass
      }
    });
    return cachedTransporter;
  }

  // Fallback to Ethereal Email for testing if no SMTP config is present
  const testAccount = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
  console.log('📧 Ethereal Email (Test SMTP) configured automatically for development.');
  
  return cachedTransporter;
};

export const sendEmail = async ({ to, subject, text, html, replyTo, cc, bcc }) => {
  const transporter = await getTransporter();
  const from = appEnv.emailFrom || appEnv.smtpUser || 'no-reply@ethereal.email';

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
    replyTo,
    cc,
    bcc
  });

  // If using the fallback Ethereal account, log the URL where the email can be viewed
  if (!appEnv.smtpHost) {
    console.log(`\n📧 Preview Email sent to [${to}]: ${nodemailer.getTestMessageUrl(info)}\n`);
  }

  return info;
};
