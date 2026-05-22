import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PullToRefresh from "@/components/ui/PullToRefresh";
import MobileSelect from "@/components/ui/MobileSelect";
import StatsCard from "@/components/dashboard/StatsCard";
import { Users, TrendingUp, TrendingDown, Wallet, Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function parseLocalDate(str) {
  if (!str) return new Date();
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

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

const categoryLabels = {
  planilla: "Planilla", alquiler: "Alquiler", servicios: "Servicios",
  materiales: "Materiales", transporte: "Transporte", impuestos: "Impuestos", otros: "Otros",
};

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState("current");
  const queryClient = useQueryClient();
  const { data: workers = [] } = useQuery({ queryKey: ["workers"], queryFn: () => base44.entities.Worker.list() });
  const { data: incomes = [] } = useQuery({ queryKey: ["incomes"], queryFn: () => base44.entities.Income.list() });
  const { data: expenses = [] } = useQuery({ queryKey: ["expenses"], queryFn: () => base44.entities.Expense.list() });
  const { data: fixedExpenses = [] } = useQuery({ queryKey: ["fixedExpenses"], queryFn: () => base44.entities.FixedExpense.list() });

  const handleRefresh = () => queryClient.invalidateQueries({ refetchType: "all" });

  const now = new Date();
  const currentMonthKey = format(now, "yyyy-MM");

  const allMonths = [...new Set([
    ...incomes.map(i => i.date?.substring(0, 7)),
    ...expenses.map(e => e.date?.substring(0, 7)),
  ].filter(Boolean))].sort().reverse();

  const activeMonthKey = selectedMonth === "current" ? currentMonthKey : selectedMonth;

  const activeWorkers = workers.filter((w) => w.status === "activo");
  const totalPayroll = activeWorkers.reduce((s, w) => s + (w.salary || 0), 0);

  const monthIncomes = incomes.filter((i) => i.date && i.date.startsWith(activeMonthKey));
  const monthExpenses = expenses.filter((e) => e.date && e.date.startsWith(activeMonthKey));
  const totalMonthIncome = monthIncomes.reduce((s, i) => s + (i.amount || 0), 0);
  const totalMonthExpense = monthExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const balanceMes = totalMonthIncome - totalMonthExpense;

  const totalAllIncome = incomes.reduce((s, i) => s + (i.amount || 0), 0);
  const totalAllExpense = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const balanceTotal = totalAllIncome - totalAllExpense;

  const totalFixedExpenses = fixedExpenses.filter(f => f.status === "activo").reduce((s, f) => s + (f.amount || 0), 0);

  const incomeByMonth = groupByMonth(incomes);
  const expenseByMonth = groupByMonth(expenses);
  const chartMonths = [...new Set([...Object.keys(incomeByMonth), ...Object.keys(expenseByMonth)])].sort();
  const chartData = chartMonths.map((m) => ({
    month: format(parseLocalDate(m + "-01"), "MMM yy", { locale: es }),
    Ingresos: incomeByMonth[m] || 0,
    Gastos: expenseByMonth[m] || 0,
  }));

  // Top 5 gastos del mes por monto
  const topExpenses = [...monthExpenses].sort((a, b) => (b.amount || 0) - (a.amount || 0)).slice(0, 5);

  const monthOptions = [
    { value: "current", label: "Mes actual" },
    ...allMonths.map((m) => ({ value: m, label: format(parseLocalDate(m + "-02"), "MMMM yyyy", { locale: es }) })),
  ];

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-6 w-full max-w-7xl mx-auto p-4 lg:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Resumen financiero — {format(parseLocalDate(activeMonthKey + "-02"), "MMMM yyyy", { locale: es })}
          </p>
        </div>
        <MobileSelect
          value={selectedMonth}
          onValueChange={setSelectedMonth}
          options={monthOptions}
          label="Seleccionar mes"
          triggerClassName="w-48"
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Trabajadores Activos" value={activeWorkers.length} icon={Users} trendLabel={`${workers.length} total`} className="col-span-1" />

        {/* Carga Fija Total */}
        <Card className="p-4 flex flex-col justify-between min-h-[130px] hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-start justify-between gap-2 min-h-[2.25rem]">
            <p className="text-xs font-medium text-muted-foreground leading-tight line-clamp-2">Carga Fija Total</p>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-xl lg:text-2xl font-bold tracking-tight leading-tight break-all">{formatCurrency(totalPayroll + totalFixedExpenses)}</p>
          </div>
          <div className="hidden sm:grid grid-cols-2 gap-2 mt-1">
            <div>
              <p className="text-[10px] text-muted-foreground">Planilla</p>
              <p className="text-xs font-semibold">{formatCurrency(totalPayroll)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Fijos</p>
              <p className="text-xs font-semibold">{formatCurrency(totalFixedExpenses)}</p>
            </div>
          </div>
          <div className="h-4 sm:hidden">
            <p className="text-xs text-muted-foreground">Planilla + Fijos</p>
          </div>
        </Card>

        <StatsCard title="Ingresos del Mes" value={formatCurrency(totalMonthIncome)} icon={TrendingUp} trend="up" trendLabel={`${monthIncomes.length} registros`} />
        <StatsCard title="Gastos del Mes" value={formatCurrency(totalMonthExpense)} icon={TrendingDown} trend="down" trendLabel={`${monthExpenses.length} registros`} />
      </div>

      {/* Chart + Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left column: chart + top gastos */}
        <div className="xl:col-span-2 space-y-4">
          <Card className="p-4 lg:p-6 min-w-0 overflow-hidden">
            <h3 className="font-semibold mb-4">Ingresos vs Gastos por Mes</h3>
            {chartData.length > 0 ? (
              <div className="w-full overflow-hidden">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} barGap={4} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `S/${v}`} width={60} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="Ingresos" fill="hsl(167, 72%, 46%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Gastos" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">No hay datos para graficar</div>
            )}
          </Card>

          {/* Top Gastos del Mes */}
          <Card className="p-4 lg:p-6 min-w-0 overflow-hidden">
            <h3 className="font-semibold mb-4">Top Gastos del Mes</h3>
            {topExpenses.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">No hay gastos registrados este mes.</p>
            ) : (
              <div className="space-y-2">
                {topExpenses.map((exp, idx) => (
                  <div key={exp.id} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{exp.description}</p>
                      {exp.category && (
                        <p className="text-xs text-muted-foreground">{categoryLabels[exp.category] || exp.category}</p>
                      )}
                    </div>
                    <span className="font-bold text-red-500 text-sm shrink-0">{formatCurrency(exp.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right column: resumen financiero */}
        <Card className="p-4 lg:p-6 min-w-0 overflow-hidden">
          <h3 className="font-semibold mb-4">Resumen Financiero</h3>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Balance Mes</p>
              <p className={`text-2xl font-bold mt-0.5 ${balanceMes >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {formatCurrency(balanceMes)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">{format(parseLocalDate(activeMonthKey + "-02"), "MMMM yyyy", { locale: es })}</p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Balance Total</p>
              <p className={`text-2xl font-bold mt-0.5 ${balanceTotal >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {formatCurrency(balanceTotal)}
              </p>
              <div className="mt-2 pt-2 border-t border-primary/20 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ingresos</p>
                  <p className="font-bold text-emerald-600 text-sm">{formatCurrency(totalAllIncome)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Gastos</p>
                  <p className="font-bold text-red-500 text-sm">{formatCurrency(totalAllExpense)}</p>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-emerald-50">
                <span className="text-xs font-medium text-emerald-700">Ingresos del mes</span>
                <span className="font-bold text-emerald-600 text-sm">{formatCurrency(totalMonthIncome)}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-red-50">
                <span className="text-xs font-medium text-red-700">Gastos del mes</span>
                <span className="font-bold text-red-500 text-sm">{formatCurrency(totalMonthExpense)}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-muted">
                <span className="text-xs font-medium">Planilla activa</span>
                <span className="font-bold text-primary text-sm">{formatCurrency(totalPayroll)}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-orange-50">
                <span className="text-xs font-medium text-orange-700">Gastos fijos</span>
                <span className="font-bold text-orange-600 text-sm">{formatCurrency(totalFixedExpenses)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
    </PullToRefresh>
  );
}