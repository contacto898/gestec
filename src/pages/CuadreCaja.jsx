import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calculator, Save, AlertTriangle, CheckCircle2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function formatCurrency(n) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n || 0);
}

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseLocalDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function CuadreCaja() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [newConcept, setNewConcept] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["cashRegister"],
    queryFn: () => base44.entities.CashRegister.list("order", 100),
  });

  // Balance total from incomes - expenses
  const { data: incomes = [] } = useQuery({
    queryKey: ["incomes"],
    queryFn: () => base44.entities.Income.list("-created_date", 500),
  });
  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list("-created_date", 500),
  });

  const balanceTotal = incomes.reduce((s, i) => s + (i.amount || 0), 0) -
    expenses.reduce((s, e) => s + (e.amount || 0), 0);

  const createItem = useMutation({
    mutationFn: (data) => base44.entities.CashRegister.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cashRegister"] }); setNewConcept(""); setShowAddForm(false); },
  });

  const updateItem = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CashRegister.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cashRegister"] }),
  });

  const deleteItem = useMutation({
    mutationFn: (id) => base44.entities.CashRegister.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cashRegister"] }),
  });

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditAmount(item.amount != null ? String(item.amount) : "");
  };

  const handleSaveAmount = (item) => {
    const val = parseFloat(editAmount);
    updateItem.mutate({ id: item.id, data: { ...item, amount: isNaN(val) ? 0 : val } });
    setEditingId(null);
  };

  const handleCuadre = () => {
    const today = getTodayStr();
    // Update last_updated on all items to mark the cuadre date
    items.forEach((item) => {
      updateItem.mutate({ id: item.id, data: { ...item, last_updated: today } });
    });
  };

  const handleAddConcept = () => {
    if (!newConcept.trim()) return;
    createItem.mutate({ concept: newConcept.trim(), amount: 0, order: items.length + 1 });
  };

  const totalCuadre = items.reduce((s, i) => s + (i.amount || 0), 0);
  const faltante = balanceTotal - totalCuadre;

  // Last cuadre date: take the most recent last_updated from any item
  const lastCuadreDate = items
    .map((i) => i.last_updated)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Cuadre de Caja</h1>
          <p className="text-muted-foreground mt-1">Registro manual de montos por concepto</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4" /> Agregar concepto
          </Button>
          <Button className="gap-2" onClick={handleCuadre}>
            <Calculator className="w-4 h-4" /> Realizar cuadre
          </Button>
        </div>
      </div>

      {/* Add concept form */}
      {showAddForm && (
        <Card className="p-4 border-dashed border-2 border-primary/30 bg-primary/5">
          <div className="flex gap-2">
            <Input
              placeholder="Ej: Efectivo Chepen, BCP, Telecredito..."
              value={newConcept}
              onChange={(e) => setNewConcept(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddConcept()}
              className="flex-1"
            />
            <Button onClick={handleAddConcept} disabled={!newConcept.trim()}>
              <Save className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={() => { setShowAddForm(false); setNewConcept(""); }}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* Conceptos list */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 bg-muted/50 border-b flex items-center justify-between">
          <span className="font-semibold text-sm">Conceptos</span>
          <span className="text-xs text-muted-foreground">Ingresa los montos manualmente</span>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Calculator className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No hay conceptos aún.</p>
            <p className="text-sm mt-1">Agrega conceptos como "Efectivo Chepen", "BCP", etc.</p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.concept}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {editingId === item.id ? (
                    <>
                      <Input
                        type="number"
                        step="0.01"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveAmount(item)}
                        className="w-36 text-right"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleSaveAmount(item)}>
                        <Save className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancelar</Button>
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-base w-36 text-right tabular-nums">
                        {formatCurrency(item.amount || 0)}
                      </span>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleStartEdit(item)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (window.confirm(`¿Eliminar el concepto "${item.concept}"?`)) deleteItem.mutate(item.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Totales */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total cuadre */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Total Cuadre</p>
            <p className="text-2xl font-bold text-blue-800 mt-1 tabular-nums">{formatCurrency(totalCuadre)}</p>
            {lastCuadreDate && (
              <p className="text-xs text-blue-600 mt-1">
                Último cuadre: {format(parseLocalDate(lastCuadreDate), "dd MMM yyyy", { locale: es })}
              </p>
            )}
          </Card>

          {/* Balance total del sistema */}
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Balance Total Sistema</p>
            <p className="text-2xl font-bold text-emerald-800 mt-1 tabular-nums">{formatCurrency(balanceTotal)}</p>
            <p className="text-xs text-emerald-600 mt-1">Ingresos − Gastos acumulados</p>
          </Card>

          {/* Faltante */}
          <Card className={`p-4 ${faltante > 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-center gap-1.5">
              {faltante <= 0 ? (
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
              <p className={`text-xs font-medium uppercase tracking-wide ${faltante <= 0 ? "text-red-700" : "text-emerald-700"}`}>
                {faltante <= 0 ? "Faltante" : "Sobrante"}
              </p>
            </div>
            <p className={`text-2xl font-bold mt-1 tabular-nums ${faltante <= 0 ? "text-red-600" : "text-emerald-600"}`}>
              {formatCurrency(Math.abs(faltante))}
            </p>
            <p className={`text-xs mt-1 ${faltante <= 0 ? "text-red-500" : "text-emerald-500"}`}>
              {faltante <= 0 ? "Falta en caja" : "Sobra en caja"}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}