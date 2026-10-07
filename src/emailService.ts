import nodemailer from 'nodemailer';
import type { Transporter, SendMailOptions } from 'nodemailer';
import type { ConfiguracionSistema } from './types.ts';

// Default SMTP Configuration using the verified credentials
export const DEFAULT_SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE !== 'false', // true for 465
  user: process.env.SMTP_USER || 'alertas@grupostt.com',
  pass: (process.env.SMTP_PASS || 'smjlbrpmxyerbwzp').replace(/\s+/g, ''),
  fromName: 'Quick Hire LATAM - Alertas STT',
  fromEmail: 'alertas@grupostt.com'
};

let cachedTransporter: Transporter | null = null;
let lastTransporterConfigKey = '';

export function getEmailTransporter(customConfig?: Partial<ConfiguracionSistema>) {
  const host = customConfig?.smtpHost || DEFAULT_SMTP_CONFIG.host;
  const port = customConfig?.smtpPort || DEFAULT_SMTP_CONFIG.port;
  const secure = customConfig?.smtpSecure !== undefined ? customConfig.smtpSecure : (port === 465);
  const user = customConfig?.smtpUser || DEFAULT_SMTP_CONFIG.user;
  const rawPass = customConfig?.smtpPass || DEFAULT_SMTP_CONFIG.pass;
  const pass = rawPass.replace(/\s+/g, '');

  const configKey = `${host}:${port}:${secure}:${user}:${pass}`;

  if (cachedTransporter && lastTransporterConfigKey === configKey) {
    return cachedTransporter;
  }

  // Configuración directa y nativa para Gmail con Contraseña de Aplicación de 16 dígitos
  if (!host || host.includes('gmail.com') || host.toLowerCase() === 'gmail') {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass // Contraseña de aplicación de 16 caracteres de Gmail (sin espacios)
      }
    });
  } else {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  lastTransporterConfigKey = configKey;
  return cachedTransporter;
}

export async function verifySmtpConnection(customConfig?: Partial<ConfiguracionSistema>): Promise<{ ok: boolean; error?: string }> {
  try {
    const transporter = getEmailTransporter(customConfig);
    await transporter.verify();
    return { ok: true };
  } catch (err: any) {
    console.error('[SMTP Verify Error]:', err.message);
    return { ok: false, error: err.message || 'Error de conexión SMTP' };
  }
}

export interface EmailPayload {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
}

export function sanitizeRecipientEmails(emails?: string | string[]): string | string[] | undefined {
  if (!emails) return undefined;
  if (Array.isArray(emails)) {
    const filtered = emails
      .map(e => (typeof e === 'string' ? e.trim() : ''))
      .filter(e => e && !e.toLowerCase().includes('quickhire.com') && !e.toLowerCase().includes('quickhire'));
    return filtered.length > 0 ? filtered : undefined;
  }
  const clean = emails.trim();
  if (clean.toLowerCase().includes('quickhire.com') || clean.toLowerCase().includes('quickhire')) {
    return undefined;
  }
  return clean;
}

export async function sendEmail(
  payload: EmailPayload,
  sysConfig?: ConfiguracionSistema
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const targetEmail = (payload.to || '').trim();
    if (!targetEmail || targetEmail.toLowerCase().includes('quickhire.com') || targetEmail.toLowerCase().includes('quickhire')) {
      console.warn(`[EmailService] Bloqueado envío a dominio no autorizado (quickhire): "${targetEmail}"`);
      return { success: false, error: 'Envío bloqueado: Dominio quickhire no permitido. Use dominios autorizados de grupostt.com' };
    }

    const transporter = getEmailTransporter(sysConfig);
    const fromName = payload.fromName || sysConfig?.nombreRemitente || DEFAULT_SMTP_CONFIG.fromName;
    const fromEmail = payload.fromEmail || sysConfig?.correoRemitente || DEFAULT_SMTP_CONFIG.fromEmail;

    const sanitizedCc = sanitizeRecipientEmails(payload.cc);
    const sanitizedBcc = sanitizeRecipientEmails(
      payload.bcc || (sysConfig?.correoCopiaSolicitudes && sysConfig.correoCopiaSolicitudes !== targetEmail ? sysConfig.correoCopiaSolicitudes : undefined)
    );

    const mailOptions: SendMailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: targetEmail,
      subject: payload.subject,
      text: payload.text || payload.html?.replace(/<[^>]*>?/gm, '') || '',
      html: payload.html,
      replyTo: payload.replyTo || sysConfig?.correoCopiaSolicitudes || fromEmail,
      cc: sanitizedCc,
      bcc: sanitizedBcc,
      attachments: payload.attachments
    };

    console.log(`[EmailService] Sending email to ${targetEmail} - Subject: "${payload.subject}" via ${fromEmail}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Email sent successfully! MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[EmailService] Failed to send email to ${payload.to}:`, err.message);
    return { success: false, error: err.message || 'Error desconocido al enviar correo' };
  }
}

export interface BrandedEmailOptions {
  title: string;
  preheader?: string;
  recipientName: string;
  mainMessage: string;
  badges?: Array<{ label: string; value: string; color?: string }>;
  credentialBox?: {
    username: string;
    role: string;
    temporaryPassword?: string;
    loginUrl: string;
  };
  detailsTable?: Array<{ label: string; value: string }>;
  callToAction?: {
    text: string;
    url: string;
  };
  securityNote?: string;
  footerNote?: string;
}

export function generateBrandedHtmlEmail(options: BrandedEmailOptions): string {
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f8fafc;
      padding: 30px 15px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
      padding: 32px 30px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0 0 6px 0;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #ffffff;
    }
    .header p {
      margin: 0;
      font-size: 12px;
      color: #c7d2fe;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }
    .content {
      padding: 32px 30px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 16px;
    }
    .paragraph {
      font-size: 14px;
      line-height: 1.6;
      color: #334155;
      margin-bottom: 20px;
      white-space: pre-line;
    }
    .credential-box {
      background-color: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #4f46e5;
      border-radius: 10px;
      padding: 20px;
      margin: 24px 0;
    }
    .credential-title {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #312e81;
      margin-bottom: 12px;
    }
    .credential-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
    }
    .credential-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .credential-label {
      color: #64748b;
      font-weight: 600;
    }
    .credential-val {
      color: #0f172a;
      font-family: monospace;
      font-weight: 700;
      background: #ffffff;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .btn-container {
      text-align: center;
      margin: 28px 0 16px 0;
    }
    .btn {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      padding: 14px 28px;
      border-radius: 10px;
      letter-spacing: 0.3px;
      box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
    }
    .btn:hover {
      background: #4338ca;
    }
    .security-note {
      font-size: 12px;
      color: #64748b;
      background-color: #fef3c7;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 12px 14px;
      margin-top: 20px;
      line-height: 1.5;
    }
    .security-note strong {
      color: #92400e;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
    }
    .details-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    .details-table td:first-child {
      font-weight: 600;
      color: #64748b;
      width: 40%;
    }
    .details-table td:last-child {
      color: #0f172a;
      font-weight: 500;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 24px 30px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.5;
    }
    .footer strong {
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="container" role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="header">
          <p>Quick Hire LATAM &bull; Grupo STT</p>
          <h1>${options.title}</h1>
        </td>
      </tr>
      <tr>
        <td class="content">
          <div class="greeting">Estimado(a) ${options.recipientName},</div>
          
          <div class="paragraph">${options.mainMessage}</div>

          ${options.credentialBox ? `
          <div class="credential-box">
            <div class="credential-title">&#128274; Credenciales de Acceso a la Plataforma</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Usuario / Correo:</td>
                <td style="padding: 6px 0; text-align: right; color: #0f172a; font-family: monospace; font-weight: 700;">${options.credentialBox.username}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Rol Asignado:</td>
                <td style="padding: 6px 0; text-align: right; color: #4338ca; font-weight: 700;">${options.credentialBox.role}</td>
              </tr>
              ${options.credentialBox.temporaryPassword ? `
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Contraseña Temporal:</td>
                <td style="padding: 6px 0; text-align: right; color: #0f172a; font-family: monospace; font-weight: 800; background: #e0e7ff; padding: 2px 8px; border-radius: 4px;">${options.credentialBox.temporaryPassword}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Estado de Cuenta:</td>
                <td style="padding: 6px 0; text-align: right; color: #059669; font-weight: 700;">Activo</td>
              </tr>
            </table>
          </div>
          ` : ''}

          ${options.detailsTable && options.detailsTable.length > 0 ? `
          <table class="details-table">
            ${options.detailsTable.map(row => `
              <tr>
                <td>${row.label}</td>
                <td>${row.value}</td>
              </tr>
            `).join('')}
          </table>
          ` : ''}

          ${options.callToAction ? `
          <div class="btn-container">
            <a href="${options.callToAction.url}" class="btn" target="_blank" rel="noopener noreferrer">
              ${options.callToAction.text}
            </a>
          </div>
          ` : ''}

          ${options.securityNote ? `
          <div class="security-note">
            <strong>&#9888; Aviso de Seguridad:</strong> ${options.securityNote}
          </div>
          ` : (options.credentialBox ? `
          <div class="security-note">
            <strong>&#9888; Recomendación de Seguridad:</strong> Esta es una contraseña temporal generada automáticamente. Por políticas de cumplimiento y seguridad de la información de Grupo STT, le recomendamos cambiar su contraseña tras su primer ingreso en la plataforma.
          </div>
          ` : '')}

          ${options.footerNote ? `
          <div style="font-size: 12px; color: #64748b; margin-top: 20px;">
            ${options.footerNote}
          </div>
          ` : ''}
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p><strong>Quick Hire LATAM &bull; Employer of Record (EOR) Services</strong></p>
          <p>Este es un correo automático emitido por el sistema de notificaciones de Grupo STT (alertas@grupostt.com). Por favor no responda directamente a este mensaje.</p>
          <p>&copy; ${currentYear} Grupo STT. Todos los derechos reservados.</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim();
}
