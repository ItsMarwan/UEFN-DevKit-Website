import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

function escapeHtml(unsafe: string | undefined | null): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeUrl(url: string | undefined | null): string {
  const safeUrl = escapeHtml(url);
  const normalizedUrl = safeUrl.trim().toLowerCase();
  
  if (
    normalizedUrl.startsWith('javascript:') ||
    normalizedUrl.startsWith('data:') ||
    normalizedUrl.startsWith('vbscript:')
  ) {
    return '#';
  }
  return safeUrl;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      name, 
      email, 
      subject, 
      message, 
      captchaToken,
      duration,
      budget,
      serverSize,
      serverId,
      inviteUrl
    } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required standard fields.' }, { status: 400 });
    }

    const isQuote = subject === 'Custom Payment Method' || subject === 'Enterprise Quote Request';
    if (isQuote && (!duration || !budget || !serverSize || !serverId || !inviteUrl)) {
      return NextResponse.json({ error: 'Missing required quote specification fields.' }, { status: 400 });
    }

    const hcaptchaSecret = process.env.HCAPTCHA_SECRET_KEY;
    if (hcaptchaSecret && captchaToken) {
      const verifyRes = await fetch('https://api.hcaptcha.com/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${hcaptchaSecret}&response=${captchaToken}`,
      });
      
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return NextResponse.json({ error: 'Invalid captcha token. Please try again.' }, { status: 400 });
      }
    }

    const {
      EMAIL_SMTP_HOST,
      EMAIL_SMTP_PORT,
      EMAIL_SMTP_USER,
      EMAIL_SMTP_PASS,
      EMAIL_FROM
    } = process.env;

    if (!EMAIL_SMTP_HOST || !EMAIL_SMTP_USER || !EMAIL_SMTP_PASS) {
      console.error('Missing SMTP environment variables.');
      return NextResponse.json({ error: 'Email service is misconfigured on the server.' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: EMAIL_SMTP_HOST,
      port: parseInt(EMAIL_SMTP_PORT || '587', 10),
      secure: EMAIL_SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: EMAIL_SMTP_USER,
        pass: EMAIL_SMTP_PASS,
      },
    });

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message);
    const safeDuration = escapeHtml(duration);
    const safeBudget = escapeHtml(budget);
    const safeServerSize = escapeHtml(serverSize);
    const safeServerId = escapeHtml(serverId);
    const safeInviteUrl = sanitizeUrl(inviteUrl);

    let htmlContent = `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #000; border-bottom: 2px solid #eee; padding-bottom: 10px;">New Inquiry: ${safeSubject}</h2>
        <p><strong>From:</strong> ${safeName} (<a href="mailto:${safeEmail}">${safeEmail}</a>)</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
    `;

    if (isQuote) {
      htmlContent += `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Quote Details</h3>
          <p style="margin: 5px 0;"><strong>Duration:</strong> ${safeDuration}</p>
          <p style="margin: 5px 0;"><strong>Budget:</strong> ${safeBudget}</p>
          <p style="margin: 5px 0;"><strong>Server Size:</strong> ${safeServerSize}</p>
          <p style="margin: 5px 0;"><strong>Server ID:</strong> ${safeServerId}</p>
          <p style="margin: 5px 0;"><strong>Invite URL:</strong> <a href="${safeInviteUrl}">${safeInviteUrl}</a></p>
        </div>
      `;
    }

    htmlContent += `
        <h3>Message:</h3>
        <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${safeMessage}</div>
      </div>
    `;

    const textContent = `
      New Inquiry: ${subject}
      From: ${name} (${email})
      Subject: ${subject}
      
      ${isQuote ? `Quote Details:\nDuration: ${duration}\nBudget: ${budget}\nServer Size: ${serverSize}\nServer ID: ${serverId}\nInvite URL: ${inviteUrl}\n\n` : ''}
      Message:
      ${message}
    `;

    await transporter.sendMail({
      from: `"${safeName.replace(/"/g, '')} (UEFN Form)" <${EMAIL_FROM || EMAIL_SMTP_USER}>`,
      replyTo: email,
      to: EMAIL_FROM || EMAIL_SMTP_USER, // Sending to yourself
      subject: `[Support] ${subject} - ${name}`,
      text: textContent,
      html: htmlContent,
    });

    return NextResponse.json({ success: true, message: 'Message sent successfully.' });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ 
      error: 'Failed to process your request. Please try again later.' 
    }, { status: 500 });
  }
}