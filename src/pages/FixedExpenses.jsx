import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPaidToday, addPaidToday } from "@/lib/paidToday";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Building2, Calendar, LayoutGrid, CheckCircle, Tag } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function formatCurrency(n) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n || 0);
}

const freqLabels = { mensual: "Mensual", bimestral: "Bimestral", trimestral: "Trimestral", semestral: "Semestral", anual: "Anual", unico: "Único" };
const statusColors = { activo: "bg-emerald-100 text-emerald-700", pausado: "bg-yellow-100 text-yellow-700", cancelado: "bg-gray-100 text-gray-500" };

// ── Category Management Dialog ───────────────────────────────────────────────
function CategoryManager({ open, onClose }) {
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const { data: cats = [] } = useQuery({ queryKey: ["fixedExpCats"], queryFn: () => base44.entities.FixedExpenseCategory.list() });
  const createCat = useMutation({ mutationFn: (d) => base44.entities.FixedExpenseCategory.create(d), onSuccess: () => qc.invalidateQueries({ queryKey: ["fixedExpCats"] }) });
  const deleteCat = useMutation({ mutationFn: (id) => base44.entities.FixedExpenseCategory.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["fixedExpCats"] }) });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Categorías de Gastos Fijos</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="flex gap-2">
            <Input placeholder="Nueva categoría..." value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) { createCat.mutate({ name: newName.trim() }); setNewName(""); } }} />
            <Button onClick={() => { if (newName.trim()) { createCat.mutate({ name: newName.trim() }); setNewName(""); } }}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {cats.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin categorías creadas</p>}
            {cats.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">{c.name}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => deleteCat.mutate(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Pay Dialog ───────────────────────────────────────────────────────────────
function PayDialog({ open, onClose, item, onConfirmPay }) {
  const [paidAmount, setPaidAmount] = useState(item?.amount || "");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Registrar Pago — {item?.description}</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="p-3 rounded-xl bg-muted/30 text-sm flex justify-between">
            <span className="text-muted-foreground">Monto programado</span>
            <span className="font-bold">{formatCurrency(item?.amount)}</span>
          </div>
          <div className="space-y-2">
            <Label>Monto pagado</Label>
            <Input type="number" step="0.01" min="0" value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)} placeholder="Puede ser menor al programado" />
            {parseFloat(paidAmount) < (item?.amount || 0) && paidAmount !== "" && (
              <p className="text-xs text-amber-600">Pago parcial: diferencia de {formatCurrency((item?.amount || 0) - parseFloat(paidAmount))}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Fecha de pago</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => { onConfirmPay(item, parseFloat(paidAmount), date); onClose(); }}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2" disabled={!paidAmount || parseFloat(paidAmount) <= 0}>
              <CheckCircle className="w-4 h-4" /> Confirmar Pago
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Fixed Expense Form ───────────────────────────────────────────────────────
function FixedExpenseForm({ open, onClose, onSubmit, editing, categories }) {
  const init = editing || { description: "", company: "", amount: "", due_date: "", category: "", frequency: "mensual", status: "activo" };
  const [form, setForm] = useState(init);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, amount: parseFloat(form.amount) });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{editing ? "Editar" : "Nuevo"} Gasto Fijo</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ej: Préstamo banco" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Empresa / Proveedor</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Ej: Banco XYZ" required />
            </div>
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
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
            <Label>Categoría</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                {categories.length === 0 && <SelectItem value="Sin categoría">Sin categoría</SelectItem>}
              </SelectContent>
            </Select>
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

// ── Item Row ─────────────────────────────────────────────────────────────────
function FixedExpenseRow({ item, payments, onEdit, onDelete, onPay, paidToday = [] }) {
  const itemPayments = payments.filter((p) => p.fixed_expense_id === item.id);
  const totalPaid = itemPayments.reduce((s, p) => s + (p.paid_amount || 0), 0);
  const lastPayment = itemPayments.sort((a, b) => b.payment_date?.localeCompare(a.payment_date))[0];
  const alreadyPaid = paidToday.includes(item.id);

  return (
    <div className="p-5 flex items-start justify-between gap-4 hover:bg-muted/20 transition-colors">
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
            {item.category && <Badge variant="outline" className="text-xs">{item.category}</Badge>}
          </div>
          {lastPayment && (
            <p className="text-xs text-emerald-600">
              Último pago: {formatCurrency(lastPayment.paid_amount)} el {format(new Date(lastPayment.payment_date), "dd MMM yyyy", { locale: es })}
            </p>
          )}
          {totalPaid > 0 && (
            <p className="text-xs text-muted-foreground">Total pagado: {formatCurrency(totalPaid)}</p>
          )}
          {item.created_by && (
            <p className="text-[10px] text-muted-foreground/70">Registrado por: {item.created_by.split("@")[0]}</p>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-lg font-bold text-primary">{formatCurrency(item.amount)}</p>
        <div className="flex gap-1 mt-1 justify-end flex-wrap">
          <Button size="sm"
            onClick={alreadyPaid ? undefined : () => onPay(item)}
            disabled={alreadyPaid}
            className={`h-7 px-2 text-xs gap-1 ${alreadyPaid ? "bg-red-500 hover:bg-red-500 cursor-not-allowed opacity-80" : "bg-emerald-600 hover:bg-emerald-700"}`}>
            <CheckCircle className="w-3.5 h-3.5" /> {alreadyPaid ? "Pagado" : "Pagar"}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}><Pencil className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FixedExpenses() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [catManagerOpen, setCatManagerOpen] = useState(false);
  const [payItem, setPayItem] = useState(null);
  const [view, setView] = useState("list");
  const [paidToday, setPaidToday] = useState(() => getPaidToday("gastos_fijos"));
  const qc = useQueryClient();

  const { data: fixedExpenses = [] } = useQuery({ queryKey: ["fixedExpenses"], queryFn: () => base44.entities.FixedExpense.list("-created_date") });
  const { data: categories = [] } = useQuery({ queryKey: ["fixedExpCats"], queryFn: () => base44.entities.FixedExpenseCategory.list() });
  const { data: payments = [] } = useQuery({ queryKey: ["fixedExpPayments"], queryFn: () => base44.entities.FixedExpensePayment.list("-created_date") });

  const createMut = useMutation({ mutationFn: (d) => base44.entities.FixedExpense.create(d), onSuccess: () => qc.invalidateQueries({ queryKey: ["fixedExpenses"] }) });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => base44.entities.FixedExpense.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["fixedExpenses"] }) });
  const deleteMut = useMutation({ mutationFn: (id) => base44.entities.FixedExpense.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["fixedExpenses"] }) });
  const createPayment = useMutation({
    mutationFn: (d) => base44.entities.FixedExpensePayment.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fixedExpPayments"] });
      qc.invalidateQueries({ queryKey: ["expenses"] });
    }
  });
  const createExpense = useMutation({ mutationFn: (d) => base44.entities.Expense.create(d), onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }) });

  const handleSubmit = (data) => {
    editing ? updateMut.mutate({ id: editing.id, data }) : createMut.mutate(data);
    setEditing(null);
  };

  const handleConfirmPay = async (item, paidAmount, date) => {
    createPayment.mutate({
      fixed_expense_id: item.id,
      fixed_expense_description: item.description,
      scheduled_amount: item.amount,
      paid_amount: paidAmount,
      payment_date: date,
    });
    createExpense.mutate({
      description: `Gasto fijo — ${item.description} (${item.company})`,
      amount: paidAmount,
      date: date,
      category: item.category || "Gastos Fijos",
    });
    addPaidToday("gastos_fijos", item.id);
    setPaidToday(getPaidToday("gastos_fijos"));
  };

  const activeItems = fixedExpenses.filter((f) => f.status === "activo");
  const totalActive = activeItems.reduce((s, f) => s + (f.amount || 0), 0);

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
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setCatManagerOpen(true)} className="gap-2">
            <Tag className="w-4 h-4" /> Categorías
          </Button>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Agregar Gasto Fijo
          </Button>
        </div>
      </div>

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
          <p className="text-sm text-muted-foreground">Total pagado</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">
            {formatCurrency(payments.reduce((s, p) => s + (p.paid_amount || 0), 0))}
          </p>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <Button variant={view === "list" ? "default" : "outline"} size="sm" onClick={() => setView("list")}>Lista</Button>
        <Button variant={view === "category" ? "default" : "outline"} size="sm" onClick={() => setView("category")}>
          <LayoutGrid className="w-4 h-4 mr-1" /> Por categoría
        </Button>
      </div>

      {view === "list" && (
        <div className="bg-card rounded-2xl border overflow-hidden">
          {fixedExpenses.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No hay gastos fijos registrados</div>
          ) : (
            <div className="divide-y">
              {fixedExpenses.map((item) => (
                <FixedExpenseRow key={item.id} item={item} payments={payments}
                  onEdit={(i) => { setEditing(i); setFormOpen(true); }}
                  onDelete={(id) => deleteMut.mutate(id)}
                  onPay={(i) => setPayItem(i)}
                  paidToday={paidToday} />
              ))}
              <div className="px-5 py-4 flex justify-between items-center bg-primary/5">
                <span className="font-semibold">Total General</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(fixedExpenses.reduce((s, f) => s + (f.amount || 0), 0))}</span>
              </div>
            </div>
          )}
        </div>
      )}

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
                      <FixedExpenseRow key={item.id} item={item} payments={payments}
                        onEdit={(i) => { setEditing(i); setFormOpen(true); }}
                        onDelete={(id) => deleteMut.mutate(id)}
                        onPay={(i) => setPayItem(i)}
                        paidToday={paidToday} />
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

      <FixedExpenseForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} onSubmit={handleSubmit} editing={editing} categories={categories} />
      <CategoryManager open={catManagerOpen} onClose={() => setCatManagerOpen(false)} />
      {payItem && (
        <PayDialog open={!!payItem} onClose={() => setPayItem(null)} item={payItem} onConfirmPay={handleConfirmPay} />
      )}
    </div>
  );
}