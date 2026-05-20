import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Palmtree } from "lucide-react";
import VacationReport from "@/components/payroll/VacationReport";
import PayrollForm from "@/components/payroll/PayrollForm";
import PayrollTable from "@/components/payroll/PayrollTable";
import { getPaidToday, addPaidToday } from "@/lib/paidToday";

function getTodayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Payroll() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [vacPaidToday, setVacPaidToday] = useState(() => getPaidToday("vacaciones"));
  const qc = useQueryClient();

  const { data: workers = [] } = useQuery({ queryKey: ["workers"], queryFn: () => base44.entities.Worker.list("-created_date") });
  const { data: deductions = [] } = useQuery({ queryKey: ["deductions"], queryFn: () => base44.entities.Deduction.list() });

  const createWorker = useMutation({ mutationFn: (d) => base44.entities.Worker.create(d), onSuccess: () => qc.invalidateQueries({ queryKey: ["workers"] }) });
  const updateWorker = useMutation({ mutationFn: ({ id, data }) => base44.entities.Worker.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["workers"] }), mutationKey: ["updateWorker"] });
  const deleteWorker = useMutation({ mutationFn: (id) => base44.entities.Worker.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["workers"] }) });
  const createVacRecord = useMutation({ mutationFn: (d) => base44.entities.VacationRecord.create(d), onSuccess: () => qc.invalidateQueries({ queryKey: ["vacation_records"] }) });
  const createExpense = useMutation({
    mutationFn: (d) => base44.entities.Expense.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["incomes"], refetchType: "all" });
    },
  });
  const updateDeduction = useMutation({ mutationFn: ({ id, data }) => base44.entities.Deduction.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["deductions"] }) });

  const handleSubmit = (data) => {
    editing ? updateWorker.mutate({ id: editing.id, data }) : createWorker.mutate(data);
    setEditing(null);
  };

  const handlePay = async (worker, activeDeductions, netAmount) => {
    const today = getTodayLocal();
    await createExpense.mutateAsync({
      description: `Pago planilla (${worker.payment_type}) — ${worker.name}`,
      amount: netAmount,
      date: today,
      category: "planilla",
    });
    await updateWorker.mutateAsync({ id: worker.id, data: { ...worker, last_payment_date: today } });
    for (const d of activeDeductions) {
      const newPaid = (d.paid_installments || 0) + 1;
      const newStatus = newPaid >= d.installments ? "completado" : "en_proceso";
      updateDeduction.mutate({ id: d.id, data: { ...d, paid_installments: newPaid, status: newStatus } });
    }
  };

  const handleVacation = async (worker, option, paidAmount, days, vacStartDate, daysAccumulated) => {
    const today = getTodayLocal();
    const dateRef = vacStartDate || today;
    const prevAccumulated = worker.accumulated_vacation_days || 0;
    const totalDaysAvailable = 15 + prevAccumulated;

    if (paidAmount > 0) {
      const descMap = {
        pago: "pago completo",
        mixto: `${days} días libres desde ${dateRef} + pago parcial`,
        vacaciones: "solo días libres",
      };
      await createExpense.mutateAsync({
        description: `Vacaciones — ${worker.name} (${descMap[option] || option})`,
        amount: paidAmount,
        date: today,
        category: "planilla",
      });
    }

    createVacRecord.mutate({
      worker_id: worker.id,
      worker_name: worker.name,
      record_date: today,
      vac_start_date: (option === "vacaciones" || option === "mixto" || (option === "acumular" && days > 0)) ? dateRef : null,
      option_selected: option,
      days_taken: option === "pago" ? 0 : option === "acumular" ? days : option === "vacaciones" ? totalDaysAvailable : days,
      days_accumulated: option === "acumular" ? daysAccumulated : 0,
      total_days_available: totalDaysAvailable,
      amount_paid: paidAmount,
    });

    const newAccumulated = option === "acumular" ? prevAccumulated + daysAccumulated : 0;
    const shouldMarkDate = option !== "acumular" || days > 0;
    updateWorker.mutate({
      id: worker.id,
      data: {
        ...worker,
        vacation_paid_date: shouldMarkDate ? dateRef : worker.vacation_paid_date,
        accumulated_vacation_days: newAccumulated,
      },
    });

    addPaidToday("vacaciones", worker.id);
    setVacPaidToday(getPaidToday("vacaciones"));
  };

  const handleUseAccumulated = (worker, daysToUse, startDate) => {
    const today = getTodayLocal();
    const prevAccumulated = worker.accumulated_vacation_days || 0;
    const remaining = prevAccumulated - daysToUse;
    createVacRecord.mutate({
      worker_id: worker.id,
      worker_name: worker.name,
      record_date: today,
      vac_start_date: startDate,
      option_selected: "acumular",
      days_taken: daysToUse,
      days_accumulated: remaining,
      total_days_available: prevAccumulated,
      amount_paid: 0,
    });
    updateWorker.mutate({
      id: worker.id,
      data: { ...worker, accumulated_vacation_days: remaining },
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Planilla</h1>
          <p className="text-muted-foreground mt-1">Gestiona pagos con descuentos, adelantos y vacaciones</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setReportOpen(true)} className="gap-2">
            <Palmtree className="w-4 h-4 text-amber-500" /> Historial Vacaciones
          </Button>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Agregar Trabajador
          </Button>
        </div>
      </div>

      <PayrollTable
        workers={workers}
        deductions={deductions}
        onEdit={(w) => { setEditing(w); setFormOpen(true); }}
        onDelete={(id) => deleteWorker.mutate(id)}
        onPay={handlePay}
        onVacation={handleVacation}
        onUseAccumulated={handleUseAccumulated}
        vacPaidToday={vacPaidToday}
      />

      <VacationReport open={reportOpen} onClose={() => setReportOpen(false)} workers={workers} />

      <PayrollForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        editingWorker={editing}
      />
    </div>
  );
}