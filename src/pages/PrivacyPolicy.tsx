import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DollarSign, ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center gap-3 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-1.5">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <span
            className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent cursor-pointer"
            onClick={() => navigate('/')}
          >
            PagaTú
          </span>
        </div>
      </header>

      <main className="container max-w-3xl px-4 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
          <p className="text-muted-foreground text-sm">Última actualización: 4 de marzo de 2025</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Quiénes somos</h2>
          <p className="text-muted-foreground leading-relaxed">
            PagaTú (<strong>pagatu.cl</strong>) es un servicio web gratuito que permite a los usuarios
            dividir gastos de manera justa entre amigos, familia o compañeros de trabajo. No somos
            una institución financiera ni procesamos pagos directamente.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Datos que recopilamos</h2>
          <p className="text-muted-foreground leading-relaxed">Al utilizar PagaTú, podemos recopilar la siguiente información:</p>
          <ul className="list-disc list-inside space-y-1.5 text-muted-foreground">
            <li><strong>Datos de cuenta Google:</strong> nombre, dirección de email y foto de perfil, obtenidos mediante Google OAuth al iniciar sesión.</li>
            <li><strong>Datos bancarios voluntarios:</strong> nombre del banco, tipo y número de cuenta, email bancario. Estos datos son ingresados voluntariamente por el usuario en su perfil para facilitar que sus contactos le realicen transferencias. PagaTú no utiliza estos datos para ningún otro fin.</li>
            <li><strong>Cuentas y transacciones:</strong> nombre de la cuenta, ítems, montos y participantes que el usuario ingresa al dividir gastos.</li>
            <li><strong>Emails de contactos:</strong> direcciones de correo de personas invitadas a participar en una cuenta.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Cómo usamos tus datos</h2>
          <ul className="list-disc list-inside space-y-1.5 text-muted-foreground">
            <li>Proveer el servicio de división de gastos.</li>
            <li>Enviar invitaciones por email a participantes.</li>
            <li>Enviar recordatorios de pago a quienes aún no han pagado.</li>
            <li>Mostrar datos bancarios del cobrador a los participantes para facilitar transferencias.</li>
            <li>No vendemos, arrendamos ni compartimos tu información con terceros con fines comerciales.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Datos bancarios</h2>
          <p className="text-muted-foreground leading-relaxed">
            Los datos bancarios (banco, tipo de cuenta, número de cuenta) son <strong>opcionales</strong> y
            son ingresados exclusivamente por el usuario para que sus contactos puedan realizarle
            transferencias. PagaTú almacena esta información de forma segura en nuestra base de datos
            y la muestra únicamente a los participantes de las cuentas en que el usuario actúa como
            cobrador. En ningún caso PagaTú accede a cuentas bancarias ni realiza movimientos de dinero.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Seguridad</h2>
          <p className="text-muted-foreground leading-relaxed">
            Implementamos medidas técnicas razonables para proteger tu información, incluyendo
            comunicación cifrada vía HTTPS y autenticación segura mediante Google OAuth con tokens JWT.
            Sin embargo, ningún sistema es completamente infalible.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Cookies y sesiones</h2>
          <p className="text-muted-foreground leading-relaxed">
            Utilizamos cookies de sesión estrictamente necesarias para el funcionamiento del inicio de
            sesión con Google OAuth. No utilizamos cookies de seguimiento ni publicidad.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Tus derechos</h2>
          <p className="text-muted-foreground leading-relaxed">
            Tienes derecho a acceder, corregir o eliminar tus datos en cualquier momento. Puedes
            editar tu información bancaria desde tu perfil o solicitar la eliminación de tu cuenta
            contactándonos por email.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Retención de datos</h2>
          <p className="text-muted-foreground leading-relaxed">
            Conservamos tus datos mientras tu cuenta esté activa. Puedes solicitar la eliminación
            completa de tu información en cualquier momento.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Menores de edad</h2>
          <p className="text-muted-foreground leading-relaxed">
            PagaTú no está dirigido a menores de 13 años. Si eres padre/tutor y crees que tu hijo
            ha proporcionado información personal, contáctanos para eliminarla.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">10. Cambios a esta política</h2>
          <p className="text-muted-foreground leading-relaxed">
            Podemos actualizar esta política ocasionalmente. Te notificaremos de cambios significativos
            publicando la nueva versión en esta página con la fecha de actualización.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">11. Contacto</h2>
          <p className="text-muted-foreground leading-relaxed">
            Si tienes preguntas sobre esta política de privacidad, puedes contactarnos en:{" "}
            <a href="mailto:contacto@pagatu.cl" className="text-violet-600 underline">contacto@pagatu.cl</a>
          </p>
        </section>
      </main>

      <footer className="border-t py-8 mt-8">
        <div className="container px-4 text-center">
          <p className="text-sm text-muted-foreground">© 2025 PagaTú · <button onClick={() => navigate('/privacy')} className="underline">Política de Privacidad</button></p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
