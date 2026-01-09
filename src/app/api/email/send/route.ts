import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY environment variable');
  }

  return new Resend(apiKey);
}

export async function POST(request: NextRequest) {
  try {
    const resend = getResend();
    const { to, name, verificationUrl } = await request.json();

    if (!to || !name || !verificationUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: to, name, verificationUrl' },
        { status: 400 }
      );
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@resend.dev';
    const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || 'C-IKYC';

    const { data, error } = await resend.emails.send({
      from: `${companyName} <${fromEmail}>`,
      to: [to],
      subject: `${companyName} - Verificación de Identidad (KYC)`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
            <h1 style="color: #212121; margin-bottom: 20px;">Verificación de Identidad</h1>

            <p>Hola <strong>${name}</strong>,</p>

            <p>Le enviamos el siguiente enlace para completar su verificación de identidad (KYC):</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}"
                 style="background-color: #39D2C0; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Completar Verificación
              </a>
            </div>

            <p>O copie y pegue el siguiente enlace en su navegador:</p>
            <p style="background-color: #e9ecef; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 14px;">
              ${verificationUrl}
            </p>

            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Por favor complete el proceso lo antes posible. Este enlace tiene una validez limitada.
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center;">
              Este es un correo automático enviado por ${companyName}.<br>
              Por favor no responda a este mensaje.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
