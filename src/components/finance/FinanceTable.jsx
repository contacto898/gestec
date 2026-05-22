import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Banknote, ArrowLeftRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const categoryLabels = {
  ventas: "Ventas", servicios: "Servicios", inversiones: "Inversiones",
  prestamos: "Préstamos", otros: "Otros", planilla: "Planilla",
  alquiler: "Alquiler", materiales: "Materiales", transporte: "Transporte",
  impuestos: "Impuestos",
};

function formatCurrency(n) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n || 0);
}

function parseLocalDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function FinanceTable({ items, type, onEdit, onDelete }) {
  const total = items.reduce((sum, i) => sum + (i.amount || 0), 0);
  const isIncome = type === "income";

  return (
    <div className="bg-card rounded-2xl border overflow-hidden">
      {/* Mobile: card list */}
      <div className="sm:hidden divide-y">
        {items.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No hay {isIncome ? "ingresos" : "gastos"} registrados
          </div>
        ) : items.map((item) => (
          <div key={item.id} className="p-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{item.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.date ? format(parseLocalDate(item.date), "dd MMM yyyy", { locale: es }) : "—"}
              </p>
              <div className="flex items-center gap-1 flex-wrap mt-1">
                <Badge variant="secondary" className="font-normal text-xs">
                  {categoryLabels[item.category] || item.category}
                </Badge>
                {!isIncome && (
                  item.payment_method === "transferencia" ? (
                    <Badge variant="outline" className="gap-1 text-blue-600 border-blue-300 text-xs">
                      <ArrowLeftRight className="w-2.5 h-2.5" /> Transf.
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-300 text-xs">
                      <Banknote className="w-2.5 h-2.5" /> Efectivo
                    </Badge>
                  )
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={`font-bold text-sm ${isIncome ? "text-emerald-600" : "text-red-500"}`}>
                {isIncome ? "+" : "-"}{formatCurrency(item.amount)}
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => onEdit(item)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-11 w-11 text-destructive hover:text-destructive" onClick={() => onDelete(item.id, item)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tablet/Desktop: table */}
      <div className="hidden sm:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Descripción</TableHead>
              <TableHead className="font-semibold text-right">Monto</TableHead>
              <TableHead className="font-semibold">Fecha</TableHead>
              <TableHead className="font-semibold">Categoría</TableHead>
              {!isIncome && <TableHead className="font-semibold hidden sm:table-cell">Pago</TableHead>}
              <TableHead className="font-semibold hidden md:table-cell">Registrado por</TableHead>
              <TableHead className="font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{item.description}</TableCell>
                <TableCell className={`text-right font-semibold ${isIncome ? "text-emerald-600" : "text-red-500"}`}>
                  {isIncome ? "+" : "-"}{formatCurrency(item.amount)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.date ? format(parseLocalDate(item.date), "dd MMM yyyy", { locale: es }) : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {categoryLabels[item.category] || item.category}
                  </Badge>
                </TableCell>
                {!isIncome && (
                  <TableCell className="hidden sm:table-cell">
                    {item.payment_method === "transferencia" ? (
                      <Badge variant="outline" className="gap-1 text-blue-600 border-blue-300">
                        <ArrowLeftRight className="w-3 h-3" /> Transferencia
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-300">
                        <Banknote className="w-3 h-3" /> Efectivo
                      </Badge>
                    )}
                  </TableCell>
                )}
                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                  {item.created_by ? item.created_by.split("@")[0] : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(item.id, item)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No hay {isIncome ? "ingresos" : "gastos"} registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {items.length > 0 && (
        <div className={`border-t px-4 sm:px-6 py-4 flex justify-between items-center ${isIncome ? "bg-emerald-50" : "bg-red-50"}`}>
          <span className="font-semibold text-sm">Total {isIncome ? "Ingresos" : "Gastos"}</span>
          <span className={`text-xl font-bold ${isIncome ? "text-emerald-600" : "text-red-500"}`}>
            {formatCurrency(total)}
          </span>
        </div>
      )}
    </div>
  );
}