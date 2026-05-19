import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import StatsCard from "@/components/dashboard/StatsCard";
import { Users, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

function formatCurrency(n) {
  return new Intl.NumberFormat("es", { style: "currency", currency: "USD" }).format(n || 0);
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

export default function Dashboard() {
  const { data: workers = [] } = useQuery({ queryKey: ["workers"], queryFn: () => base44.entities.Worker.list() });
  const { data: incomes = [] } = useQuery({ queryKey: ["incomes"], queryFn: () => base44.entities.Income.list() });
  const { data: expenses = [] } = useQuery({ queryKey: ["expenses"], queryFn: () => base44.entities.Expense.list() });

  // Current month
  const now = new Date();
  const currentMonthKey = format(now, "yyyy-MM");

  const activeWorkers = workers.filter((w) => w.status === "activo");
  const totalPayroll = activeWorkers.reduce((s, w) => s + (w.salary || 0), 0);

  // Month totals
  const monthIncomes = incomes.filter((i) => i.date && i.date.startsWith(currentMonthKey));
  const monthExpenses = expenses.filter((e) => e.date && e.date.startsWith(currentMonthKey));
  const totalMonthIncome = monthIncomes.reduce((s, i) => s + (i.amount || 0), 0);
  const totalMonthExpense = monthExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const balanceMes = totalMonthIncome - totalMonthExpense;

  // Cumulative (all time)
  const totalAllIncome = incomes.reduce((s, i) => s + (i.amount || 0), 0);
  const totalAllExpense = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const balanceTotal = totalAllIncome - totalAllExpense;

  const incomeByMonth = groupByMonth(incomes);
  const expenseByMonth = groupByMonth(expenses);
  const allMonths = [...new Set([...Object.keys(incomeByMonth), ...Object.keys(expenseByMonth)])].sort();
  const chartData = allMonths.map((m) => ({
    month: format(parseISO(m + "-01"), "MMM yy", { locale: es }),
    Ingresos: incomeByMonth[m] || 0,
    Gastos: expenseByMonth[m] || 0,
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Resumen financiero — {format(now, "MMMM yyyy", { locale: es })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Trabajadores Activos" value={activeWorkers.length} icon={Users} trendLabel={`${workers.length} total`} />
        <StatsCard title="Total Planilla" value={formatCurrency(totalPayroll)} icon={Wallet} trendLabel={`${activeWorkers.length} activos`} />
        <StatsCard title="Ingresos del Mes" value={formatCurrency(totalMonthIncome)} icon={TrendingUp} trend="up" trendLabel={`${monthIncomes.length} registros este mes`} />
        <StatsCard title="Gastos del Mes" value={formatCurrency(totalMonthExpense)} icon={TrendingDown} trend="down" trendLabel={`${monthExpenses.length} registros este mes`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-semibold mb-4">Ingresos vs Gastos por Mes</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="Ingresos" fill="hsl(167, 72%, 46%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Gastos" fill="hsl(0, 84%, 60%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">No hay datos para graficar</div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Resumen Financiero</h3>
          <div className="space-y-4">
            {/* Balance Mes */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Balance Mes</p>
              <p className={`text-3xl font-bold ${balanceMes >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {formatCurrency(balanceMes)}
              </p>
              <p className="text-xs text-muted-foreground mt-1 capitalize">{format(now, "MMMM yyyy", { locale: es })}</p>
            </div>
            {/* Balance Total */}
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Balance Total</p>
              <p className={`text-3xl font-bold ${balanceTotal >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {formatCurrency(balanceTotal)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Acumulado histórico</p>
            </div>
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50">
                <span className="text-sm font-medium text-emerald-700">Ingresos del mes</span>
                <span className="font-bold text-emerald-600">{formatCurrency(totalMonthIncome)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-red-50">
                <span className="text-sm font-medium text-red-700">Gastos del mes</span>
                <span className="font-bold text-red-500">{formatCurrency(totalMonthExpense)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted">
                <span className="text-sm font-medium">Planilla activa</span>
                <span className="font-bold text-primary">{formatCurrency(totalPayroll)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}