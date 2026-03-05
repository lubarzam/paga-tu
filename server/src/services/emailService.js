const transporter = require('../config/email');

const escapeHtml = (text) => {
  if (text == null) return '';
  return String(text)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#x27;');
};

const formatLabel = (str) =>
  str ? str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';

const emailService = {

  async sendInvitationEmail({ to, inviteeName, accountName, inviterName, token }) {
    const frontendUrl    = process.env.FRONTEND_URL;
    const invitationLink = `${frontendUrl}/?invitation_token=${token}`;

    await transporter.sendMail({
      from:    `PagaTú <${process.env.SMTP_FROM}>`,
      to,
      subject: `${escapeHtml(inviterName)} te invitó a dividir gastos en PagaTú`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">¡Hola ${escapeHtml(inviteeName)}!</h2>

          <p>
            <strong>${escapeHtml(inviterName)}</strong> te ha invitado a participar en la cuenta
            <strong>"${escapeHtml(accountName)}"</strong> para dividir gastos.
          </p>

          <p>Haz clic en el siguiente enlace para aceptar la invitación:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}"
               style="background-color: #4f46e5; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 6px; font-weight: bold;">
              Aceptar Invitación
            </a>
          </div>

          <p style="color: #666; font-size: 13px;">
            Si el botón no funciona, copia este enlace en tu navegador:<br>
            <a href="${invitationLink}">${invitationLink}</a>
          </p>

          <p style="color: #666; font-size: 13px;">Esta invitación expira en 7 días.</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="color: #999; font-size: 12px;">
            Este correo fue enviado por PagaTú — La forma más fácil de dividir gastos.
          </p>
        </div>
      `,
    });
  },


  async sendReminderEmail({ to, participantName, accountName, accountTotal, participantAmount, owner }) {
    const frontendUrl = process.env.FRONTEND_URL || 'https://pagatu.cl';

    await transporter.sendMail({
      from:    `PagaTú <${process.env.SMTP_FROM}>`,
      to,
      subject: `Recordatorio: Pendiente de pago en "${escapeHtml(accountName)}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #7c3aed, #9333ea); padding: 28px 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 24px;">💰 PagaTú</h1>
            <p style="margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 13px;">La forma más fácil de dividir gastos</p>
          </div>

          <div style="background: #ffffff; padding: 28px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #111827; margin: 0 0 8px;">Recordatorio de pago</h2>
            <p style="color: #6b7280; margin: 0 0 20px;">Hola <strong style="color: #111827;">${escapeHtml(participantName)}</strong>, tienes un pago pendiente:</p>

            <div style="background: #f9fafb; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 12px; font-size: 15px; font-weight: 600; color: #111827;">📋 ${escapeHtml(accountName)}</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-size: 14px;">Total de la cuenta</td>
                  <td style="padding: 5px 0; text-align: right; color: #111827; font-size: 14px;">$${Number(accountTotal || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</td>
                </tr>
                <tr style="border-top: 1px solid #e5e7eb;">
                  <td style="padding: 10px 0 5px; color: #111827; font-weight: 700; font-size: 16px;">Tu parte</td>
                  <td style="padding: 10px 0 5px; text-align: right; color: #7c3aed; font-weight: 700; font-size: 20px;">$${Number(participantAmount || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</td>
                </tr>
                <tr>
                  <td style="padding: 0; color: #6b7280; font-size: 14px;">Pagado por</td>
                  <td style="padding: 0; text-align: right; color: #111827; font-size: 14px;">${escapeHtml(owner.name || owner.email)}</td>
                </tr>
              </table>
            </div>

            ${owner.bank_name ? `
              <div style="background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px; font-weight: 600; color: #166534;">💳 Datos para transferencia</p>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr><td style="padding: 3px 0; color: #6b7280;">Banco</td><td style="text-align: right; color: #111827;">${escapeHtml(formatLabel(owner.bank_name))}</td></tr>
                  ${owner.account_type   ? `<tr><td style="padding: 3px 0; color: #6b7280;">Tipo de cuenta</td><td style="text-align: right; color: #111827;">${escapeHtml(formatLabel(owner.account_type))}</td></tr>` : ''}
                  ${owner.account_number ? `<tr><td style="padding: 3px 0; color: #6b7280;">N° de cuenta</td><td style="text-align: right; color: #111827; font-weight: 600;">${escapeHtml(owner.account_number)}</td></tr>` : ''}
                  <tr><td style="padding: 3px 0; color: #6b7280;">Titular</td><td style="text-align: right; color: #111827;">${escapeHtml(owner.name || owner.email)}</td></tr>
                  ${owner.bank_email ? `<tr><td style="padding: 3px 0; color: #6b7280;">Email banco</td><td style="text-align: right; color: #111827;">${escapeHtml(owner.bank_email)}</td></tr>` : ''}
                </table>
              </div>
            ` : `
              <div style="background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
                <p style="margin: 0; color: #92400e; font-size: 13px;">
                  💡 <strong>${escapeHtml(owner.name || owner.email)}</strong> aún no ha configurado sus datos bancarios. Coordina el pago directamente con él/ella.
                </p>
              </div>
            `}

            <div style="background: #f5f3ff; border-radius: 10px; padding: 20px; margin-bottom: 20px; text-align: center;">
              <p style="margin: 0 0 6px; color: #4c1d95; font-weight: 600; font-size: 15px;">¿Ya tienes cuenta en PagaTú?</p>
              <p style="margin: 0 0 16px; color: #6b7280; font-size: 13px;">
                Ingresa para ver todas las cuentas donde participas,<br>llevar el control de lo que debes y lo que te deben.
              </p>
              <a href="${frontendUrl}"
                 style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #9333ea); color: white;
                        padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                Ver mis cuentas en PagaTú →
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              Este recordatorio fue enviado por <a href="${frontendUrl}" style="color: #7c3aed; text-decoration: none;">PagaTú</a> a solicitud de ${escapeHtml(owner.name || owner.email)}.
            </p>
          </div>
        </div>
      `,
    });
  },
};

module.exports = emailService;
