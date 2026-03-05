import { useState, useEffect } from "react";
import { formatCLP } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Receipt, Users, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { accountService } from "@/services/accountService";
import { toast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
      return;
    }

    if (user) {
      loadAccounts();
    }
  }, [user, authLoading, navigate]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountService.getUserAccounts();
      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las cuentas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccountClick = (accountId: string) => {
    navigate(`/account/${accountId}`);
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Separar cuentas propias y participaciones
  const ownAccounts = accounts.filter(account => account.owner_id === user?.id);
  const participantAccounts = accounts.filter(account => account.owner_id !== user?.id);
  

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm">Total por cobrar</p>
                <p className="text-2xl font-bold">
                  ${formatCLP(ownAccounts.reduce((sum, acc) => sum + (acc.total || 0), 0))}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-400 to-orange-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Total por pagar</p>
                 <p className="text-2xl font-bold">
                   ${formatCLP(participantAccounts.reduce((sum, acc) => sum + (acc.user_amount || 0), 0))}
                 </p>
              </div>
              <Clock className="h-8 w-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-400 to-green-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Cuentas totales</p>
                <p className="text-2xl font-bold">{accounts.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-white/80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="paid" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="paid" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Cuentas que pagué ({ownAccounts.length})
          </TabsTrigger>
          <TabsTrigger value="owed" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Debo pagar ({participantAccounts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paid" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Cuentas que pagué</h2>
            <Button onClick={() => navigate('/create')}>Crear nueva cuenta</Button>
          </div>
          
          <div className="space-y-3">
            {ownAccounts.length === 0 ? (
              <Card className="p-8 text-center">
                <CardContent>
                  <p className="text-muted-foreground mb-4">No has creado ninguna cuenta aún</p>
                  <Button onClick={() => navigate('/create')}>
                    Crear mi primera cuenta
                  </Button>
                </CardContent>
              </Card>
            ) : (
              ownAccounts.map((account) => (
                <Card 
                  key={account.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleAccountClick(account.id)}
                >
                  <CardContent className="p-4">
                     <div className="flex items-center justify-between">
                       <div className="flex-1">
                         <div className="flex items-center gap-2 mb-2">
                           <h3 className="font-semibold">{account.name}</h3>
                           <Badge variant={
                             account.status === 'paid' ? 'default' : 
                             account.status === 'partial' ? 'secondary' : 
                             'destructive'
                           }>
                             {account.status === 'paid' ? 'Pagado' : 
                              account.status === 'partial' ? 'Pagado parcialmente' : 
                              'Pendiente de pago'}
                           </Badge>
                         </div>
                         <div className="flex items-center gap-4 text-sm text-muted-foreground">
                           <span>{new Date(account.created_at).toLocaleDateString()}</span>
                           <div className="flex items-center gap-1">
                             <Users className="h-3 w-3" />
                             {account.participant_count || 0} personas
                           </div>
                           {account.status === 'partial' && (
                             <span>{account.paid_count}/{account.participant_count} pagaron</span>
                           )}
                         </div>
                       </div>
                       <div className="text-right">
                         <p className="font-semibold text-lg">${formatCLP(account.total)}</p>
                         <p className="text-sm text-muted-foreground">Total</p>
                       </div>
                     </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="owed" className="space-y-4">
          <h2 className="text-lg font-semibold">Cuentas donde debo pagar</h2>
          
          <div className="space-y-3">
            {participantAccounts.length === 0 ? (
              <Card className="p-8 text-center">
                <CardContent>
                  <p className="text-muted-foreground">No tienes cuentas pendientes por pagar</p>
                </CardContent>
              </Card>
            ) : (
              participantAccounts.map((account) => (
                <Card 
                  key={account.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleAccountClick(account.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{account.name}</h3>
                          <Badge variant="secondary">
                            Pendiente
                          </Badge>
                        </div>
                         <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                           <span>{new Date(account.created_at).toLocaleDateString()}</span>
                           <span>Pagado por: {account.profiles?.name || account.profiles?.email || 'Usuario'}</span>
                         </div>
                       </div>
                       <div className="text-right">
                         <p className="font-semibold text-lg">${formatCLP(account.total)}</p>
                         <p className="text-xs text-muted-foreground">
                           Mi parte: ${formatCLP(account.user_amount)}
                         </p>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;