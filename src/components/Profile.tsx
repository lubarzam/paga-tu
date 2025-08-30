import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, CreditCard, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
  });
  
  const [bankingDetails, setBankingDetails] = useState({
    bank_name: "",
    account_type: "",
    account_number: "",
    bank_email: "",
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Load profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw profileError;
      }

      // Load banking details separately
      const { data: bankingData, error: bankingError } = await supabase
        .from('banking_details' as any)
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (bankingError && bankingError.code !== 'PGRST116') {
        console.warn('Banking details not found, this is normal for new users');
      }

      if (profileData) {
        setProfile({
          name: profileData.name || "",
          email: profileData.email || user?.email || "",
        });
      } else {
        // If no profile exists, create one with basic info
        setProfile({
          name: user?.user_metadata?.name || "",
          email: user?.email || "",
        });
      }

      if (bankingData) {
        setBankingDetails({
          bank_name: (bankingData as any).bank_name || "",
          account_type: (bankingData as any).account_type || "",
          account_number: (bankingData as any).account_number || "",
          bank_email: (bankingData as any).bank_email || "",
        });
      } else {
        setBankingDetails({
          bank_name: "",
          account_type: "",
          account_number: "",
          bank_email: "",
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Save profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          name: profile.name,
          email: profile.email,
        });

      if (profileError) throw profileError;

      // Save banking details separately
      const { error: bankingError } = await supabase
        .from('banking_details' as any)
        .upsert({
          user_id: user?.id,
          bank_name: bankingDetails.bank_name,
          account_type: bankingDetails.account_type,
          account_number: bankingDetails.account_number,
          bank_email: bankingDetails.bank_email,
        } as any);

      if (bankingError) throw bankingError;

      toast({
        title: "Perfil actualizado",
        description: "Los cambios han sido guardados exitosamente",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el perfil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'name' || field === 'email') {
      setProfile(prev => ({
        ...prev,
        [field]: value
      }));
    } else {
      setBankingDetails(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <User className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
      </div>

      {/* Información Personal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>
                {profile.name?.[0] || user?.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Tu nombre completo"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="tu@email.com"
                disabled
              />
              <p className="text-xs text-muted-foreground mt-1">
                El email no se puede cambiar desde aquí
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información Bancaria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Información de Cuenta Corriente
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Esta información se incluirá en los recordatorios de pago que envíes
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankName">Banco</Label>
              <Select
                value={bankingDetails.bank_name}
                onValueChange={(value) => handleInputChange('bank_name', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu banco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banco_de_chile">Banco de Chile</SelectItem>
                  <SelectItem value="banco_santander">Banco Santander</SelectItem>
                  <SelectItem value="banco_estado">BancoEstado</SelectItem>
                  <SelectItem value="banco_bci">Banco BCI</SelectItem>
                  <SelectItem value="banco_security">Banco Security</SelectItem>
                  <SelectItem value="banco_falabella">Banco Falabella</SelectItem>
                  <SelectItem value="banco_ripley">Banco Ripley</SelectItem>
                  <SelectItem value="scotiabank">Scotiabank</SelectItem>
                  <SelectItem value="banco_internacional">Banco Internacional</SelectItem>
                  <SelectItem value="banco_consorcio">Banco Consorcio</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="accountType">Tipo de cuenta</Label>
              <Select
                value={bankingDetails.account_type}
                onValueChange={(value) => handleInputChange('account_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de cuenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cuenta_corriente">Cuenta Corriente</SelectItem>
                  <SelectItem value="cuenta_vista">Cuenta Vista</SelectItem>
                  <SelectItem value="cuenta_ahorro">Cuenta de Ahorro</SelectItem>
                  <SelectItem value="cuenta_rut">CuentaRUT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="accountNumber">Número de cuenta</Label>
              <Input
                id="accountNumber"
                value={bankingDetails.account_number}
                onChange={(e) => handleInputChange('account_number', e.target.value)}
                placeholder="12345678"
              />
            </div>
            <div>
              <Label htmlFor="bankEmail">Email del banco (opcional)</Label>
              <Input
                id="bankEmail"
                type="email"
                value={bankingDetails.bank_email}
                onChange={(e) => handleInputChange('bank_email', e.target.value)}
                placeholder="tu@banco.cl"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email asociado a tu cuenta bancaria
              </p>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">💡 ¿Para qué sirve esta información?</h4>
            <p className="text-sm text-muted-foreground">
              Cuando envíes recordatorios de pago, los participantes verán tus datos bancarios 
              para facilitar las transferencias. Esta información solo se incluye en los emails 
              cuando tú eres el dueño de la cuenta.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </div>
  );
};

export default Profile;