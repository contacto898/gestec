import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MobileSelect from "@/components/ui/MobileSelect";
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

function CategoryCombobox({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
            !value && "text-muted-foreground"
          )}
        >
          {selected ? selected.label : "Selecciona categoría"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start" style={{ width: "var(--radix-popover-trigger-width)" }}>
        <Command>
          <CommandInput placeholder="Buscar categoría..." />
          <CommandList>
            <CommandEmpty>No se encontró.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  onSelect={(val) => { onChange(val); setOpen(false); }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === opt.value ? "opacity-100" : "opacity-0")} />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
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
            <CategoryCombobox
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v })}
              options={categories}
            />
          </div>
          {type === "expense" && (
            <div className="space-y-2">
              <Label>Tipo de pago</Label>
              <MobileSelect
                value={form.payment_method || "efectivo"}
                onValueChange={(v) => setForm({ ...form, payment_method: v })}
                options={[{ value: "efectivo", label: "💵 Efectivo" }, { value: "transferencia", label: "🏦 Transferencia" }]}
                label="Tipo de pago"
              />
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