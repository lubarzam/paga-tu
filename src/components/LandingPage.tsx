import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { DollarSign, Calculator, Users, Bell, ArrowRight, Star } from "lucide-react";
import heroImage from "@/assets/hero-banner.jpg";
import featureSplit from "@/assets/feature-split.jpg";
import featurePrecise from "@/assets/feature-precise.jpg";
import featureTrack from "@/assets/feature-track.jpg";

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "División Inteligente",
      description: "Divide gastos de manera precisa según lo que cada persona consumió realmente",
      image: featureSplit
    },
    {
      icon: <Calculator className="h-8 w-8 text-primary" />,
      title: "Cálculos Exactos",
      description: "Incluye propinas y distribuye los montos proporcionalmente sin errores",
      image: featurePrecise
    },
    {
      icon: <Bell className="h-8 w-8 text-primary" />,
      title: "Seguimiento Fácil",
      description: "Mantén el control de quién pagó y quién debe, todo en un lugar",
      image: featureTrack
    }
  ];

  const testimonials = [
    {
      name: "María González",
      comment: "¡Perfecto para nuestras salidas de trabajo! Ya no hay confusión con las cuentas.",
      rating: 5
    },
    {
      name: "Carlos Ruiz",
      comment: "Me encanta que puedo agregar la propina y se divide automáticamente.",
      rating: 5
    },
    {
      name: "Ana Silva",
      comment: "Super fácil de usar, mis amigos y yo lo usamos en cada salida.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">PagaTu</h1>
              <p className="text-xs text-muted-foreground">mañana arreglamos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
            >
              Iniciar Sesión
            </Button>
            <Button onClick={() => navigate('/dashboard')}>
              Comenzar Gratis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="container px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  Divide gastos{" "}
                  <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    de manera justa
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-md">
                  Sin dividir en partes iguales. Cada quien paga exactamente por lo que consumió.
                </p>
                <p className="text-lg font-semibold text-primary">
                  "mañana arreglamos" ✨
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="text-lg px-8"
                  onClick={() => navigate('/dashboard')}
                >
                  Crear Mi Primera Cuenta
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  Ver Demo
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Amigos dividiendo la cuenta en un restaurante"
                className="rounded-2xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              ¿Por qué elegir PagaTu?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              La forma más fácil y precisa de dividir gastos entre amigos, familia o compañeros de trabajo
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    {feature.icon}
                    <h3 className="text-xl font-semibold text-foreground">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              ¿Cómo funciona?
            </h2>
            <p className="text-xl text-muted-foreground">
              Solo 3 pasos para dividir cualquier cuenta
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-foreground">1</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground">Crea la cuenta</h3>
              <p className="text-muted-foreground">
                Ingresa el total que pagaste y agrega los ítems consumidos
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-foreground">2</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground">Asigna participantes</h3>
              <p className="text-muted-foreground">
                Selecciona quién participó en cada ítem y agrega propina si deseas
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-foreground">3</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground">Comparte y cobra</h3>
              <p className="text-muted-foreground">
                El sistema calcula automáticamente cuánto debe pagar cada persona
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/50">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Lo que dicen nuestros usuarios
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <CardContent className="space-y-4">
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground italic">
                    "{testimonial.comment}"
                  </p>
                  <p className="font-semibold text-foreground">
                    {testimonial.name}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container px-4">
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              ¿Listo para dividir cuentas sin drama?
            </h2>
            <p className="text-xl text-muted-foreground">
              Únete a miles de usuarios que ya divideen sus gastos de manera inteligente
            </p>
            <Button 
              size="lg" 
              className="text-lg px-8"
              onClick={() => navigate('/dashboard')}
            >
              Comenzar Ahora - Es Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              <div>
                <p className="font-bold text-foreground">PagaTu</p>
                <p className="text-sm text-muted-foreground">mañana arreglamos</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 PagaTu. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;