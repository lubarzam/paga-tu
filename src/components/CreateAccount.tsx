import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, X, Users, Calculator, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { accountService } from "@/services/accountService";

interface Item {
  id: number;
  name: string;
  amount: number;
  participants: string[];
}

const CreateAccount = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [accountName, setAccountName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [currentItem, setCurrentItem] = useState({ name: "", amount: "" });
  const [participants, setParticipants] = useState<string[]>([]);
  const [newParticipant, setNewParticipant] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [tip, setTip] = useState("");
  const [tipIncluded, setTipIncluded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const addParticipant = () => {
    if (newParticipant && !participants.includes(newParticipant)) {
      setParticipants([...participants, newParticipant]);
      setNewParticipant("");
    }
  };

  const removeParticipant = (participant: string) => {
    if (participant !== "Tu") {
      setParticipants(participants.filter(p => p !== participant));
      setSelectedParticipants(selectedParticipants.filter(p => p !== participant));
    }
  };

  const toggleParticipant = (participant: string) => {
    if (selectedParticipants.includes(participant)) {
      setSelectedParticipants(selectedParticipants.filter(p => p !== participant));
    } else {
      setSelectedParticipants([...selectedParticipants, participant]);
    }
  };

  const addItem = () => {
    if (currentItem.name && currentItem.amount && selectedParticipants.length > 0) {
      const newItem: Item = {
        id: Date.now(),
        name: currentItem.name,
        amount: parseFloat(currentItem.amount),
        participants: [...selectedParticipants]
      };
      setItems([...items, newItem]);
      setCurrentItem({ name: "", amount: "" });
      setSelectedParticipants(["Tu"]);
    }
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateSuggestedTip = () => {
    const subtotal = calculateSubtotal();
    return subtotal * 0.1; // 10% según legislación chilena
  };

  const calculateTotal = () => {
    const itemsTotal = calculateSubtotal();
    let tipAmount = 0;
    
    if (tipIncluded) {
      tipAmount = tip ? parseFloat(tip) : calculateSuggestedTip();
    }
    
    return itemsTotal + tipAmount;
  };

  const calculatePersonTotal = (person: string) => {
    let total = 0;
    
    // Calcular ítems
    items.forEach(item => {
      if (item.participants.includes(person)) {
        total += item.amount / item.participants.length;
      }
    });

    // Calcular propina proporcional (solo si está incluida)
    if (tipIncluded) {
      let tipAmount = tip ? parseFloat(tip) : calculateSuggestedTip();
      const subtotal = calculateSubtotal();
      const personSubtotal = items.reduce((sum, item) => {
        return item.participants.includes(person) 
          ? sum + (item.amount / item.participants.length)
          : sum;
      }, 0);
      
      if (subtotal > 0) {
        // La propina se distribuye proporcionalmente según lo que cada persona consumió del subtotal
        total += (tipAmount * personSubtotal) / subtotal;
      }
    }

    return total;
  };

  const handleCreateAccount = async () => {
    if (!accountName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la cuenta es obligatorio",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Debes agregar al menos un ítem",
        variant: "destructive",
      });
      return;
    }

    if (participants.length === 0) {
      toast({
        title: "Error",
        description: "Debes agregar al menos un participante",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Preparar datos para envío
      const accountData = {
        name: accountName,
        description: description || undefined,
        items: items.map(item => ({
          name: item.name,
          amount: item.amount,
          participants: item.participants,
        })),
        participants: participants.map(email => ({
          email,
          name: email.split('@')[0], // Usar parte antes del @ como nombre temporal
        })),
        tipIncluded,
        tipAmount: tipIncluded ? (tip ? parseFloat(tip) : calculateSuggestedTip()) : 0,
      };

      const createdAccount = await accountService.createAccount(accountData);
      
      toast({
        title: "Cuenta creada",
        description: `La cuenta "${accountName}" ha sido creada exitosamente y se han enviado las invitaciones`,
      });

      // Redirigir al detalle de la cuenta creada
      navigate(`/account/${createdAccount.id}`);
    } catch (error) {
      console.error('Error creating account:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la cuenta. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Crear nueva cuenta</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario principal */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="accountName">Nombre de la cuenta</Label>
                <Input
                  id="accountName"
                  placeholder="Ej: Cena en el restaurante"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Detalles adicionales..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {participants.map((participant) => (
                  <div key={participant} className="flex items-center gap-1">
                    <Badge variant={participant === "Tu" ? "default" : "secondary"}>
                      {participant}
                      {participant !== "Tu" && (
                        <X 
                          className="h-3 w-3 ml-1 cursor-pointer" 
                          onClick={() => removeParticipant(participant)}
                        />
                      )}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Email del participante (ej: juan@email.com)"
                  type="email"
                  value={newParticipant}
                  onChange={(e) => setNewParticipant(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
                />
                <Button onClick={addParticipant}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agregar ítem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="itemName">Nombre del ítem</Label>
                  <Input
                    id="itemName"
                    placeholder="Ej: Pizza Margarita"
                    value={currentItem.name}
                    onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="itemAmount">Monto</Label>
                  <Input
                    id="itemAmount"
                    type="number"
                    placeholder="0"
                    value={currentItem.amount}
                    onChange={(e) => setCurrentItem({...currentItem, amount: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>¿Quién participó en este ítem?</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {participants.map((participant) => (
                    <Badge
                      key={participant}
                      variant={selectedParticipants.includes(participant) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleParticipant(participant)}
                    >
                      {participant}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button onClick={addItem} className="w-full">
                Agregar ítem
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Propina (Legislación Chilena)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="tip-toggle">Incluir propina</Label>
                  <p className="text-sm text-muted-foreground">
                    La propina es opcional según la ley chilena
                  </p>
                </div>
                <Switch
                  id="tip-toggle"
                  checked={tipIncluded}
                  onCheckedChange={setTipIncluded}
                />
              </div>
              
              {tipIncluded && (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">
                      Propina sugerida (10% sobre el total): ${calculateSuggestedTip().toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Puedes agregar un monto igual o superior al 10%
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-tip">Monto de propina</Label>
                    <Input
                      id="custom-tip"
                      type="number"
                      placeholder={`${calculateSuggestedTip().toFixed(0)}`}
                      value={tip}
                      onChange={(e) => setTip(e.target.value)}
                      min={calculateSuggestedTip()}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Mínimo ${calculateSuggestedTip().toLocaleString()} (10% del subtotal)
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumen */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ítems agregados</CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No hay ítems agregados aún
                </p>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.participants.join(", ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">${item.amount.toLocaleString()}</span>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => removeItem(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen de pagos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {participants.map((person) => {
                  const amount = calculatePersonTotal(person);
                  return (
                    <div key={person} className="flex justify-between items-center">
                      <span className={person === "Tu" ? "font-semibold" : ""}>
                        {person}
                      </span>
                      <span className="font-semibold">
                        ${amount.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  );
                })}
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span>Subtotal</span>
                    <span>${calculateSubtotal().toLocaleString()}</span>
                  </div>
                  
                  {tipIncluded && (
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Propina sobre el total</span>
                      <span>
                        ${(tip ? parseFloat(tip) : calculateSuggestedTip()).toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center font-bold text-lg border-t pt-2 mt-2">
                    <span>Total</span>
                    <span>${calculateTotal().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            className="w-full" 
            size="lg"
            disabled={!accountName || items.length === 0 || participants.length === 0 || isSubmitting}
            onClick={handleCreateAccount}
          >
            {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;