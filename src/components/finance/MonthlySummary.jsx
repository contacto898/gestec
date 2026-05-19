import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

function formatCurrency(n) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n || 0);
}

function groupByMonth(items) {
  const months = {};
  items.forEach((item) => {
    if (!item.date) return;
    const key = item.date.substring(0, 7);
    if (!months[key]) months[key] = 0;
    months[key] += item.amount || 0;
  });
  return months;
}

export default function MonthlySummary({ incomes, expenses }) {
  const incomeByMonth = groupByMonth(incomes);
  const expenseByMonth = groupByMonth(expenses);

  const allMonths = [...new Set([...Object.keys(incomeByMonth), ...Object.keys(expenseByMonth)])].sort();

  let accumulated = 0;

  const rows = allMonths.map((month) => {
    const inc = incomeByMonth[month] || 0;
    const exp = expenseByMonth[month] || 0;
    const net = inc - exp;
    accumulated += net;
    return { month, income: inc, expense: exp, net, accumulated };
  });

  if (rows.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        No hay datos para mostrar el resumen mensual
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4 border-b bg-muted/30">
        <h3 className="font-semibold text-sm">Resumen Mensual Acumulado</h3>
      </div>
      <div className="divide-y">
        {rows.map((r) => {
          const monthLabel = format(new Date(+r.month.split("-")[0], +r.month.split("-")[1] - 1, 1), "MMMM yyyy", { locale: es });
          return (
            <div key={r.month} className="px-6 py-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold capitalize">{monthLabel}</span>
                <span className={`text-sm font-bold ${r.accumulated >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  Acumulado: {formatCurrency(r.accumulated)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{formatCurrency(r.income)}</span>
                </div>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <div className="flex items-center gap-1.5 text-red-500">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>{formatCurrency(r.expense)}</span>
                </div>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <span className={`font-semibold ${r.net >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  Neto: {formatCurrency(r.net)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}