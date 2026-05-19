import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const INCOME_CATEGORIES = [
  { value: "ventas", label: "Ventas" },
  { value: "servicios", label: "Servicios" },
  { value: "inversiones", label: "Inversiones" },
  { value: "prestamos", label: "Préstamos" },
  { value: "otros", label: "Otros" },
];

const EXPENSE_CATEGORIES = [
  { value: "planilla", label: "Planilla" },
  { value: "alquiler", label: "Alquiler" },
  { value: "servicios", label: "Servicios" },
  { value: "materiales", label: "Materiales" },
  { value: "transporte", label: "Transporte" },
  { value: "impuestos", label: "Impuestos" },
  { value: "otros", label: "Otros" },
];

export default function FinanceForm({ open, onClose, onSubmit, type, editing }) {
  const [form, setForm] = useState(editing || { description: "", amount: "", date: "", category: type === "income" ? "ventas" : "planilla" });
  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

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
            <Input
              placeholder="Ej: Pago de cliente"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
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