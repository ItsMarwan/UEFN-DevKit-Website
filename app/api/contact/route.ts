import { NextRequest, NextResponse } from 'next/server';

// Only allow requests from your own site
const ALLOWED_ORIGINS = [
  'https://uefnhelper.frii.site',
  'https://www.uefnhelper.frii.site',
  // Allow localhost in development
  'http://localhost:3000',
];

async function verifyCaptcha(token: string, ip: string): Promise<boolean> {
  const secret = process.env.HCAPTCHA_SECRET_KEY;
  if (!secret) {
    // In dev with test keys, skip verification
    if (process.env.NODE_ENV === 'development') return true;
    return false;
  }

  try {
    const res = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: ip,
      }),
    });

    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

async function sendEmail({
  name,
  email,
  subject,
  message,
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  // ─────────────────────────────────────────────────────────────────────────
  // OPTION A — Resend (recommended, simple API)
  // Install: npm install resend
  // Set env: RESEND_API_KEY, CONTACT_TO_EMAIL
  // ─────────────────────────────────────────────────────────────────────────
  const resendKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL || 'your@email.com';

  if (resendKey) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'UEFN Helper Contact <noreply@uefnhelper.frii.site>',
        to: [toEmail],
        reply_to: email,
        subject: `[Contact] ${subject} — from ${name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2399df;">New Contact Form Submission</h2>
            <table style="width:100%; border-collapse:collapse;">
              <tr>
                <td style="padding: 8px; font-weight:bold; color:#666; width:120px;">Name</td>
                <td style="padding: 8px;">${escapeHtml(name)}</td>
              </tr>
              <tr style="background:#f9f9f9;">
                <td style="padding: 8px; font-weight:bold; color:#666;">Email</td>
                <td style="padding: 8px;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight:bold; color:#666;">Subject</td>
                <td style="padding: 8px;">${escapeHtml(subject)}</td>
              </tr>
            </table>
            <hr style="border:1px solid #eee; margin: 20px 0;" />
            <h3 style="color:#333;">Message</h3>
            <p style="white-space: pre-wrap; color:#444; line-height:1.6;">${escapeHtml(message)}</p>
            <hr style="border:1px solid #eee; margin: 20px 0;" />
            <p style="color:#999; font-size:12px;">Sent from uefnhelper.frii.site contact form</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to send via Resend');
    }
    return;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // OPTION B — Nodemailer / SMTP (if you prefer)
  // Set env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_TO_EMAIL
  // ─────────────────────────────────────────────────────────────────────────
  // Uncomment and install nodemailer: npm install nodemailer @types/nodemailer
  //
  // const nodemailer = require('nodemailer');
  // const transporter = nodemailer.createTransport({
  //   host: process.env.SMTP_HOST,
  //   port: Number(process.env.SMTP_PORT) || 587,
  //   secure: false,
  //   auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  // });
  // await transporter.sendMail({
  //   from: `"UEFN Helper" <${process.env.SMTP_USER}>`,
  //   to: process.env.CONTACT_TO_EMAIL,
  //   replyTo: email,
  //   subject: `[Contact] ${subject} — from ${name}`,
  //   text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
  // });

  // Fallback: log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Contact Form]', { name, email, subject, message });
    return;
  }

  throw new Error('No email provider configured. Set RESEND_API_KEY in your environment.');
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function POST(req: NextRequest) {
  // ── Origin check (only allow our own site) ────────────────────────────
  const origin = req.headers.get('origin') || '';
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ── Parse body ────────────────────────────────────────────────────────
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { name, email, subject, message, captchaToken } = body;

  // ── Basic validation ──────────────────────────────────────────────────
  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
  }

  if (message.length > 2000) {
    return NextResponse.json({ error: 'Message too long (max 2000 characters).' }, { status: 400 });
  }

  if (!captchaToken) {
    return NextResponse.json({ error: 'Captcha token missing.' }, { status: 400 });
  }

  // ── hCaptcha verification ─────────────────────────────────────────────
  const clientIp =
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1';

  const captchaValid = await verifyCaptcha(captchaToken, clientIp);
  if (!captchaValid) {
    return NextResponse.json({ error: 'Captcha verification failed. Please try again.' }, { status: 400 });
  }

  // ── Send email ────────────────────────────────────────────────────────
  try {
    await sendEmail({ name: name.trim(), email: email.trim(), subject, message: message.trim() });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Contact API Error]', err);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again later or contact us via Discord.' },
      { status: 500 }
    );
  }
}

// Block all other methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}