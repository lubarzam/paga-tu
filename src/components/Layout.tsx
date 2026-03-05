import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, User, ArrowLeft, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const showBackButton = location.pathname !== '/dashboard';
  const showFloatingButton = location.pathname === '/dashboard';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="mr-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-1.5">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  PagaTú
                </span>
                <p className="text-xs text-muted-foreground leading-none">mañana arreglamos</p>
              </div>
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback>
                        {user.user_metadata?.name?.[0] || user.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">
                      {user.user_metadata?.name || user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    Mi Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </DropdownMenuItem>
                  {user.is_admin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Panel Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Floating Action Button - Solo en dashboard */}
      {showFloatingButton && (
        <Button 
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
          size="icon"
          onClick={() => navigate('/create')}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default Layout;