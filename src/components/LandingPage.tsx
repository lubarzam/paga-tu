import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { DollarSign, Calculator, Users, Bell, ArrowRight, Star, Zap, Check, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import HeroIllustration from "@/components/HeroIllustration";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleAuthAction = async () => {
    if (user) {
      navigate('/dashboard');
    } else {
      try {
        signInWithGoogle();
      } catch (error) {
        console.error('Error signing in:', error);
      }
    }
  };

  const features = [
    {
      icon: <Users className="h-6 w-6" />,
      gradient: "from-violet-500 to-purple-600",
      title: "Pa' cada uno lo suyo",
      description: "Cada persona paga exactamente lo que consumió. Sin el cuento del 'dividamos en partes iguales', poh.",
    },
    {
      icon: <Calculator className="h-6 w-6" />,
      gradient: "from-emerald-500 to-teal-600",
      title: "Propina sin drama",
      description: "Agrega la propina del 10% y se distribuye proporcionalmente. Tal como manda la ley chilena.",
    },
    {
      icon: <Bell className="h-6 w-6" />,
      gradient: "from-orange-400 to-rose-500",
      title: "Cobra sin quedar mal",
      description: "Manda recordatorios por email a los que deben. Sin conversaciones incómodas en el grupo de WhatsApp.",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      gradient: "from-blue-500 to-cyan-600",
      title: "Al tiro y desde el celu",
      description: "Crea la cuenta en 2 minutos, justo cuando llega la boleta. No más 'ya te mando el número después'.",
    },
  ];

  const steps = [
    { number: "01", title: "Crea la cuenta", desc: "Ingresa el total y los ítems del asado, boliche o restaurant" },
    { number: "02", title: "Asigna a cada uno", desc: "Marca quién pidió qué. El Rodrigo que se comió dos completos que pague por dos" },
    { number: "03", title: "Cobra y listo", desc: "El sistema calcula lo de cada uno. Tú solo pasas el dato y a cobrar" },
  ];

  const testimonials = [
    { name: "Camila F.", comment: "¡Lo uso pa' todos los asados del fin de semana! Se acabó el drama de dividir la carne.", rating: 5, initial: "C" },
    { name: "Rodrigo N.", comment: "Bacán que incluya la propina automática. En el boliche siempre había cuento con eso.", rating: 5, initial: "R" },
    { name: "Valentina H.", comment: "Mis amigas y yo lo usamos en cada junta. Nadie queda debiendo ni un peso.", rating: 5, initial: "V" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-1.5">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">PagaTú</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleAuthAction}>
              Iniciar Sesión
            </Button>
            <Button
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 border-0"
              onClick={handleAuthAction}
            >
              Comenzar Gratis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-36">
        {/* Background gradient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        </div>

        <div className="container px-4 relative">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Left: text */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-full px-4 py-1.5 text-sm text-violet-700 font-medium">
                <Sparkles className="h-3.5 w-3.5" />
                100% Gratis · Sin registro de tarjeta
              </div>

              <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                Divide gastos{" "}
                <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  sin drama
                </span>
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed">
                Para el asado, el boliche, el viaje a Pucón o el almuerzo de trabajo.
                Cada uno paga lo suyo, con propina incluida y sin el cuento del "después te pago".
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="text-base px-8 h-12 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 border-0 shadow-lg shadow-violet-200"
                  onClick={handleAuthAction}
                >
                  Crear mi primera cuenta
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="ml-1">5.0</span>
                </div>
                <div className="w-px h-4 bg-border" />
                <span>Gratis para siempre</span>
                <div className="w-px h-4 bg-border" />
                <span>Sin anuncios</span>
              </div>
            </div>

            {/* Right: illustration */}
            <div className="flex justify-center lg:justify-end">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">Todo lo que necesitas</h2>
            <p className="text-muted-foreground text-lg">Simple, rápido y justo para todos</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <CardContent className="p-6 space-y-4">
                  <div className={`bg-gradient-to-br ${feature.gradient} rounded-2xl p-3 w-fit`}>
                    <div className="text-white">{feature.icon}</div>
                  </div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">¿Cómo funciona, poh?</h2>
            <p className="text-muted-foreground text-lg">Solo 3 pasos y ya está listo el asunto</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center space-y-4">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-violet-300 to-transparent" />
                )}
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-violet-200">
                  <span className="text-xl font-bold text-white">{step.number}</span>
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">Planes</h2>
            <p className="text-muted-foreground text-lg">Empieza gratis, sin límites</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free Plan */}
            <Card className="border-2 border-violet-200 shadow-md">
              <CardContent className="p-8 space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
                    <Check className="h-3 w-3" /> Disponible ahora
                  </div>
                  <h3 className="text-2xl font-bold">Gratis</h3>
                  <p className="text-4xl font-extrabold mt-1">$0 <span className="text-base font-normal text-muted-foreground">/mes</span></p>
                </div>
                <ul className="space-y-3">
                  {[
                    "Cuentas ilimitadas",
                    "Participantes ilimitados",
                    "Recordatorios por email",
                    "Datos bancarios en perfil",
                    "División exacta por ítem",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-emerald-600" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 border-0"
                  onClick={handleAuthAction}
                >
                  Comenzar gratis
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-dashed border-muted-foreground/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-purple-50 opacity-50" />
              <CardContent className="p-8 space-y-6 relative">
                <div>
                  <div className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
                    <Sparkles className="h-3 w-3" /> Próximamente
                  </div>
                  <h3 className="text-2xl font-bold text-muted-foreground">Pro</h3>
                  <p className="text-4xl font-extrabold mt-1 text-muted-foreground">$990 <span className="text-base font-normal">/mes</span></p>
                </div>
                <ul className="space-y-3">
                  {[
                    "Todo del plan Gratis",
                    "Escanea el recibo con la cámara de tu teléfono",
                    "Exportar resumen en PDF",
                    "Integración con Webpay / Mercado Pago",
                    "Historial de pagos con gráficos",
                    "Cuentas recurrentes",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-violet-400" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full" disabled>
                  Próximamente
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">Lo que dicen nuestros usuarios</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-0.5">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed italic">
                    "{testimonial.comment}"
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {testimonial.initial}
                    </div>
                    <p className="font-semibold text-sm">{testimonial.name}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container px-4">
          <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-12 text-center text-white overflow-hidden max-w-3xl mx-auto">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full" />
            </div>
            <div className="relative space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold">¿Listo pa' no quedar debiendo?</h2>
              <p className="text-white/80 text-lg max-w-md mx-auto">
                Gratis, sin publicidad, sin trucos. Solo la forma más bacán de dividir una cuenta en Chile.
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="text-base px-8 h-12 bg-white text-violet-600 hover:bg-white/90 font-semibold"
                onClick={handleAuthAction}
              >
                Empezar al tiro — Es Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-1.5">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">PagaTú</span>
                <p className="text-xs text-muted-foreground">"mañana arreglamos"</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>© 2025 PagaTú.</span>
              <button
                onClick={() => navigate('/privacy')}
                className="underline hover:text-foreground transition-colors"
              >
                Política de Privacidad
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
