import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Receipt, Users, TrendingUp, Clock, CheckCircle } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  // Mock data - En producción vendría de la API
  const [paidAccounts] = useState([
    {
      id: 1,
      name: "Cena El Parrillón",
      date: "2024-01-15",
      total: 45000,
      participants: 4,
      status: "pending",
      owedAmount: 32000
    },
    {
      id: 2,
      name: "Almuerzo Café Central",
      date: "2024-01-12",
      total: 28000,
      participants: 3,
      status: "completed",
      owedAmount: 0
    }
  ]);

  const [owedAccounts] = useState([
    {
      id: 3,
      name: "Cine y Palomitas",
      date: "2024-01-14",
      total: 22000,
      myShare: 7500,
      paidBy: "María González",
      status: "pending"
    },
    {
      id: 4,
      name: "Pizza con amigos",
      date: "2024-01-10",
      total: 35000,
      myShare: 8750,
      paidBy: "Carlos Ruiz",
      status: "paid"
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm">Total por cobrar</p>
                <p className="text-2xl font-bold">$32.000</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning to-orange-400 text-warning-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warning-foreground/80 text-sm">Total por pagar</p>
                <p className="text-2xl font-bold">$7.500</p>
              </div>
              <Clock className="h-8 w-8 text-warning-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success to-emerald-500 text-success-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-success-foreground/80 text-sm">Pagos completados</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success-foreground/80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="paid" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="paid" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Cuentas que pagué
          </TabsTrigger>
          <TabsTrigger value="owed" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Debo pagar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paid" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Cuentas que pagué</h2>
            <Button onClick={() => navigate('/create')}>Crear nueva cuenta</Button>
          </div>
          
          <div className="space-y-3">
            {paidAccounts.map((account) => (
              <Card key={account.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{account.name}</h3>
                        <Badge variant={account.status === 'completed' ? 'default' : 'secondary'}>
                          {account.status === 'completed' ? 'Completado' : 'Pendiente'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{account.date}</span>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {account.participants} personas
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">${account.total.toLocaleString()}</p>
                      {account.owedAmount > 0 && (
                        <p className="text-sm text-warning">
                          Pendiente: ${account.owedAmount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="owed" className="space-y-4">
          <h2 className="text-lg font-semibold">Cuentas donde debo pagar</h2>
          
          <div className="space-y-3">
            {owedAccounts.map((account) => (
              <Card key={account.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{account.name}</h3>
                        <Badge variant={account.status === 'paid' ? 'default' : 'destructive'}>
                          {account.status === 'paid' ? 'Pagado' : 'Pendiente'}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <span>{account.date}</span>
                        <span>Pagado por: {account.paidBy}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">${account.myShare.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        Total: ${account.total.toLocaleString()}
                      </p>
                      {account.status === 'pending' && (
                        <Button size="sm" className="mt-2">
                          Marcar como pagado
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;