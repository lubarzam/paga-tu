import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/integrations/api/client";
import { formatCLP } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Users, CreditCard, DollarSign, ShieldCheck } from "lucide-react";

interface AdminStats {
  total_users: number;
  total_accounts: number;
  total_amount: number;
}

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  is_admin: number;
  created_at: string;
  account_count: number;
}

interface AdminAccount {
  id: string;
  name: string;
  owner_email: string;
  owner_name: string | null;
  total: number;
  participant_count: number;
  status: string;
  created_at: string;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [accountSearch, setAccountSearch] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user?.is_admin) return;
    const load = async () => {
      try {
        const [statsData, usersData, accountsData] = await Promise.all([
          apiClient.get<AdminStats>("/api/admin/stats"),
          apiClient.get<AdminUser[]>("/api/admin/users"),
          apiClient.get<AdminAccount[]>("/api/admin/accounts"),
        ]);
        setStats(statsData);
        setUsers(usersData);
        setAccounts(accountsData);
      } catch (err) {
        console.error("Error loading admin data:", err);
      } finally {
        setDataLoading(false);
      }
    };
    load();
  }, [user]);

  if (authLoading || dataLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredAccounts = accounts.filter(
    (a) =>
      a.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
      a.owner_email.toLowerCase().includes(accountSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-violet-100 rounded-xl p-2">
          <ShieldCheck className="h-6 w-6 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Panel de Administrador</h1>
          <p className="text-sm text-muted-foreground">Vista general de la plataforma</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0 shadow-lg shadow-violet-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs uppercase tracking-wide mb-1">Usuarios</p>
              <p className="text-3xl font-bold">{stats?.total_users ?? 0}</p>
            </div>
            <div className="bg-white/20 rounded-2xl p-3">
              <Users className="h-7 w-7 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg shadow-emerald-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs uppercase tracking-wide mb-1">Cuentas</p>
              <p className="text-3xl font-bold">{stats?.total_accounts ?? 0}</p>
            </div>
            <div className="bg-white/20 rounded-2xl p-3">
              <CreditCard className="h-7 w-7 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-400 to-rose-500 text-white border-0 shadow-lg shadow-orange-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs uppercase tracking-wide mb-1">Total movido</p>
              <p className="text-3xl font-bold">${formatCLP(Number(stats?.total_amount ?? 0))}</p>
            </div>
            <div className="bg-white/20 rounded-2xl p-3">
              <DollarSign className="h-7 w-7 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuarios ({users.length})
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Cuentas ({accounts.length})
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-4 space-y-3">
          <Input
            placeholder="Buscar por nombre o email..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Cuentas</TableHead>
                    <TableHead className="text-center">Rol</TableHead>
                    <TableHead>Registro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt="" className="w-7 h-7 rounded-full" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-600">
                                {(u.name || u.email)[0].toUpperCase()}
                              </div>
                            )}
                            <span className="font-medium">{u.name || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                        <TableCell className="text-center">{u.account_count}</TableCell>
                        <TableCell className="text-center">
                          {u.is_admin ? (
                            <Badge className="bg-violet-100 text-violet-700 border-0">Admin</Badge>
                          ) : (
                            <Badge variant="outline">Usuario</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString("es-CL")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts" className="mt-4 space-y-3">
          <Input
            placeholder="Buscar por nombre de cuenta o email del dueño..."
            value={accountSearch}
            onChange={(e) => setAccountSearch(e.target.value)}
          />
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Dueño</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Personas</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No se encontraron cuentas
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAccounts.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {a.owner_name || a.owner_email}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${formatCLP(Number(a.total))}
                        </TableCell>
                        <TableCell className="text-center">{a.participant_count}</TableCell>
                        <TableCell className="text-center">
                          {a.status === "pagada" ? (
                            <Badge className="bg-green-100 text-green-700 border-0">Pagada</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border-0">Pendiente</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(a.created_at).toLocaleDateString("es-CL")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
