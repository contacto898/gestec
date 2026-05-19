import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import PayrollForm from "@/components/payroll/PayrollForm";
import PayrollTable from "@/components/payroll/PayrollTable";

export default function Payroll() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();

  const { data: workers = [] } = useQuery({ queryKey: ["workers"], queryFn: () => base44.entities.Worker.list("-created_date") });
  const { data: deductions = [] } = useQuery({ queryKey: ["deductions"], queryFn: () => base44.entities.Deduction.list() });

  const createWorker = useMutation({ mutationFn: (d) => base44.entities.Worker.create(d), onSuccess: () => qc.invalidateQueries({ queryKey: ["workers"] }) });
  const updateWorker = useMutation({ mutationFn: ({ id, data }) => base44.entities.Worker.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["workers"] }) });
  const deleteWorker = useMutation({ mutationFn: (id) => base44.entities.Worker.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["workers"] }) });

  const createExpense = useMutation({ mutationFn: (d) => base44.entities.Expense.create(d), onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }) });
  const updateDeduction = useMutation({ mutationFn: ({ id, data }) => base44.entities.Deduction.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["deductions"] }) });

  const handleSubmit = (data) => {
    editing ? updateWorker.mutate({ id: editing.id, data }) : createWorker.mutate(data);
    setEditing(null);
  };

  // Pay worker: register expense and advance paid installments
  const handlePay = async (worker, activeDeductions, netAmount) => {
    const today = format(new Date(), "yyyy-MM-dd");

    // Register as expense in Ingresos y Gastos
    await createExpense.mutateAsync({
      description: `Pago planilla — ${worker.name}`,
      amount: netAmount,
      date: today,
      category: "Planilla",
    });

    // Advance paid installments on each deduction
    for (const d of activeDeductions) {
      const newPaid = (d.paid_installments || 0) + 1;
      const newStatus = newPaid >= d.installments ? "completado" : "en_proceso";
      updateDeduction.mutate({ id: d.id, data: { ...d, paid_installments: newPaid, status: newStatus } });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Planilla</h1>
          <p className="text-muted-foreground mt-1">Gestiona pagos con descuentos y adelantos aplicados</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Agregar Trabajador
        </Button>
      </div>

      <PayrollTable
        workers={workers}
        deductions={deductions}
        onEdit={(w) => { setEditing(w); setFormOpen(true); }}
        onDelete={(id) => deleteWorker.mutate(id)}
        onPay={handlePay}
      />

      <PayrollForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        editingWorker={editing}
      />
    </div>
  );
}