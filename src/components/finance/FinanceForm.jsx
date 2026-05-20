import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Fallback categories if none created
const FALLBACK_INCOME = [{ name: "Ventas" }, { name: "Servicios" }, { name: "Inversiones" }, { name: "Préstamos" }, { name: "Otros" }];
const FALLBACK_EXPENSE = [{ name: "Planilla" }, { name: "Alquiler" }, { name: "Servicios" }, { name: "Materiales" }, { name: "Transporte" }, { name: "Impuestos" }, { name: "Otros" }];

function getTodayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function FinanceForm({ open, onClose, onSubmit, type, editing }) {
  const today = getTodayLocal();
  const [form, setForm] = useState(editing || { description: "", amount: "", date: today, category: "", payment_method: "efectivo" });

  // Reload form data when editing item changes
  useEffect(() => {
    if (open) {
      setForm(editing || { description: "", amount: "", date: today, category: "", payment_method: "efectivo" });
    }
  }, [open, editing]);

  const { data: allCategories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => base44.entities.Category.list(),
  });

  const filteredCats = allCategories.filter((c) => c.type === (type === "income" ? "ingreso" : "gasto"));
  const categories = filteredCats.length > 0
    ? filteredCats.map((c) => ({ value: c.name, label: c.name }))
    : (type === "income" ? FALLBACK_INCOME : FALLBACK_EXPENSE).map((c) => ({ value: c.name, label: c.name }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, amount: parseFloat(form.amount) });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar" : "Nuevo"} {type === "income" ? "Ingreso" : "Gasto"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input placeholder="Ej: Pago de cliente" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {type === "expense" && (
            <div className="space-y-2">
              <Label>Tipo de pago</Label>
              <Select value={form.payment_method || "efectivo"} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                <SelectTrigger><SelectValue placeholder="Tipo de pago" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">💵 Efectivo</SelectItem>
                  <SelectItem value="transferencia">🏦 Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{editing ? "Actualizar" : "Agregar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}