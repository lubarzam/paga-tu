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
  

  const statusBorder: Record<string, string> = {
    paid:    'border-l-4 border-l-green-400',
    partial: 'border-l-4 border-l-yellow-400',
    pending: 'border-l-4 border-l-red-400',
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200 border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-wide mb-1">Por cobrar</p>
                <p className="text-3xl font-bold">
                  ${formatCLP(ownAccounts.reduce((sum, acc) => sum + (acc.total || 0), 0))}
                </p>
                <p className="text-white/70 text-xs mt-1">{ownAccounts.length} cuenta{ownAccounts.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="bg-white/20 rounded-2xl p-3">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-lg shadow-orange-200 border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-wide mb-1">Por pagar</p>
                <p className="text-3xl font-bold">
                  ${formatCLP(participantAccounts.reduce((sum, acc) => sum + (acc.user_amount || 0), 0))}
                </p>
                <p className="text-white/70 text-xs mt-1">{participantAccounts.length} cuenta{participantAccounts.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="bg-white/20 rounded-2xl p-3">
                <Clock className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-200 border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-wide mb-1">Total cuentas</p>
                <p className="text-3xl font-bold">{accounts.length}</p>
                <p className="text-white/70 text-xs mt-1">activas</p>
              </div>
              <div className="bg-white/20 rounded-2xl p-3">
                <CheckCircle className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="paid" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="paid" className="flex items-center gap-2 text-sm font-medium">
            <CreditCard className="h-4 w-4" />
            Pagué yo ({ownAccounts.length})
          </TabsTrigger>
          <TabsTrigger value="owed" className="flex items-center gap-2 text-sm font-medium">
            <Receipt className="h-4 w-4" />
            Debo pagar ({participantAccounts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paid" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-muted-foreground">Cuentas que pagué</h2>
            <Button onClick={() => navigate('/create')} size="sm">
              + Nueva cuenta
            </Button>
          </div>

          <div className="space-y-3">
            {ownAccounts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-10 text-center">
                  <div className="bg-primary/10 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-7 w-7 text-primary" />
                  </div>
                  <p className="font-medium mb-1">Aún no has creado cuentas</p>
                  <p className="text-muted-foreground text-sm mb-4">Divide gastos fácilmente con tus amigos</p>
                  <Button onClick={() => navigate('/create')}>Crear mi primera cuenta</Button>
                </CardContent>
              </Card>
            ) : (
              ownAccounts.map((account) => (
                <Card
                  key={account.id}
                  className={`hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 ${statusBorder[account.status] || statusBorder.pending}`}
                  onClick={() => handleAccountClick(account.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{account.name}</h3>
                          <Badge className={
                            account.status === 'paid'    ? 'bg-green-100 text-green-700 border-0' :
                            account.status === 'partial' ? 'bg-yellow-100 text-yellow-700 border-0' :
                                                           'bg-red-100 text-red-700 border-0'
                          }>
                            {account.status === 'paid' ? 'Cobrado' :
                             account.status === 'partial' ? 'Parcial' : 'Pendiente'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{new Date(account.created_at).toLocaleDateString('es-CL')}</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {account.participant_count || 0} personas
                          </span>
                          {account.status === 'partial' && (
                            <span>{account.paid_count}/{account.participant_count} pagaron</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <p className="font-bold text-lg text-primary">${formatCLP(account.total)}</p>
                        <p className="text-xs text-muted-foreground">total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="owed" className="space-y-4 mt-4">
          <h2 className="text-base font-semibold text-muted-foreground">Cuentas donde debo pagar</h2>

          <div className="space-y-3">
            {participantAccounts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-10 text-center">
                  <div className="bg-green-100 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-7 w-7 text-green-600" />
                  </div>
                  <p className="font-medium mb-1">¡Todo al día!</p>
                  <p className="text-muted-foreground text-sm">No tienes cuentas pendientes por pagar</p>
                </CardContent>
              </Card>
            ) : (
              participantAccounts.map((account) => (
                <Card
                  key={account.id}
                  className="hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 border-l-4 border-l-orange-400"
                  onClick={() => handleAccountClick(account.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate mb-1">{account.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{new Date(account.created_at).toLocaleDateString('es-CL')}</span>
                          <span>Pagó: {account.profiles?.name || account.profiles?.email || 'Usuario'}</span>
                        </div>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <p className="font-bold text-lg text-orange-500">${formatCLP(account.user_amount)}</p>
                        <p className="text-xs text-muted-foreground">mi parte</p>
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