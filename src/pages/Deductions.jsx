import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, User, Calendar, CreditCard, Minus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function formatCurrency(n) {
  return new Intl.NumberFormat("es", { style: "currency", currency: "USD" }).format(n || 0);
}

const freqLabels = { semanal: "Semanal", quincenal: "Quincenal", mensual: "Mensual" };
const statusColors = {
  pendiente: "bg-yellow-100 text-yellow-700",
  en_proceso: "bg-blue-100 text-blue-700",
  completado: "bg-emerald-100 text-emerald-700",
};
const statusLabels = { pendiente: "Pendiente", en_proceso: "En proceso", completado: "Completado" };

function DeductionForm({ open, onClose, onSubmit, editing, workers, type }) {
  const init = editing || {
    type, worker_name: "", worker_id: "", concept: "", total_amount: "",
    installments: "1", frequency: "mensual", start_date: "", status: "pendiente", paid_installments: 0
  };
  const [form, setForm] = useState(init);

  const handleWorker = (id) => {
    const w = workers.find((w) => w.id === id);
    setForm({ ...form, worker_id: id, worker_name: w ? w.name : "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, total_amount: parseFloat(form.total_amount), installments: parseInt(form.installments) });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar" : "Nuevo"} {type === "descuento" ? "Descuento" : "Adelanto"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Trabajador</Label>
            {workers.length > 0 ? (
              <Select value={form.worker_id} onValueChange={handleWorker}>
                <SelectTrigger><SelectValue placeholder="Seleccionar trabajador" /></SelectTrigger>
                <SelectContent>
                  {workers.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input value={form.worker_name} onChange={(e) => setForm({ ...form, worker_name: e.target.value })}
                placeholder="Nombre del trabajador" required />
            )}
          </div>
          <div className="space-y-2">
            <Label>Concepto</Label>
            <Input value={form.concept} onChange={(e) => setForm({ ...form, concept: e.target.value })}
              placeholder={type === "descuento" ? "Ej: Falta injustificada" : "Ej: Adelanto de quincena"} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monto total</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00"
                value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>N° de cuotas</Label>
              <Input type="number" min="1" placeholder="1"
                value={form.installments} onChange={(e) => setForm({ ...form, installments: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frecuencia</Label>
              <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="quincenal">Quincenal</SelectItem>
                  <SelectItem value="mensual">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha inicio</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
            </div>
          </div>
          {editing && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cuotas pagadas</Label>
                <Input type="number" min="0" value={form.paid_installments}
                  onChange={(e) => setForm({ ...form, paid_installments: parseInt(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_proceso">En proceso</SelectItem>
                    <SelectItem value="completado">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{editing ? "Actualizar" : "Registrar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeductionCard({ item, onEdit, onDelete }) {
  const installmentAmount = item.total_amount / item.installments;
  const progress = item.paid_installments / item.installments;
  const isDescuento = item.type === "descuento";

  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDescuento ? "bg-red-100" : "bg-amber-100"}`}>
            {isDescuento ? <Minus className="w-5 h-5 text-red-600" /> : <CreditCard className="w-5 h-5 text-amber-600" />}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{item.concept}</span>
              <Badge className={statusColors[item.status]}>{statusLabels[item.status]}</Badge>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <User className="w-3.5 h-3.5" />
              <span>{item.worker_name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {item.start_date ? format(new Date(item.start_date), "dd MMM yyyy", { locale: es }) : "—"}
                {" · "}{freqLabels[item.frequency]}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatCurrency(installmentAmount)} / cuota · {item.paid_installments}/{item.installments} cuotas pagadas
            </div>
            <div className="w-48 h-1.5 bg-muted rounded-full mt-1">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(progress * 100, 100)}%` }} />
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-lg font-bold ${isDescuento ? "text-red-600" : "text-amber-600"}`}>
            {formatCurrency(item.total_amount)}
          </p>
          <p className="text-xs text-muted-foreground">Total</p>
          <div className="flex gap-1 mt-2 justify-end">
            <Button variant="ghost" size="icon" onClick={() => onEdit(item)}><Pencil className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Deductions() {
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState("descuento");
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();

  const { data: deductions = [] } = useQuery({ queryKey: ["deductions"], queryFn: () => base44.entities.Deduction.list("-created_date") });
  const { data: workers = [] } = useQuery({ queryKey: ["workers"], queryFn: () => base44.entities.Worker.list() });

  const createMut = useMutation({ mutationFn: (d) => base44.entities.Deduction.create(d), onSuccess: () => qc.invalidateQueries({ queryKey: ["deductions"] }) });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => base44.entities.Deduction.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["deductions"] }) });
  const deleteMut = useMutation({ mutationFn: (id) => base44.entities.Deduction.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["deductions"] }) });

  const handleSubmit = (data) => {
    editing ? updateMut.mutate({ id: editing.id, data }) : createMut.mutate(data);
    setEditing(null);
  };

  const openForm = (type) => { setFormType(type); setEditing(null); setFormOpen(true); };
  const handleEdit = (item) => { setFormType(item.type); setEditing(item); setFormOpen(true); };

  const descuentos = deductions.filter((d) => d.type === "descuento");
  const adelantos = deductions.filter((d) => d.type === "adelanto");

  const totalDescuentos = descuentos.reduce((s, d) => s + (d.total_amount || 0), 0);
  const totalAdelantos = adelantos.reduce((s, d) => s + (d.total_amount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Descuentos y Adelantos</h1>
          <p className="text-muted-foreground mt-1">Gestiona descuentos y adelantos a trabajadores</p>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={() => openForm("descuento")} className="gap-2">
            <Plus className="w-4 h-4" /> Descuento
          </Button>
          <Button onClick={() => openForm("adelanto")} className="gap-2 bg-amber-500 hover:bg-amber-600">
            <Plus className="w-4 h-4" /> Adelanto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 flex items-center gap-4 bg-red-50 border-red-100">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
            <Minus className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-red-600 font-medium">Total Descuentos</p>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(totalDescuentos)}</p>
            <p className="text-xs text-red-500">{descuentos.length} registros</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 bg-amber-50 border-amber-100">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-amber-600 font-medium">Total Adelantos</p>
            <p className="text-2xl font-bold text-amber-700">{formatCurrency(totalAdelantos)}</p>
            <p className="text-xs text-amber-500">{adelantos.length} registros</p>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="descuentos">
        <TabsList className="mb-4">
          <TabsTrigger value="descuentos">Descuentos ({descuentos.length})</TabsTrigger>
          <TabsTrigger value="adelantos">Adelantos ({adelantos.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="descuentos" className="space-y-3">
          {descuentos.length === 0
            ? <Card className="p-12 text-center text-muted-foreground">No hay descuentos registrados</Card>
            : descuentos.map((d) => <DeductionCard key={d.id} item={d} onEdit={handleEdit} onDelete={(id) => deleteMut.mutate(id)} />)}
        </TabsContent>
        <TabsContent value="adelantos" className="space-y-3">
          {adelantos.length === 0
            ? <Card className="p-12 text-center text-muted-foreground">No hay adelantos registrados</Card>
            : adelantos.map((d) => <DeductionCard key={d.id} item={d} onEdit={handleEdit} onDelete={(id) => deleteMut.mutate(id)} />)}
        </TabsContent>
      </Tabs>

      <DeductionForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={handleSubmit} editing={editing} workers={workers} type={formType} />
    </div>
  );
}