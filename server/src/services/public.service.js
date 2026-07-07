import { appEnv } from '../config/env.js';
import { sendEmail } from './email.service.js';

const escapeHtml = (value) => {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};

const resolveContactRecipient = () => {
  return appEnv.contactEmail || appEnv.emailFrom || appEnv.smtpUser || 'hello@example.com';
};

const buildContactText = ({ name, email, company, subject, message }) => {
  return [
    'New landing page contact submission',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Company: ${company || 'Not provided'}`,
    `Subject: ${subject}`,
    '',
    'Message:',
    message
  ].join('\n');
};

const buildContactHtml = ({ name, email, company, subject, message }) => {
  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px;border:1px solid #e2e8f0;">
        <p style="margin:0 0 16px;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#64748b;">Pulse contact form</p>
        <h1 style="margin:0 0 16px;font-size:24px;line-height:1.2;">${escapeHtml(subject)}</h1>
        <p style="margin:0 0 8px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p style="margin:0 0 20px;"><strong>Company:</strong> ${escapeHtml(company || 'Not provided')}</p>
        <div style="border-top:1px solid #e2e8f0;padding-top:20px;">
          <p style="margin:0 0 10px;font-weight:600;">Message</p>
          <p style="margin:0;line-height:1.8;color:#334155;">${escapeHtml(message).replaceAll('\n', '<br />')}</p>
        </div>
      </div>
    </div>
  `;
};

export const sendContactInquiry = async (payload) => {
  const recipient = resolveContactRecipient();

  const result = await sendEmail({
    to: recipient,
    subject: `[Pulse] Contact request from ${payload.name}`,
    text: buildContactText(payload),
    html: buildContactHtml(payload),
    replyTo: payload.email
  });

  return {
    recipient,
    preview: Boolean(result?.preview)
  };
};
