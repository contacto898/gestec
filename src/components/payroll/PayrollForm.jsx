import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const INITIAL = { name: "", position: "", salary: "", payment_type: "mensual", payment_date: "", hire_date: "", status: "activo", has_vacations: true, vacation_paid_date: "" };

export default function PayrollForm({ open, onClose, onSubmit, editingWorker }) {
  const [form, setForm] = useState(editingWorker || INITIAL);

  useEffect(() => {
    if (open) {
      setForm(editingWorker ? { has_vacations: true, ...editingWorker } : INITIAL);
    }
  }, [open, editingWorker]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, salary: parseFloat(form.salary) });
    setForm(INITIAL);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingWorker ? "Editar Trabajador" : "Nuevo Trabajador"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Nombre completo</Label>
            <Input placeholder="Ej: Juan Pérez" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Cargo</Label>
            <Input placeholder="Ej: Analista" value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Salario (S/)</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Tipo de pago</Label>
              <Select value={form.payment_type} onValueChange={(v) => setForm({ ...form, payment_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensual">Mensual</SelectItem>
                  <SelectItem value="quincenal">Quincenal</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de contrato</Label>
              <Input type="date" value={form.hire_date}
                onChange={(e) => setForm({ ...form, hire_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Fecha de pago</Label>
              <Input type="date" value={form.payment_date}
                onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
            </div>
          </div>

          {/* Toggle vacaciones */}
          <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30">
            <button
              type="button"
              onClick={() => setForm({ ...form, has_vacations: !form.has_vacations })}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${form.has_vacations ? "bg-emerald-500" : "bg-gray-300"}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.has_vacations ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-medium">¿Tiene beneficio de vacaciones?</p>
              <p className="text-xs text-muted-foreground">Si está activo, el sistema mostrará el botón de vacaciones</p>
            </div>
          </div>

          {form.has_vacations && (
            <div className="space-y-2">
              <Label>Última fecha de vacaciones (opcional)</Label>
              <Input type="date" value={form.vacation_paid_date || ""}
                onChange={(e) => setForm({ ...form, vacation_paid_date: e.target.value })} />
              <p className="text-xs text-muted-foreground">Si ya tomó vacaciones antes, ingresa la fecha para evitar alertas prematuras.</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{editingWorker ? "Actualizar" : "Agregar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}