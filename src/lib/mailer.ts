import nodemailer, { type Transporter } from 'nodemailer';

let transporter: Transporter | null = null;
let warned = false;

function getTransporter(): Transporter | null {
  if (!process.env.SMTP_HOST) {
    if (!warned) {
      console.warn('[mailer] SMTP not configured (SMTP_HOST unset) — email delivery disabled');
      warned = true;
    }
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
  }

  return transporter;
}

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

const BRAND = '#550000';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] || character);
}

function safeHeader(value: string): string {
  return value.replace(/[\r\n]/g, ' ').trim();
}

// Deployment-configurable product name (brand-agnostic code)
function getAppName(): string {
  return process.env.NEXT_PUBLIC_APP_NAME || 'CaseDesk';
}

function getAppUrl(): string {
  return process.env.APP_URL || 'http://localhost:3000';
}

function layout(title: string, bodyHtml: string): string {
  const appName = escapeHtml(getAppName());
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#fcfaf8;font-family:Inter,Arial,sans-serif;color:#1a1614;">
  <div style="max-width:560px;margin:24px auto;">
    <div style="padding:20px 24px;background:${BRAND};border-radius:12px 12px 0 0;">
      <span style="color:#ffffff;font-size:18px;font-weight:700;">${appName}</span>
    </div>
    <div style="padding:24px;background:#ffffff;border:1px solid #ded5c9;border-top:none;border-radius:0 0 12px 12px;">
      <h1 style="margin:0 0 16px;font-size:18px;color:${BRAND};">${title}</h1>
      ${bodyHtml}
    </div>
    <p style="text-align:center;font-size:11px;color:#695a4f;padding:12px;">
       ${appName} · Citizen report investigation workspace
    </p>
  </div>
</body>
</html>`;
}

export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}

export async function sendMail(options: MailOptions): Promise<{ sent: boolean; error?: string }> {
  const transport = getTransporter();
  if (!transport) return { sent: false, error: 'SMTP not configured' };

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || `${getAppName()} <no-reply@casedesk.app>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return { sent: true };
  } catch (err: any) {
    console.error('[mailer] Failed to send email:', err?.message || err);
    return { sent: false, error: err?.message || 'send failure' };
  }
}

export async function sendSubmissionNotification(params: {
  to: string[];
  referenceNumber: string;
  category: string;
  location: string;
  isAnonymous: boolean;
  senderName: string | null;
  hasAttachments: boolean;
  storyPreview: string;
}): Promise<void> {
  if (params.to.length === 0) return;

  const appUrl = escapeHtml(getAppUrl());
  const story = params.storyPreview.length > 500 ? params.storyPreview.slice(0, 500) + '…' : params.storyPreview;
  const referenceNumber = safeHeader(params.referenceNumber);
  const category = safeHeader(params.category);
  const location = safeHeader(params.location);
  const source = params.isAnonymous ? 'Anonymous citizen' : params.senderName || 'Citizen';

  await sendMail({
    to: params.to,
    subject: `New citizen report ${referenceNumber} — ${category}`,
    html: layout(
      'New Citizen Report Received',
      `<table style="width:100%;font-size:14px;line-height:1.6;">
        <tr><td style="color:#695a4f;padding:4px 0;width:130px;">Reference</td><td style="font-weight:700;">${escapeHtml(referenceNumber)}</td></tr>
        <tr><td style="color:#695a4f;padding:4px 0;">Category</td><td>${escapeHtml(category)}</td></tr>
        <tr><td style="color:#695a4f;padding:4px 0;">Location</td><td>${escapeHtml(location)}</td></tr>
        <tr><td style="color:#695a4f;padding:4px 0;">Source</td><td>${escapeHtml(source)}</td></tr>
        <tr><td style="color:#695a4f;padding:4px 0;">Attachments</td><td>${params.hasAttachments ? 'Yes' : 'None'}</td></tr>
      </table>
      <p style="margin:16px 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#695a4f;">Report excerpt</p>
      <p style="margin:0;padding:12px;background:#f8f6f1;border-radius:8px;font-size:13px;white-space:pre-wrap;">${escapeHtml(story)}</p>
      <p style="margin:20px 0 0;"><a href="${appUrl}/app/inbox" style="display:inline-block;padding:10px 18px;background:${BRAND};color:#ffffff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;">Open Intake Inbox</a></p>`
    ),
    text: `New citizen report received.\n\nReference: ${referenceNumber}\nCategory: ${category}\nLocation: ${location}\nSource: ${source}\nAttachments: ${params.hasAttachments ? 'Yes' : 'None'}\n\nExcerpt:\n${story}\n\nReview it in the intake inbox: ${getAppUrl()}/app/inbox`,
  });
}

export async function sendWelcomeEmail(params: { name: string; email: string }): Promise<void> {
  const appUrl = escapeHtml(getAppUrl());
  const appName = getAppName();
  const escapedAppName = escapeHtml(appName);
  const name = escapeHtml(params.name);

  await sendMail({
    to: params.email,
    subject: `Welcome to ${safeHeader(appName)}`,
    html: layout(
      `Welcome, ${name}`,
      `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;">Your workspace is ready. ${escapedAppName} helps you turn citizen reports into verified, responsible public-interest journalism.</p>
      <p style="margin:20px 0 0;"><a href="${appUrl}/app" style="display:inline-block;padding:10px 18px;background:${BRAND};color:#ffffff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;">Open Your Workspace</a></p>`
    ),
    text: `Welcome to ${appName}, ${params.name}.\n\nYour workspace is ready. Open it here: ${getAppUrl()}/app`,
  });
}
