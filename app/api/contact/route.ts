import { NextRequest, NextResponse } from 'next/server';
import { validate as validateEmail } from 'email-validator';

const ALLOWED_ORIGINS = [
  'https://uefndevkit.rweb.site',
  'https://uefndevkitfrii.site',
  'http://localhost:3000',
];

// Validation constraints
const VALIDATION = {
  NAME_MIN: 2,
  NAME_MAX: 100,
  SUBJECT_MIN: 3,
  SUBJECT_MAX: 200,
  MESSAGE_MIN: 10,
  MESSAGE_MAX: 2000,
};

// IP extraction - secure (avoid x-forwarded-for spoofing)
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    (typeof req.ip === 'string' ? req.ip : '127.0.0.1')
  );
}

async function verifyCaptcha(token: string, ip: string): Promise<boolean> {
  const secret = process.env.HCAPTCHA_SECRET_KEY;
  if (!secret) {
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
  const resendKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;

  if (resendKey) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'UEFN DevKit <onboarding@resend.dev>',
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
  // CORS check - strict origin validation
  const origin = req.headers.get('origin');
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { name, email, subject, message, captchaToken } = body;

  // Trim values
  const trimmedName = name?.trim() || '';
  const trimmedEmail = email?.trim() || '';
  const trimmedSubject = subject?.trim() || '';
  const trimmedMessage = message?.trim() || '';

  // Validate empty fields
  if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  // Validate name length
  if (trimmedName.length < VALIDATION.NAME_MIN || trimmedName.length > VALIDATION.NAME_MAX) {
    return NextResponse.json(
      { error: `Name must be between ${VALIDATION.NAME_MIN} and ${VALIDATION.NAME_MAX} characters.` },
      { status: 400 }
    );
  }

  // Validate subject length
  if (trimmedSubject.length < VALIDATION.SUBJECT_MIN || trimmedSubject.length > VALIDATION.SUBJECT_MAX) {
    return NextResponse.json(
      { error: `Subject must be between ${VALIDATION.SUBJECT_MIN} and ${VALIDATION.SUBJECT_MAX} characters.` },
      { status: 400 }
    );
  }

  // Validate message length
  if (trimmedMessage.length < VALIDATION.MESSAGE_MIN || trimmedMessage.length > VALIDATION.MESSAGE_MAX) {
    return NextResponse.json(
      { error: `Message must be between ${VALIDATION.MESSAGE_MIN} and ${VALIDATION.MESSAGE_MAX} characters.` },
      { status: 400 }
    );
  }

  // Validate email with proper library
  if (!validateEmail(trimmedEmail)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  if (!captchaToken) {
    return NextResponse.json({ error: 'Captcha token missing.' }, { status: 400 });
  }

  // Secure IP extraction - don't trust x-forwarded-for directly
  const clientIp = getClientIp(req);

  const captchaValid = await verifyCaptcha(captchaToken, clientIp);
  if (!captchaValid) {
    return NextResponse.json({ error: 'Captcha verification failed. Please try again.' }, { status: 400 });
  }

  try {
    await sendEmail({
      name: trimmedName,
      email: trimmedEmail,
      subject: trimmedSubject,
      message: trimmedMessage,
    });

    // Set CORS headers in response
    const responseHeaders = new Headers();
    responseHeaders.set('Access-Control-Allow-Origin', origin);
    responseHeaders.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type');

    return NextResponse.json({ success: true }, { headers: responseHeaders });
  } catch (err: any) {
    console.error('[Contact API Error]', err);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again later or contact us via Discord.' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');

  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '3600',
    },
  });
}
