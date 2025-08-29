import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, Calendar, User, DollarSign, X, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { accountService } from "@/services/accountService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AccountDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [showBankDataWarning, setShowBankDataWarning] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (id) {
      loadAccount();
    }
  }, [id]);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('bank_name, account_type, account_number')
        .eq('id', user?.id)
        .single();
      
      setUserProfile(data);
      
      // Check if bank data is missing and show warning
      if (data && (!data.bank_name || !data.account_type || !data.account_number)) {
        setShowBankDataWarning(true);
      } else if (!data) {
        setShowBankDataWarning(true);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setShowBankDataWarning(true);
    }
  };

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

  const handleDeleteAccount = async () => {
    try {
      await accountService.deleteAccount(id);
      toast({
        title: "Cuenta eliminada",
        description: "La cuenta ha sido eliminada exitosamente",
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la cuenta",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Cuenta no encontrada</p>
        <Button onClick={() => navigate('/dashboard')}>
          Volver al dashboard
        </Button>
      </div>
    );
  }

  // Check if current user is the owner
  const isOwner = account.owner_id === user?.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{account.name}</h1>
            {account.description && (
              <p className="text-muted-foreground">{account.description}</p>
            )}
          </div>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Creado el {new Date(account.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <User className="h-4 w-4" />
            <span>Por {isOwner ? 'ti' : 'otro usuario'}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Users className="h-4 w-4" />
            <span>{account.account_participants?.length || 0} participantes</span>
          </div>
        </div>
      </div>

      {/* Bank Data Warning */}
      {showBankDataWarning && isOwner && (
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex-1">
              <strong className="text-orange-800 dark:text-orange-200">Datos bancarios incompletos:</strong>{" "}
              <span className="text-orange-700 dark:text-orange-300">
                Para que tus contactos puedan realizarte transferencias, completa tu información bancaria en tu perfil.
              </span>
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto text-orange-700 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-200 underline ml-1"
                onClick={() => navigate('/profile')}
              >
                Completar ahora
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-orange-600 hover:text-orange-800 hover:bg-orange-100 dark:text-orange-400 dark:hover:text-orange-200 dark:hover:bg-orange-900"
              onClick={() => setShowBankDataWarning(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Account Summary */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Resumen de la cuenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="text-2xl font-bold">${account.subtotal?.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Propina</p>
              <p className="text-2xl font-bold">${account.tip_amount?.toLocaleString() || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-3xl font-bold text-primary">${account.total?.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items and Participants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consumed Items */}
        <Card>
          <CardHeader>
            <CardTitle>Artículos consumidos</CardTitle>
          </CardHeader>
           <CardContent>
             <div className="space-y-3">
               {account.account_items?.map((item, index) => (
                 <div key={index} className="p-3 bg-muted/50 rounded-lg">
                   <div className="flex justify-between items-start">
                        <div className="flex-1">
                        <span className="font-medium">{item.name}</span>
                        {item.participants && item.participants.length > 0 && (
                          <div className="mt-1">
                            <p className="text-xs text-muted-foreground mb-1">Participantes:</p>
                            <div className="flex flex-wrap gap-1">
                              {item.participants.map((participant, pIndex) => {
                                const isCurrentUser = participant.participant_id === user?.id;
                                return (
                                  <Badge 
                                    key={pIndex} 
                                    variant={isCurrentUser ? "default" : "outline"} 
                                    className={`text-xs ${isCurrentUser ? "bg-primary text-primary-foreground font-semibold" : ""}`}
                                  >
                                    {participant.name || participant.email}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        )}
                     </div>
                     <span className="font-semibold ml-4">${item.amount?.toLocaleString()}</span>
                   </div>
                 </div>
               ))}
               {(!account.account_items || account.account_items.length === 0) && (
                 <p className="text-muted-foreground text-center py-4">No hay artículos registrados</p>
               )}
             </div>
           </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle>Participantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {account.account_participants?.map((participant, index) => {
                const isCurrentUser = participant.participant_id === user?.id;
                return (
                  <div 
                    key={index} 
                    className={`flex justify-between items-center p-3 rounded-lg border ${
                      isCurrentUser 
                        ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20" 
                        : "bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isCurrentUser ? "text-primary font-semibold" : ""}`}>
                        {participant.name || participant.email}
                        {isCurrentUser && " (Tú)"}
                      </span>
                      <div className="flex gap-1">
                        {participant.is_registered && (
                          <Badge variant="secondary" className="text-xs">Registrado</Badge>
                        )}
                        {participant.paid && (
                          <Badge variant="default" className="text-xs">Pagado</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${isCurrentUser ? "text-primary text-lg" : ""}`}>
                        ${participant.total_amount?.toLocaleString() || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isCurrentUser ? "Mi parte" : "Su parte"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

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
               <Button 
                 variant="destructive"
                 onClick={() => setShowDeleteDialog(true)}
               >
                 Eliminar cuenta
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
                {account?.account_participants?.filter(p => !p.paid).map((participant) => (
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

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la cuenta 
              "{account?.name}" y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar cuenta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AccountDetail;