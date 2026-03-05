import { useState, useEffect, useRef } from "react";
import { formatCLP } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, X, Users, Calculator, Info, ChevronDown, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { accountService } from "@/services/accountService";
import { contactsService, FrequentContact } from "@/services/contactsService";

interface Item {
  id: number;
  name: string;
  amount: number;
  participants: string[]; // participant names
}

interface Participant {
  name: string;
  email: string;
}

const CreateAccount = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [accountName, setAccountName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [currentItem, setCurrentItem] = useState({ name: "", amount: "" });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [newParticipantEmail, setNewParticipantEmail] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [frequentContacts, setFrequentContacts] = useState<FrequentContact[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<FrequentContact[]>([]);
  const [tip, setTip] = useState("");
  const [tipIncluded, setTipIncluded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<{ name: string; amount: number; selected: boolean }[]>([]);
  const [showScanModal, setShowScanModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadFrequentContacts();
    }
  }, [user]);

  useEffect(() => {
    if (newParticipantName || newParticipantEmail) {
      searchContacts();
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  }, [newParticipantName, newParticipantEmail]);

  const loadFrequentContacts = async () => {
    try {
      const contacts = await contactsService.getFrequentContacts();
      setFrequentContacts(contacts);
    } catch (error) {
      console.error('Error loading frequent contacts:', error);
    }
  };

  const searchContacts = async () => {
    const query = newParticipantName || newParticipantEmail;
    if (query.length < 2) {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const suggestions = await contactsService.searchContacts(query);
      setFilteredSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('Error searching contacts:', error);
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (contact: FrequentContact) => {
    setNewParticipantName(contact.name);
    setNewParticipantEmail(contact.email);
    setShowSuggestions(false);
  };

  const addParticipant = async () => {
    if (!newParticipantName.trim() || !newParticipantEmail.trim()) {
      toast({
        title: "Error",
        description: "Debes ingresar nombre y email del participante",
        variant: "destructive",
      });
      return;
    }

    const emailExists = participants.some(p => p.email === newParticipantEmail);
    if (emailExists) {
      toast({
        title: "Error",
        description: "Este email ya está agregado",
        variant: "destructive",
      });
      return;
    }

    const newParticipant: Participant = {
      name: newParticipantName.trim(),
      email: newParticipantEmail.trim()
    };

    setParticipants([...participants, newParticipant]);
    
    // Save to frequent contacts
    try {
      await contactsService.addOrUpdateContact(newParticipant.name, newParticipant.email);
      await loadFrequentContacts(); // Refresh the list
    } catch (error) {
      console.error('Error saving frequent contact:', error);
    }

    setNewParticipantName("");
    setNewParticipantEmail("");
    setShowSuggestions(false);
  };

  const removeParticipant = (email: string) => {
    setParticipants(participants.filter(p => p.email !== email));
    setSelectedParticipants(selectedParticipants.filter(p => p !== getParticipantName(email)));
  };

  const getParticipantName = (email: string) => {
    const participant = participants.find(p => p.email === email);
    return participant ? participant.name : email;
  };

  const getAllParticipantNames = () => {
    return ["Tu", ...participants.map(p => p.name)];
  };

  const toggleParticipant = (participantName: string) => {
    if (selectedParticipants.includes(participantName)) {
      setSelectedParticipants(selectedParticipants.filter(p => p !== participantName));
    } else {
      setSelectedParticipants([...selectedParticipants, participantName]);
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
      setSelectedParticipants([]);
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
        participants: participants.map(participant => ({
          email: participant.email,
          name: participant.name,
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScanReceipt = () => {
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: { target: HTMLInputElement }) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsScanning(true);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('spa');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      // Parse lines: match "some text   1234" or "some text   $1.234"
      const lines = text.split('\n');
      const detected: { name: string; amount: number; selected: boolean }[] = [];
      for (const line of lines) {
        const match = line.trim().match(/^(.+?)\s{2,}[\$]?\s*([\d.,]+)\s*$/);
        if (!match) continue;
        const name = match[1].replace(/\s+/g, ' ').trim();
        const amount = parseInt(match[2].replace(/[.,]/g, ''), 10);
        if (name.length > 1 && amount > 0) {
          detected.push({ name, amount, selected: true });
        }
      }

      if (detected.length === 0) {
        toast({ title: "Sin resultados", description: "No se detectaron ítems. Intenta con una foto más clara.", variant: "destructive" });
      } else {
        setScannedItems(detected);
        setShowScanModal(true);
      }
    } catch {
      toast({ title: "Error", description: "No se pudo procesar la imagen.", variant: "destructive" });
    } finally {
      setIsScanning(false);
    }
  };

  const confirmScannedItems = () => {
    const toAdd = scannedItems.filter(i => i.selected);
    const newItems: Item[] = toAdd.map(i => ({
      id: Date.now() + Math.random(),
      name: i.name,
      amount: i.amount,
      participants: [],
    }));
    setItems(prev => [...prev, ...newItems]);
    setShowScanModal(false);
    setScannedItems([]);
    toast({ title: `${newItems.length} ítems agregados`, description: "Ahora asigna participantes a cada ítem." });
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
                <Badge variant="default">Tu</Badge>
                {participants.map((participant) => (
                  <div key={participant.email} className="flex items-center gap-1">
                    <Badge variant="secondary">
                      {participant.name}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => removeParticipant(participant.email)}
                      />
                    </Badge>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Label htmlFor="participantName">Nombre</Label>
                    <Input
                      id="participantName"
                      placeholder="Nombre del participante"
                      value={newParticipantName}
                      onChange={(e) => setNewParticipantName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="participantEmail">Email</Label>
                    <Input
                      id="participantEmail"
                      type="email"
                      placeholder="email@ejemplo.com"
                      value={newParticipantEmail}
                      onChange={(e) => setNewParticipantEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
                    />
                  </div>
                </div>
                
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="relative">
                    <div className="absolute top-0 left-0 right-0 bg-card border border-border rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                      {filteredSuggestions.map((contact) => (
                        <div
                          key={contact.id}
                          className="px-3 py-2 hover:bg-accent cursor-pointer border-b last:border-b-0"
                          onClick={() => selectSuggestion(contact)}
                        >
                          <div className="font-medium">{contact.name}</div>
                          <div className="text-sm text-muted-foreground">{contact.email}</div>
                          <div className="text-xs text-muted-foreground">Usado {contact.usage_count} veces</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <Button onClick={addParticipant} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar participante
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Agregar ítem</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleScanReceipt}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analizando...</>
                  ) : (
                    <><Camera className="h-4 w-4 mr-2" />Escanear boleta</>
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={onFileSelected}
                />
              </div>
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
                  {getAllParticipantNames().map((participantName) => (
                    <Badge
                      key={participantName}
                      variant={selectedParticipants.includes(participantName) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleParticipant(participantName)}
                    >
                      {participantName}
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
                      Propina sugerida (10% sobre el total): ${formatCLP(calculateSuggestedTip())}
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
                      Mínimo ${formatCLP(calculateSuggestedTip())} (10% del subtotal)
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
                        <span className="font-semibold">${formatCLP(item.amount)}</span>
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
                {getAllParticipantNames().map((person) => {
                  const amount = calculatePersonTotal(person);
                  return (
                    <div key={person} className="flex justify-between items-center">
                      <span className={person === "Tu" ? "font-semibold" : ""}>
                        {person}
                      </span>
                      <span className="font-semibold">
                        ${formatCLP(amount)}
                      </span>
                    </div>
                  );
                })}
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span>Subtotal</span>
                    <span>${formatCLP(calculateSubtotal())}</span>
                  </div>
                  
                  {tipIncluded && (
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Propina sobre el total</span>
                      <span>
                        ${formatCLP(tip ? parseFloat(tip) : calculateSuggestedTip())}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center font-bold text-lg border-t pt-2 mt-2">
                    <span>Total</span>
                    <span>${formatCLP(calculateTotal())}</span>
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

      {/* Modal de revisión de boleta escaneada */}
      {showScanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-lg font-bold">Ítems detectados</h2>
              <p className="text-sm text-muted-foreground">Selecciona los que quieres agregar</p>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {scannedItems.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => setScannedItems(prev =>
                      prev.map((it, i) => i === index ? { ...it, selected: !it.selected } : it)
                    )}
                    className="h-4 w-4 shrink-0"
                  />
                  <input
                    type="text"
                    value={item.name}
                    onChange={e => setScannedItems(prev =>
                      prev.map((it, i) => i === index ? { ...it, name: e.target.value } : it)
                    )}
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                  <input
                    type="number"
                    value={item.amount}
                    onChange={e => setScannedItems(prev =>
                      prev.map((it, i) => i === index ? { ...it, amount: Number(e.target.value) } : it)
                    )}
                    className="w-24 bg-transparent text-sm text-right outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="p-4 border-t flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowScanModal(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={confirmScannedItems}
                disabled={!scannedItems.some(i => i.selected)}
              >
                Agregar seleccionados
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateAccount;