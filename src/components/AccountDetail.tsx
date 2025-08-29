import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Calendar, DollarSign, Receipt, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { accountService } from "@/services/accountService";
import { toast } from "@/hooks/use-toast";

const AccountDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState("");

  useEffect(() => {
    if (id) {
      loadAccount();
    }
  }, [id]);

  const loadAccount = async () => {
    try {
      setLoading(true);
      const data = await accountService.getAccount(id);
      setAccount(data);
    } catch (error) {
      console.error('Error loading account:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la cuenta",
        variant: "destructive",
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async () => {
    try {
      setSendingReminder(true);
      await accountService.sendReminder(id);
      toast({
        title: "Recordatorio enviado",
        description: "Se han enviado recordatorios a todos los participantes",
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el recordatorio",
        variant: "destructive",
      });
    } finally {
      setSendingReminder(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedParticipant) return;
    
    try {
      await accountService.markAsPaid(id, selectedParticipant);
      toast({
        title: "Marcado como pagado",
        description: "El participante ha sido marcado como pagado",
      });
      setShowMarkPaidDialog(false);
      setSelectedParticipant("");
      loadAccount(); // Reload to show updated status
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast({
        title: "Error",
        description: "No se pudo marcar como pagado",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Cuenta no encontrada</p>
        <Button onClick={() => navigate('/dashboard')} className="mt-4">
          Volver al Dashboard
        </Button>
      </div>
    );
  }

  const isOwner = account.owner_id === user?.id;
  const creatorName = isOwner ? 'Tú' : (account.profiles?.name || account.profiles?.email || 'Usuario');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{account.name}</h1>
        {account.description && (
          <p className="text-muted-foreground">{account.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(account.created_at).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            Creado por {creatorName}
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {account.account_participants?.length || 0} participantes
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Resumen de la cuenta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Resumen de la cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">${account.subtotal?.toLocaleString()}</span>
            </div>
            
            {account.tip_included && account.tip_amount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Propina</span>
                <span className="font-semibold">${account.tip_amount?.toLocaleString()}</span>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-primary">${account.total?.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Items consumidos */}
        <Card>
          <CardHeader>
            <CardTitle>Items de la cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {account.account_items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {/* Aquí podrías mostrar los participantes del item */}
                      Item individual
                    </p>
                  </div>
                  <span className="font-semibold">${item.amount?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participantes y sus totales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {account.account_participants?.map((participant) => (
              <div key={participant.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-semibold">
                      {(participant.name || participant.email)?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {participant.name || participant.email}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant={participant.is_registered ? "default" : "secondary"}>
                        {participant.is_registered ? "Registrado" : "Invitado"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${participant.total_amount?.toLocaleString() || "0"}</p>
                  <p className="text-sm text-muted-foreground">Su parte</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline"
                onClick={() => navigate(`/account/${id}/edit`)}
              >
                Editar cuenta
              </Button>
              <Button 
                variant="outline"
                onClick={handleSendReminder}
                disabled={sendingReminder}
              >
                {sendingReminder ? "Enviando..." : "Enviar recordatorio"}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowMarkPaidDialog(true)}
              >
                Marcar como pagado
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mark as Paid Dialog */}
      <AlertDialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como pagado</AlertDialogTitle>
            <AlertDialogDescription>
              Selecciona el participante que ya ha realizado el pago:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={selectedParticipant} onValueChange={setSelectedParticipant}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar participante" />
              </SelectTrigger>
              <SelectContent>
                {account?.account_participants?.map((participant) => (
                  <SelectItem key={participant.id} value={participant.id}>
                    {participant.name || participant.email} - ${participant.total_amount?.toLocaleString() || '0'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleMarkAsPaid}
              disabled={!selectedParticipant}
            >
              Marcar como pagado
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AccountDetail;