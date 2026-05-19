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
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Tag } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function formatCurrency(n) {
  return new Intl.NumberFormat("es", { style: "currency", currency: "USD" }).format(n || 0);
}

const COLORS = ["#4f86f7", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#f97316", "#06b6d4", "#ec4899"];

function CategoryForm({ open, onClose, onSubmit, editing }) {
  const [form, setForm] = useState(editing || { name: "", type: "ingreso", description: "", color: COLORS[0] });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar" : "Nueva"} Categoría</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Ventas directas" required />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ingreso">Ingreso</SelectItem>
                <SelectItem value="gasto">Gasto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Descripción (opcional)</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Breve descripción" />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? "scale-125 ring-2 ring-offset-1 ring-primary" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{editing ? "Actualizar" : "Crear"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoryCard({ category, incomes, expenses, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const isIncome = category.type === "ingreso";
  const items = isIncome
    ? incomes.filter((i) => i.category === category.name)
    : expenses.filter((e) => e.category === category.name);
  const total = items.reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <Card className="overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: category.color + "22" }}>
              <Tag className="w-5 h-5" style={{ color: category.color }} />
            </div>
            <div>
              <h3 className="font-semibold">{category.name}</h3>
              {category.description && <p className="text-xs text-muted-foreground mt-0.5">{category.description}</p>}
              <Badge className="mt-1 text-xs" style={{ backgroundColor: category.color + "22", color: category.color, border: "none" }}>
                {isIncome ? "Ingreso" : "Gasto"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right mr-2">
              <p className="text-xs text-muted-foreground">{items.length} registros</p>
              <p className="font-bold text-lg" style={{ color: category.color }}>{formatCurrency(total)}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onEdit(category)}><Pencil className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(category.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
          </div>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" className="mt-3 w-full text-xs text-muted-foreground" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Ocultar detalle" : `Ver ${items.length} registros`}
          </Button>
        )}
      </div>
      {expanded && items.length > 0 && (
        <div className="border-t divide-y">
          {items.map((item) => (
            <div key={item.id} className="px-5 py-3 flex justify-between items-center hover:bg-muted/20">
              <div>
                <p className="text-sm font-medium">{item.description}</p>
                <p className="text-xs text-muted-foreground">
                  {item.date ? format(new Date(item.date), "dd MMM yyyy", { locale: es }) : "—"}
                </p>
              </div>
              <span className={`font-semibold text-sm ${isIncome ? "text-emerald-600" : "text-red-500"}`}>
                {isIncome ? "+" : "-"}{formatCurrency(item.amount)}
              </span>
            </div>
          ))}
          <div className="px-5 py-3 flex justify-between items-center bg-muted/30">
            <span className="text-sm font-semibold">Total</span>
            <span className="font-bold" style={{ color: category.color }}>{formatCurrency(total)}</span>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function Categories() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => base44.entities.Category.list() });
  const { data: incomes = [] } = useQuery({ queryKey: ["incomes"], queryFn: () => base44.entities.Income.list() });
  const { data: expenses = [] } = useQuery({ queryKey: ["expenses"], queryFn: () => base44.entities.Expense.list() });

  const createMut = useMutation({ mutationFn: (d) => base44.entities.Category.create(d), onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }) });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => base44.entities.Category.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }) });
  const deleteMut = useMutation({ mutationFn: (id) => base44.entities.Category.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }) });

  const handleSubmit = (data) => {
    editing ? updateMut.mutate({ id: editing.id, data }) : createMut.mutate(data);
    setEditing(null);
  };

  const incomeCategories = categories.filter((c) => c.type === "ingreso");
  const expenseCategories = categories.filter((c) => c.type === "gasto");

  const totalIncomeByCategories = incomeCategories.reduce((s, c) => s + incomes.filter(i => i.category === c.name).reduce((a, b) => a + (b.amount || 0), 0), 0);
  const totalExpenseByCategories = expenseCategories.reduce((s, c) => s + expenses.filter(e => e.category === c.name).reduce((a, b) => a + (b.amount || 0), 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Categorías</h1>
          <p className="text-muted-foreground mt-1">Organiza y visualiza tus ingresos y gastos por categoría</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nueva Categoría
        </Button>
      </div>

      <Tabs defaultValue="incomes">
        <TabsList className="mb-4">
          <TabsTrigger value="incomes" className="gap-2">
            <TrendingUp className="w-4 h-4" /> Ingresos ({incomeCategories.length})
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2">
            <TrendingDown className="w-4 h-4" /> Gastos ({expenseCategories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incomes" className="space-y-4">
          {incomeCategories.length > 0 && (
            <div className="flex justify-end">
              <div className="bg-emerald-50 px-4 py-2 rounded-xl text-sm font-semibold text-emerald-700">
                Total categorías ingresos: {formatCurrency(totalIncomeByCategories)}
              </div>
            </div>
          )}
          {incomeCategories.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">No hay categorías de ingreso creadas</Card>
          ) : (
            incomeCategories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} incomes={incomes} expenses={expenses}
                onEdit={(c) => { setEditing(c); setFormOpen(true); }}
                onDelete={(id) => deleteMut.mutate(id)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          {expenseCategories.length > 0 && (
            <div className="flex justify-end">
              <div className="bg-red-50 px-4 py-2 rounded-xl text-sm font-semibold text-red-600">
                Total categorías gastos: {formatCurrency(totalExpenseByCategories)}
              </div>
            </div>
          )}
          {expenseCategories.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">No hay categorías de gasto creadas</Card>
          ) : (
            expenseCategories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} incomes={incomes} expenses={expenses}
                onEdit={(c) => { setEditing(c); setFormOpen(true); }}
                onDelete={(id) => deleteMut.mutate(id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <CategoryForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} onSubmit={handleSubmit} editing={editing} />
    </div>
  );
}