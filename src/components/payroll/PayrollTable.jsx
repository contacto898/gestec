import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const paymentTypeLabels = { mensual: "Mensual", quincenal: "Quincenal", semanal: "Semanal" };

function formatCurrency(n) {
  return new Intl.NumberFormat("es", { style: "currency", currency: "USD" }).format(n || 0);
}

export default function PayrollTable({ workers, onEdit, onDelete }) {
  const totalPayroll = workers.reduce((sum, w) => sum + (w.salary || 0), 0);

  return (
    <div className="bg-card rounded-2xl border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Nombre</TableHead>
              <TableHead className="font-semibold">Cargo</TableHead>
              <TableHead className="font-semibold text-right">Salario</TableHead>
              <TableHead className="font-semibold">Tipo de Pago</TableHead>
              <TableHead className="font-semibold">Fecha Pago</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers.map((w) => (
              <TableRow key={w.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{w.name}</TableCell>
                <TableCell className="text-muted-foreground">{w.position || "—"}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(w.salary)}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {paymentTypeLabels[w.payment_type] || w.payment_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {w.payment_date ? format(new Date(w.payment_date), "dd MMM yyyy", { locale: es }) : "—"}
                </TableCell>
                <TableCell>
                  <Badge className={w.status === "activo"
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                    : "bg-red-100 text-red-700 hover:bg-red-100"
                  }>
                    {w.status === "activo" ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(w)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(w.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {workers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No hay trabajadores registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {workers.length > 0 && (
        <div className="border-t px-6 py-4 flex justify-between items-center bg-primary/5">
          <span className="font-semibold text-sm">Total Planilla</span>
          <span className="text-xl font-bold text-primary">{formatCurrency(totalPayroll)}</span>
        </div>
      )}
    </div>
  );
}