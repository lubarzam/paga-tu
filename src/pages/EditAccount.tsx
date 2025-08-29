import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, X, Save, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { accountService } from "@/services/accountService";
import { toast } from "@/hooks/use-toast";

const EditAccount = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [account, setAccount] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    items: [],
    participants: [],
    tipIncluded: false,
    tipAmount: 0,
  });

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
      
      setFormData({
        name: data.name,
        description: data.description || "",
        items: data.account_items || [],
        participants: data.account_participants || [],
        tipIncluded: data.tip_included,
        tipAmount: data.tip_amount || 0,
      });
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

  const handleSave = async () => {
    try {
      setSaving(true);
      await accountService.updateAccount(id, formData);
      toast({
        title: "Éxito",
        description: "Cuenta actualizada correctamente",
      });
      navigate(`/account/${id}`);
    } catch (error) {
      console.error('Error updating account:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la cuenta",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: "", amount: 0, participants: [] }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addParticipant = () => {
    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, { email: "", name: "" }]
    }));
  };

  const removeParticipant = (index) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index)
    }));
  };

  const updateParticipant = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.map((participant, i) => 
        i === index ? { ...participant, [field]: value } : participant
      )
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Check if user is owner
  if (account?.owner_id !== user?.id) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No tienes permisos para editar esta cuenta</p>
        <Button onClick={() => navigate(`/account/${id}`)} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/account/${id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Editar Cuenta</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre de la cuenta</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Cena en restaurante"
            />
          </div>
          <div>
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detalles adicionales sobre la cuenta"
            />
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Artículos consumidos</CardTitle>
            <Button onClick={addItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar artículo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.items.map((item, index) => (
            <div key={index} className="flex gap-4 items-end">
              <div className="flex-1">
                <Label>Nombre del artículo</Label>
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(index, 'name', e.target.value)}
                  placeholder="Ej: Pizza Margherita"
                />
              </div>
              <div className="w-32">
                <Label>Precio</Label>
                <Input
                  type="number"
                  value={item.amount}
                  onChange={(e) => updateItem(index, 'amount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {formData.items.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No hay artículos. Agrega el primer artículo.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Participants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Participantes</CardTitle>
            <Button onClick={addParticipant} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar participante
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.participants.map((participant, index) => (
            <div key={index} className="flex gap-4 items-end">
              <div className="flex-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={participant.email}
                  onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="flex-1">
                <Label>Nombre (opcional)</Label>
                <Input
                  value={participant.name || ''}
                  onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                  placeholder="Nombre completo"
                />
              </div>
              <div className="flex items-center gap-2">
                {participant.is_registered && (
                  <Badge variant="secondary">Registrado</Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeParticipant(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {formData.participants.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No hay participantes. Agrega el primer participante.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tip */}
      <Card>
        <CardHeader>
          <CardTitle>Propina</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={formData.tipAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, tipAmount: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">
              Se distribuirá proporcionalmente entre los participantes
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditAccount;