import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Trash2, DollarSign, ChevronDown, ChevronUp, Palmtree } from "lucide-react";
import { format, differenceInMonths, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";

const paymentTypeLabels = { mensual: "Mensual", quincenal: "Quincenal", semanal: "Semanal" };

function formatCurrency(n) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n || 0);
}


// Amount to pay per period based on payment_type
function getSalaryByType(salary, paymentType) {
  if (paymentType === "quincenal") return salary / 2;
  if (paymentType === "semanal") return salary / 4.33;
  return salary; // mensual
}

function getInstallmentAmount(deduction) {
  return deduction.total_amount / deduction.installments;
}

// Check if worker has completed 1+ year and hasn't received vacation for current year
function getVacationStatus(worker) {
  if (!worker.hire_date) return null;
  const hire = new Date(worker.hire_date + "T12:00:00");
  const now = new Date();
  const years = differenceInYears(now, hire);
  if (years < 1) return null;

  // Check months since last vacation payment
  if (worker.vacation_paid_date) {
    const lastVacPaid = new Date(worker.vacation_paid_date + "T12:00:00");
    const monthsSince = differenceInMonths(now, lastVacPaid);
    if (monthsSince < 11) return null; // Not due yet
  }
  // Vacation = half a month salary
  const vacationAmount = worker.salary / 2;
  return { years, vacationAmount };
}

// Returns today in yyyy-MM-dd local time
function getTodayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

// ── Vacation Dialog ──────────────────────────────────────────────────────────
function VacationDialog({ open, onClose, worker, onConfirm }) {
  const [option, setOption] = useState("pago"); // "pago" | "vacaciones" | "mixto" | "acumular"
  const [daysOff, setDaysOff] = useState(7);
  const [vacStartDate, setVacStartDate] = useState(getTodayLocal());
  // For "acumular": how many days to take now vs accumulate
  const [daysToTakeNow, setDaysToTakeNow] = useState(0);
  const vacAmount = worker?.salary / 2 || 0;
  const totalVacDays = 15;

  // For "acumular": days taken now generate proportional pay reduction
  const accumulatePaidAmount = daysToTakeNow > 0 ? 0 : 0; // No pay in accumulate mode
  const daysAccumulated = totalVacDays - daysToTakeNow;

  const paidAmount = option === "vacaciones" ? 0
    : option === "mixto" ? vacAmount * (1 - daysOff / 15)
    : option === "acumular" ? 0
    : vacAmount;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vacaciones — {worker?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-sm">
            <p className="font-semibold text-amber-800">¡Año cumplido!</p>
            <p className="text-amber-700 mt-0.5">Vacaciones = medio mes = {formatCurrency(vacAmount)} ({totalVacDays} días)</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">¿Cómo tomará las vacaciones?</p>
            <div className="space-y-2">
              {[
                { value: "pago", label: "Se paga el medio mes completo", desc: "No toma días libres" },
                { value: "vacaciones", label: "Toma vacaciones completas (15 días)", desc: "Días libres, sin pago extra" },
                { value: "mixto", label: "Vacaciones parciales + pago", desc: "Parte días libres, parte pagada" },
                { value: "acumular", label: "Acumular para el próximo año", desc: "Elige cuántos días tomar ahora y cuántos guardar" },
              ].map((opt) => (
                <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${option === opt.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}>
                  <input type="radio" className="mt-0.5" value={opt.value} checked={option === opt.value} onChange={() => setOption(opt.value)} />
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Fecha de inicio (para opciones con días libres) */}
          {(option === "vacaciones" || option === "mixto" || (option === "acumular" && daysToTakeNow > 0)) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha de inicio de vacaciones</label>
              <input type="date" value={vacStartDate} onChange={(e) => setVacStartDate(e.target.value)}
                className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          )}

          {option === "mixto" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Días libres (de 15)</label>
              <input type="range" min={1} max={14} value={daysOff} onChange={(e) => setDaysOff(+e.target.value)} className="w-full" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{daysOff} días libres desde {vacStartDate}</span>
                <span>Pago: {formatCurrency(vacAmount * (1 - daysOff / 15))}</span>
              </div>
            </div>
          )}

          {option === "acumular" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Días a tomar ahora (de {totalVacDays})</label>
                <input type="range" min={0} max={totalVacDays} value={daysToTakeNow}
                  onChange={(e) => setDaysToTakeNow(+e.target.value)} className="w-full" />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-orange-50 border border-orange-100 text-center">
                    <p className="text-orange-600 font-semibold">{daysToTakeNow} días</p>
                    <p className="text-orange-500">Toma ahora</p>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-center">
                    <p className="text-blue-600 font-semibold">{daysAccumulated} días</p>
                    <p className="text-blue-500">Se acumulan</p>
                  </div>
                </div>
              </div>
              {daysAccumulated > 0 && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-700">
                  {daysAccumulated} días se acumularán para el próximo ciclo. No generan pago ahora.
                </div>
              )}
            </div>
          )}

          {paidAmount > 0 && (
            <div className="p-3 rounded-xl bg-emerald-50 flex justify-between items-center">
              <span className="text-sm font-medium text-emerald-700">Monto a pagar</span>
              <span className="font-bold text-emerald-600">{formatCurrency(paidAmount)}</span>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => {
              onConfirm(worker, option, paidAmount, option === "mixto" ? daysOff : daysToTakeNow, vacStartDate, daysAccumulated);
              onClose();
            }} className="bg-amber-500 hover:bg-amber-600 gap-2">
              <Palmtree className="w-4 h-4" /> Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Pay Confirm Dialog ───────────────────────────────────────────────────────
function PayConfirmDialog({ open, onClose, worker, deductions, onPay }) {
  const activeDeductions = deductions.filter(
    (d) => d.worker_id === worker?.id && d.status !== "completado" && d.paid_installments < d.installments
  );
  const periodSalary = getSalaryByType(worker?.salary || 0, worker?.payment_type);
  const totalDeductions = activeDeductions.reduce((s, d) => s + getInstallmentAmount(d), 0);
  const netPay = periodSalary - totalDeductions;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Pago — {worker?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="p-4 rounded-xl bg-muted/40 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Salario {paymentTypeLabels[worker?.payment_type]}</span>
              <span className="font-semibold">{formatCurrency(periodSalary)}</span>
            </div>
            {worker?.salary !== periodSalary && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Salario mensual</span>
                <span>{formatCurrency(worker?.salary)}</span>
              </div>
            )}
            {activeDeductions.map((d) => (
              <div key={d.id} className="flex justify-between text-sm">
                <span className="text-red-600">
                  — {d.type === "descuento" ? "Descuento" : "Adelanto"}: {d.concept}
                  <span className="text-xs text-muted-foreground ml-1">(cuota {(d.paid_installments || 0) + 1}/{d.installments})</span>
                </span>
                <span className="font-semibold text-red-600">-{formatCurrency(getInstallmentAmount(d))}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Neto a pagar</span>
              <span className={netPay >= 0 ? "text-emerald-600" : "text-red-500"}>{formatCurrency(netPay)}</span>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => { onPay(worker, activeDeductions, netPay); onClose(); }}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              <DollarSign className="w-4 h-4" /> Registrar Pago
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Table ───────────────────────────────────────────────────────────────
export default function PayrollTable({ workers, deductions, onEdit, onDelete, onPay, onVacation, paidToday }) {
  const [payWorker, setPayWorker] = useState(null);
  const [vacWorker, setVacWorker] = useState(null);
  const [expanded, setExpanded] = useState({});

  const totalPayroll = workers.reduce((sum, w) => sum + (w.salary || 0), 0);
  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <>
      <div className="bg-card rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Nombre</TableHead>
                <TableHead className="font-semibold">Cargo</TableHead>
                <TableHead className="font-semibold text-right">Salario Mensual</TableHead>
                <TableHead className="font-semibold text-right">A Pagar ({" "}período)</TableHead>
                <TableHead className="font-semibold text-right">Descuentos</TableHead>
                <TableHead className="font-semibold text-right">Neto</TableHead>
                <TableHead className="font-semibold">Tipo</TableHead>
                <TableHead className="font-semibold">Contrato</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                <TableHead className="font-semibold text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.map((w) => {
                const workerDeductions = deductions.filter(
                  (d) => d.worker_id === w.id && d.status !== "completado" && d.paid_installments < d.installments
                );
                const totalDed = workerDeductions.reduce((s, d) => s + getInstallmentAmount(d), 0);
                const periodSalary = getSalaryByType(w.salary, w.payment_type);
                const neto = periodSalary - totalDed;
                const vacStatus = getVacationStatus(w);
                const alreadyPaid = paidToday?.includes(w.id);

                return [
                  <TableRow key={w.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1">
                        {workerDeductions.length > 0 && (
                          <button onClick={() => toggleExpand(w.id)} className="text-muted-foreground hover:text-foreground">
                            {expanded[w.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <span>{w.name}</span>
                        {vacStatus && (
                          <span title={`Vacaciones pendientes (${vacStatus.years} año${vacStatus.years > 1 ? "s" : ""})`}>
                            <Palmtree className="w-3.5 h-3.5 text-amber-500 ml-1" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{w.position || "—"}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(w.salary)}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">{formatCurrency(periodSalary)}</TableCell>
                    <TableCell className="text-right">
                      {totalDed > 0
                        ? <span className="text-red-500 font-semibold">-{formatCurrency(totalDed)}</span>
                        : <span className="text-muted-foreground text-sm">—</span>}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(neto)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">{paymentTypeLabels[w.payment_type] || w.payment_type}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {w.hire_date ? format(new Date(w.hire_date + "T12:00:00"), "dd MMM yyyy", { locale: es }) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={w.status === "activo" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                        {w.status === "activo" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 flex-wrap">
                        <Button size="sm"
                          onClick={alreadyPaid ? undefined : () => setPayWorker(w)}
                          disabled={alreadyPaid}
                          className={`gap-1.5 h-7 px-2 text-xs ${alreadyPaid ? "bg-red-500 hover:bg-red-500 cursor-not-allowed opacity-80" : "bg-emerald-600 hover:bg-emerald-700"}`}>
                          <DollarSign className="w-3.5 h-3.5" /> {alreadyPaid ? "Pagado" : "Pagar"}
                        </Button>
                        {vacStatus && (
                          <Button size="sm" onClick={() => setVacWorker(w)}
                            className="gap-1 h-7 px-2 text-xs bg-amber-500 hover:bg-amber-600">
                            <Palmtree className="w-3.5 h-3.5" /> Vac.
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(w)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(w.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>,
                  expanded[w.id] && workerDeductions.map((d) => (
                    <TableRow key={`ded-${d.id}`} className="bg-red-50/40">
                      <TableCell colSpan={2} className="pl-10 text-xs text-muted-foreground italic">
                        {d.type === "descuento" ? "↳ Descuento" : "↳ Adelanto"}: {d.concept}
                      </TableCell>
                      <TableCell colSpan={2} className="text-right text-xs text-red-500">
                        Cuota {(d.paid_installments || 0) + 1}/{d.installments} · {paymentTypeLabels[d.frequency]}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-red-500">
                        -{formatCurrency(getInstallmentAmount(d))}
                      </TableCell>
                      <TableCell colSpan={5} />
                    </TableRow>
                  ))
                ];
              })}
              {workers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">No hay trabajadores registrados</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {workers.length > 0 && (
          <div className="border-t px-6 py-4 flex justify-between items-center bg-primary/5">
            <span className="font-semibold text-sm">Total Planilla Mensual</span>
            <span className="text-xl font-bold text-primary">{formatCurrency(totalPayroll)}</span>
          </div>
        )}
      </div>

      <PayConfirmDialog open={!!payWorker} onClose={() => setPayWorker(null)} worker={payWorker} deductions={deductions} onPay={onPay} />
      <VacationDialog open={!!vacWorker} onClose={() => setVacWorker(null)} worker={vacWorker} onConfirm={onVacation} />
    </>
  );
}