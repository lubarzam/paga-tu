import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, User } from "lucide-react";

const Layout = () => {
  const navigate = useNavigate();

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
            <Button variant="outline" size="icon">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Floating Action Button */}
      <Button 
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        onClick={() => navigate('/create')}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default Layout;