import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Trash2, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const paymentTypeLabels = { mensual: "Mensual", quincenal: "Quincenal", semanal: "Semanal" };

function formatCurrency(n) {
  return new Intl.NumberFormat("es", { style: "currency", currency: "USD" }).format(n || 0);
}

// Calculate installment amount due based on frequency
function getInstallmentAmount(deduction) {
  return deduction.total_amount / deduction.installments;
}

function PayConfirmDialog({ open, onClose, worker, deductions, onPay }) {
  const activeDeductions = deductions.filter(
    (d) => d.worker_id === worker?.id && d.status !== "completado" && d.paid_installments < d.installments
  );
  const totalDeductions = activeDeductions.reduce((s, d) => s + getInstallmentAmount(d), 0);
  const netPay = (worker?.salary || 0) - totalDeductions;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Pago — {worker?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="p-4 rounded-xl bg-muted/40 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Salario ({paymentTypeLabels[worker?.payment_type]})</span>
              <span className="font-semibold">{formatCurrency(worker?.salary)}</span>
            </div>
            {activeDeductions.map((d) => (
              <div key={d.id} className="flex justify-between text-sm">
                <span className="text-red-600">
                  — {d.type === "descuento" ? "Descuento" : "Adelanto"}: {d.concept}
                  <span className="text-xs text-muted-foreground ml-1">
                    (cuota {d.paid_installments + 1}/{d.installments})
                  </span>
                </span>
                <span className="font-semibold text-red-600">-{formatCurrency(getInstallmentAmount(d))}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Neto a pagar</span>
              <span className={netPay >= 0 ? "text-emerald-600" : "text-red-500"}>{formatCurrency(netPay)}</span>
            </div>
          </div>
          {activeDeductions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">Sin descuentos ni adelantos activos</p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => { onPay(worker, activeDeductions, netPay); onClose(); }} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              <DollarSign className="w-4 h-4" /> Registrar Pago
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PayrollTable({ workers, deductions, onEdit, onDelete, onPay }) {
  const [payWorker, setPayWorker] = useState(null);
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
                <TableHead className="font-semibold text-right">Salario</TableHead>
                <TableHead className="font-semibold text-right">Descuentos</TableHead>
                <TableHead className="font-semibold text-right">Neto</TableHead>
                <TableHead className="font-semibold">Tipo</TableHead>
                <TableHead className="font-semibold">Fecha Pago</TableHead>
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
                const neto = w.salary - totalDed;

                return [
                  <TableRow key={w.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1">
                        {workerDeductions.length > 0 && (
                          <button onClick={() => toggleExpand(w.id)} className="text-muted-foreground hover:text-foreground">
                            {expanded[w.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        {w.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{w.position || "—"}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(w.salary)}</TableCell>
                    <TableCell className="text-right">
                      {totalDed > 0
                        ? <span className="text-red-500 font-semibold">-{formatCurrency(totalDed)}</span>
                        : <span className="text-muted-foreground text-sm">—</span>}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(neto)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">{paymentTypeLabels[w.payment_type] || w.payment_type}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {w.payment_date ? format(new Date(w.payment_date), "dd MMM yyyy", { locale: es }) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={w.status === "activo" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                        {w.status === "activo" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" onClick={() => setPayWorker(w)}
                          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 h-7 px-2 text-xs">
                          <DollarSign className="w-3.5 h-3.5" /> Pagar
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(w)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(w.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>,
                  expanded[w.id] && workerDeductions.map((d) => (
                    <TableRow key={`ded-${d.id}`} className="bg-red-50/40">
                      <TableCell colSpan={2} className="pl-10 text-xs text-muted-foreground italic">
                        {d.type === "descuento" ? "↳ Descuento" : "↳ Adelanto"}: {d.concept}
                      </TableCell>
                      <TableCell colSpan={2} className="text-right text-xs text-red-500">
                        Cuota {d.paid_installments + 1}/{d.installments} · {paymentTypeLabels[d.frequency]}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-red-500">
                        -{formatCurrency(getInstallmentAmount(d))}
                      </TableCell>
                      <TableCell colSpan={4} />
                    </TableRow>
                  ))
                ];
              })}
              {workers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No hay trabajadores registrados</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {workers.length > 0 && (
          <div className="border-t px-6 py-4 flex justify-between items-center bg-primary/5">
            <span className="font-semibold text-sm">Total Planilla Bruta</span>
            <span className="text-xl font-bold text-primary">{formatCurrency(totalPayroll)}</span>
          </div>
        )}
      </div>

      <PayConfirmDialog
        open={!!payWorker}
        onClose={() => setPayWorker(null)}
        worker={payWorker}
        deductions={deductions}
        onPay={onPay}
      />
    </>
  );
}