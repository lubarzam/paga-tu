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
    await transporter.sendMail({
      from:    `PagaTú <${process.env.SMTP_FROM}>`,
      to,
      subject: `Recordatorio: Pendiente de pago en "${escapeHtml(accountName)}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Recordatorio de Pago</h2>

          <p>Hola ${escapeHtml(participantName)},</p>

          <p>
            Este es un recordatorio amigable de que tienes un pago pendiente en la cuenta
            <strong>"${escapeHtml(accountName)}"</strong>.
          </p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Detalles de la cuenta:</h3>
            <p style="margin: 5px 0;"><strong>Nombre:</strong> ${escapeHtml(accountName)}</p>
            <p style="margin: 5px 0;"><strong>Total de la cuenta:</strong> $${Number(accountTotal || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</p>
            <p style="margin: 5px 0;"><strong>Tu parte:</strong> $${Number(participantAmount || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</p>
            <p style="margin: 5px 0;"><strong>Pagado por:</strong> ${escapeHtml(owner.name || owner.email)}</p>
          </div>

          <p>Por favor, coordina el pago con ${escapeHtml(owner.name || owner.email)} a la brevedad posible.</p>

          ${owner.bank_name ? `
            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
              <h3 style="margin: 0 0 10px 0; color: #2e7d32;">💳 Datos para transferencia:</h3>
              <p style="margin: 5px 0;"><strong>Banco:</strong> ${escapeHtml(formatLabel(owner.bank_name))}</p>
              ${owner.account_type   ? `<p style="margin: 5px 0;"><strong>Tipo de cuenta:</strong> ${escapeHtml(formatLabel(owner.account_type))}</p>` : ''}
              ${owner.account_number ? `<p style="margin: 5px 0;"><strong>Número de cuenta:</strong> ${escapeHtml(owner.account_number)}</p>` : ''}
              <p style="margin: 5px 0;"><strong>Titular:</strong> ${escapeHtml(owner.name || owner.email)}</p>
              ${owner.bank_email ? `<p style="margin: 5px 0;"><strong>Email del banco:</strong> ${escapeHtml(owner.bank_email)}</p>` : ''}
            </div>
          ` : `
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404;">
                💡 <strong>Tip:</strong> ${escapeHtml(owner.name || owner.email)} puede configurar sus datos bancarios en su perfil para facilitar los pagos.
              </p>
            </div>
          `}

          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="color: #999; font-size: 12px;">
            Este recordatorio fue enviado por PagaTú — La forma más fácil de dividir gastos.
          </p>
        </div>
      `,
    });
  },
};

module.exports = emailService;
