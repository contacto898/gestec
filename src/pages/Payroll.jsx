import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PullToRefresh from "@/components/ui/PullToRefresh";
import { Button } from "@/components/ui/button";
import { Plus, Palmtree } from "lucide-react";
import VacationReport from "@/components/payroll/VacationReport";
import PayrollForm from "@/components/payroll/PayrollForm";
import PayrollTable from "@/components/payroll/PayrollTable";
import { getPaidToday, addPaidToday, removePaidToday } from "@/lib/paidToday";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

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
  const [confirmState, setConfirmState] = useState(null);
  const qc = useQueryClient();

  const handleDeleteWorker = (id) => {
    const worker = workers.find(w => w.id === id);
    setConfirmState({
      title: "¿Eliminar trabajador?",
      description: `Se eliminará a "${worker?.name || "este trabajador"}" de la planilla. Esta acción no se puede deshacer.`,
      onConfirm: () => deleteWorker.mutate(id),
    });
  };

  const { data: workers = [] } = useQuery({ queryKey: ["workers"], queryFn: () => base44.entities.Worker.list("-created_date") });
  const { data: deductions = [] } = useQuery({ queryKey: ["deductions"], queryFn: () => base44.entities.Deduction.list() });

  const createWorker = useMutation({
    mutationFn: (d) => base44.entities.Worker.create(d),
    onMutate: async (d) => {
      await qc.cancelQueries({ queryKey: ["workers"] });
      const prev = qc.getQueryData(["workers"]) || [];
      qc.setQueryData(["workers"], [...prev, { ...d, id: "temp-" + Date.now() }]);
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(["workers"], ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["workers"] }),
  });
  const updateWorker = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Worker.update(id, data),
    mutationKey: ["updateWorker"],
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["workers"] });
      const prev = qc.getQueryData(["workers"]) || [];
      qc.setQueryData(["workers"], prev.map(w => w.id === id ? { ...w, ...data } : w));
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(["workers"], ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["workers"] }),
  });
  const deleteWorker = useMutation({
    mutationFn: (id) => base44.entities.Worker.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["workers"] });
      const prev = qc.getQueryData(["workers"]) || [];
      qc.setQueryData(["workers"], prev.filter(w => w.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(["workers"], ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["workers"] }),
  });
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

  const handlePay = async (worker, activeDeductions, netAmount, paymentMethod = "efectivo") => {
    const today = getTodayLocal();
    await createExpense.mutateAsync({
      description: `Pago planilla (${worker.payment_type}) — ${worker.name}`,
      amount: netAmount,
      date: today,
      category: "planilla",
      payment_method: paymentMethod,
    });
    await updateWorker.mutateAsync({ id: worker.id, data: { ...worker, last_payment_date: today } });
    for (const d of activeDeductions) {
      const newPaid = (d.paid_installments || 0) + 1;
      const newStatus = newPaid >= d.installments ? "completado" : "en_proceso";
      updateDeduction.mutate({ id: d.id, data: { ...d, paid_installments: newPaid, status: newStatus } });
    }
  };

  const handleVacation = async (worker, option, paidAmount, days, vacStartDate, daysAccumulated, paymentMethod = "efectivo") => {
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
        payment_method: paymentMethod,
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

    const newAccumulated = option === "acumular" ? daysAccumulated : 0;
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

  const handleDeleteVacRecord = async (record) => {
    // 1. Eliminar el registro
    await base44.entities.VacationRecord.delete(record.id);

    // 2. Si hubo pago, eliminar el gasto correspondiente
    if (record.amount_paid > 0) {
      const expenses = await base44.entities.Expense.filter({ category: "planilla" });
      const match = expenses.find(
        (e) => e.date === record.record_date &&
          Math.abs(e.amount - record.amount_paid) < 0.01 &&
          e.description?.includes(record.worker_name)
      );
      if (match) await base44.entities.Expense.delete(match.id);
    }

    // 3. Calcular estado previo
    const worker = workers.find((w) => w.id === record.worker_id);
    const prevAccumulated = Math.max(0, (record.total_days_available || 15) - 15);
    const allRecords = await base44.entities.VacationRecord.filter({ worker_id: record.worker_id });
    const prevRecord = allRecords
      .filter((r) => r.record_date < record.record_date)
      .sort((a, b) => b.record_date.localeCompare(a.record_date))[0];
    const prevVacDate = prevRecord ? (prevRecord.vac_start_date || prevRecord.record_date) : null;

    if (worker) {
      await base44.entities.Worker.update(worker.id, {
        accumulated_vacation_days: prevAccumulated,
        vacation_paid_date: prevVacDate,
      });
      // Actualizar cache inmediatamente para evitar desfase visual
      qc.setQueryData(["workers"], (old) =>
        old?.map((w) => w.id === worker.id
          ? { ...w, accumulated_vacation_days: prevAccumulated, vacation_paid_date: prevVacDate }
          : w
        )
      );
    }

    // 4. Limpiar estado de pago del día
    removePaidToday("vacaciones", record.worker_id);
    setVacPaidToday(getPaidToday("vacaciones"));

    qc.invalidateQueries({ queryKey: ["vacation_records"] });
    qc.invalidateQueries({ queryKey: ["workers"] });
    qc.invalidateQueries({ queryKey: ["expenses"], refetchType: "all" });
  };

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ["workers"], refetchType: "all" });
    qc.invalidateQueries({ queryKey: ["deductions"], refetchType: "all" });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-0">
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
        onDelete={handleDeleteWorker}
        onPay={handlePay}
        onVacation={handleVacation}
        onUseAccumulated={handleUseAccumulated}
        vacPaidToday={vacPaidToday}
      />

      <VacationReport open={reportOpen} onClose={() => setReportOpen(false)} workers={workers} onDeleteRecord={handleDeleteVacRecord} />

      <PayrollForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        editingWorker={editing}
      />

      <ConfirmDialog
        open={!!confirmState}
        onOpenChange={(o) => { if (!o) setConfirmState(null); }}
        title={confirmState?.title}
        description={confirmState?.description}
        onConfirm={() => { confirmState?.onConfirm(); setConfirmState(null); }}
        confirmLabel="Eliminar"
        destructive
      />
    </div>
    </PullToRefresh>
  );
}