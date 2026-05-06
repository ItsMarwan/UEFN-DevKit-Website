import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

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

    // 1. Basic Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required standard fields.' }, { status: 400 });
    }

    const isQuote = subject === 'Custom Payment Method' || subject === 'Enterprise Quote Request';
    if (isQuote && (!duration || !budget || !serverSize || !serverId || !inviteUrl)) {
      return NextResponse.json({ error: 'Missing required quote specification fields.' }, { status: 400 });
    }

    // 2. hCaptcha Verification
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

    // 3. SMTP Transport Configuration
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

    // 4. Construct Email Payload
    let htmlContent = `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #000; border-bottom: 2px solid #eee; padding-bottom: 10px;">New Inquiry: ${subject}</h2>
        <p><strong>From:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p>
        <p><strong>Subject:</strong> ${subject}</p>
    `;

    if (isQuote) {
      htmlContent += `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Quote Details</h3>
          <p style="margin: 5px 0;"><strong>Duration:</strong> ${duration}</p>
          <p style="margin: 5px 0;"><strong>Budget:</strong> ${budget}</p>
          <p style="margin: 5px 0;"><strong>Server Size:</strong> ${serverSize}</p>
          <p style="margin: 5px 0;"><strong>Server ID:</strong> ${serverId}</p>
          <p style="margin: 5px 0;"><strong>Invite URL:</strong> <a href="${inviteUrl}">${inviteUrl}</a></p>
        </div>
      `;
    }

    htmlContent += `
        <h3>Message:</h3>
        <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${message}</div>
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

    // 5. Send Email
    await transporter.sendMail({
      from: `"${name} (UEFN Form)" <${EMAIL_FROM || EMAIL_SMTP_USER}>`,
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