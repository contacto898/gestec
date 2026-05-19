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
import { Plus, Pencil, Trash2, Building2, Calendar, LayoutGrid } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function formatCurrency(n) {
  return new Intl.NumberFormat("es", { style: "currency", currency: "USD" }).format(n || 0);
}

const freqLabels = { mensual: "Mensual", bimestral: "Bimestral", trimestral: "Trimestral", semestral: "Semestral", anual: "Anual", unico: "Único" };
const statusColors = { activo: "bg-emerald-100 text-emerald-700", pausado: "bg-yellow-100 text-yellow-700", cancelado: "bg-gray-100 text-gray-500" };

const DEFAULT_CATEGORIES = ["Préstamo", "Recibo de luz", "Recibo de agua", "Internet", "Seguro", "Alquiler", "Teléfono", "Otro"];

function FixedExpenseForm({ open, onClose, onSubmit, editing }) {
  const init = editing || { description: "", company: "", amount: "", due_date: "", category: "Préstamo", frequency: "mensual", status: "activo" };
  const [form, setForm] = useState(init);
  const [customCat, setCustomCat] = useState(!DEFAULT_CATEGORIES.includes(editing?.category || "Préstamo"));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, amount: parseFloat(form.amount) });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar" : "Nuevo"} Gasto Fijo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ej: Préstamo banco" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Empresa / Proveedor</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Ej: Banco XYZ" required />
            </div>
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00"
                value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de pago / vencimiento</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Frecuencia</Label>
              <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(freqLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Categoría</Label>
              <Button type="button" variant="ghost" size="sm" className="text-xs h-auto py-0.5"
                onClick={() => setCustomCat(!customCat)}>
                {customCat ? "Usar lista" : "Escribir manualmente"}
              </Button>
            </div>
            {customCat ? (
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Escribe la categoría" />
            ) : (
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEFAULT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="pausado">Pausado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{editing ? "Actualizar" : "Agregar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function FixedExpenses() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState("list"); // "list" | "category"
  const qc = useQueryClient();

  const { data: fixedExpenses = [] } = useQuery({ queryKey: ["fixedExpenses"], queryFn: () => base44.entities.FixedExpense.list("-created_date") });

  const createMut = useMutation({ mutationFn: (d) => base44.entities.FixedExpense.create(d), onSuccess: () => qc.invalidateQueries({ queryKey: ["fixedExpenses"] }) });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => base44.entities.FixedExpense.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["fixedExpenses"] }) });
  const deleteMut = useMutation({ mutationFn: (id) => base44.entities.FixedExpense.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["fixedExpenses"] }) });

  const handleSubmit = (data) => {
    editing ? updateMut.mutate({ id: editing.id, data }) : createMut.mutate(data);
    setEditing(null);
  };

  const activeItems = fixedExpenses.filter((f) => f.status === "activo");
  const totalActive = activeItems.reduce((s, f) => s + (f.amount || 0), 0);

  // Group by category
  const byCategory = fixedExpenses.reduce((acc, item) => {
    const cat = item.category || "Sin categoría";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Gastos Fijos</h1>
          <p className="text-muted-foreground mt-1">Préstamos, recibos y compromisos fijos mensuales</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Agregar Gasto Fijo
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-primary/5 border-primary/20">
          <p className="text-sm text-muted-foreground">Total mensual activo</p>
          <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(totalActive)}</p>
          <p className="text-xs text-muted-foreground">{activeItems.length} gastos activos</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Total registros</p>
          <p className="text-2xl font-bold mt-1">{fixedExpenses.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Categorías</p>
          <p className="text-2xl font-bold mt-1">{Object.keys(byCategory).length}</p>
        </Card>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-2">
        <Button variant={view === "list" ? "default" : "outline"} size="sm" onClick={() => setView("list")}>Lista</Button>
        <Button variant={view === "category" ? "default" : "outline"} size="sm" onClick={() => setView("category")}>
          <LayoutGrid className="w-4 h-4 mr-1" /> Por categoría
        </Button>
      </div>

      {/* List view */}
      {view === "list" && (
        <div className="bg-card rounded-2xl border overflow-hidden">
          {fixedExpenses.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No hay gastos fijos registrados</div>
          ) : (
            <div className="divide-y">
              {fixedExpenses.map((item) => (
                <div key={item.id} className="p-5 flex items-start justify-between gap-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{item.description}</span>
                        <Badge className={statusColors[item.status]}>{item.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.company}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {item.due_date ? format(new Date(item.due_date), "dd MMM yyyy", { locale: es }) : "—"}
                        </span>
                        <Badge variant="secondary" className="text-xs">{freqLabels[item.frequency]}</Badge>
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-primary">{formatCurrency(item.amount)}</p>
                    <div className="flex gap-1 mt-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setFormOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(item.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="px-5 py-4 flex justify-between items-center bg-primary/5">
                <span className="font-semibold">Total General</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(fixedExpenses.reduce((s, f) => s + (f.amount || 0), 0))}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category view */}
      {view === "category" && (
        <div className="space-y-4">
          {Object.keys(byCategory).length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">No hay gastos fijos registrados</Card>
          ) : (
            Object.entries(byCategory).map(([cat, items]) => {
              const catTotal = items.reduce((s, i) => s + (i.amount || 0), 0);
              return (
                <Card key={cat} className="overflow-hidden">
                  <div className="px-5 py-4 flex justify-between items-center bg-muted/30 border-b">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-primary" />
                      <span className="font-semibold">{cat}</span>
                      <Badge variant="secondary">{items.length} ítem{items.length !== 1 ? "s" : ""}</Badge>
                    </div>
                    <span className="font-bold text-primary">{formatCurrency(catTotal)}</span>
                  </div>
                  <div className="divide-y">
                    {items.map((item) => (
                      <div key={item.id} className="px-5 py-3 flex justify-between items-center hover:bg-muted/20">
                        <div>
                          <p className="text-sm font-medium">{item.description}</p>
                          <p className="text-xs text-muted-foreground">{item.company} · {freqLabels[item.frequency]}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-sm text-primary">{formatCurrency(item.amount)}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(item); setFormOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMut.mutate(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })
          )}
          {Object.keys(byCategory).length > 0 && (
            <Card className="p-4 flex justify-between items-center bg-primary/5">
              <span className="font-semibold">Total General</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(fixedExpenses.reduce((s, f) => s + (f.amount || 0), 0))}</span>
            </Card>
          )}
        </div>
      )}

      <FixedExpenseForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} onSubmit={handleSubmit} editing={editing} />
    </div>
  );
}