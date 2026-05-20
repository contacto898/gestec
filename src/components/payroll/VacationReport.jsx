import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Palmtree } from "lucide-react";

const optionLabels = {
  pago: "Pago completo",
  vacaciones: "Días libres",
  mixto: "Mixto",
  acumular: "Acumulado",
};

const optionColors = {
  pago: "bg-emerald-100 text-emerald-700",
  vacaciones: "bg-blue-100 text-blue-700",
  mixto: "bg-purple-100 text-purple-700",
  acumular: "bg-orange-100 text-orange-700",
};

function formatCurrency(n) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n || 0);
}

function formatDate(d) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export default function VacationReport({ open, onClose, workers }) {
  const [filterWorker, setFilterWorker] = useState("all");

  const { data: records = [] } = useQuery({
    queryKey: ["vacation_records"],
    queryFn: () => base44.entities.VacationRecord.list("-record_date"),
    enabled: open,
  });

  const workerIds = new Set(workers.map((w) => w.id));

  const filtered = filterWorker === "all"
    ? records
    : records.filter((r) => r.worker_id === filterWorker);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palmtree className="w-5 h-5 text-amber-500" /> Historial de Vacaciones
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <Select value={filterWorker} onValueChange={setFilterWorker}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Filtrar por trabajador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los trabajadores</SelectItem>
              {workers.map((w) => (
                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filtered.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground text-sm">No hay registros de vacaciones aún.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((r) => (
                <div key={r.id} className="border rounded-xl p-3 space-y-2 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-semibold text-sm">
                      {r.worker_name}
                      {!workerIds.has(r.worker_id) && (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground border rounded px-1 py-0.5">(eliminado)</span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs font-normal ${optionColors[r.option_selected] || "bg-gray-100 text-gray-700"}`}>
                        {optionLabels[r.option_selected] || r.option_selected}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(r.record_date)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-muted/40 rounded-lg p-2 text-center">
                      <p className="text-muted-foreground">Días disponibles</p>
                      <p className="font-semibold">{r.total_days_available ?? 15}</p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-2 text-center">
                      <p className="text-muted-foreground">Días tomados</p>
                      <p className="font-semibold">{r.days_taken || 0}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-2 text-center">
                      <p className="text-orange-600">Acumulados</p>
                      <p className="font-semibold text-orange-700">{r.days_accumulated || 0}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-2 text-center">
                      <p className="text-emerald-600">Pagado</p>
                      <p className="font-semibold text-emerald-700">{formatCurrency(r.amount_paid)}</p>
                    </div>
                  </div>
                  {r.vac_start_date && r.days_taken > 0 && (
                    <p className="text-xs text-muted-foreground">Inicio días libres: {formatDate(r.vac_start_date)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}