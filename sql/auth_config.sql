-- Configure Google OAuth
-- This should be run in Supabase Dashboard > Authentication > Settings

-- Google OAuth configuration
-- 1. Go to Google Cloud Console
-- 2. Create OAuth 2.0 credentials
-- 3. Set authorized redirect URIs to: https://your-project.supabase.co/auth/v1/callback
-- 4. Add the Client ID and Client Secret in Supabase Auth settings

-- Email templates configuration
-- 1. Go to Supabase Dashboard > Authentication > Email Templates
-- 2. Configure the following templates:

-- Invitation Email Template
-- Subject: Te han invitado a dividir gastos en {{ .SiteURL }}
-- Body:
/*
<h2>¡Hola {{ .InviteeName }}!</h2>
<p>{{ .InviterName }} te ha invitado a participar en la cuenta "{{ .AccountName }}" para dividir gastos.</p>
<p>Haz clic en el siguiente enlace para aceptar la invitación:</p>
<p><a href="{{ .ConfirmationURL }}">Aceptar invitación</a></p>
<p>Si no tienes una cuenta, se creará automáticamente al hacer clic en el enlace.</p>
<p>Esta invitación expira en 7 días.</p>
*/

-- Additional email configuration for invitations
INSERT INTO auth.config (parameter, value) VALUES
('invite_auto_confirm', 'true'),
('invite_template_subject', 'Te han invitado a dividir gastos'),
('invite_template_body', '<h2>¡Hola!</h2><p>{{ .InviterName }} te ha invitado a participar en la cuenta "{{ .AccountName }}" para dividir gastos.</p><p><a href="{{ .ConfirmationURL }}">Aceptar invitación</a></p>')
ON CONFLICT (parameter) DO UPDATE SET value = EXCLUDED.value;