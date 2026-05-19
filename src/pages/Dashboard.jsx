import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import StatsCard from "@/components/dashboard/StatsCard";
import { Users, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, parseISO } from "date-fns";
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
  const { data: workers = [] } = useQuery({
    queryKey: ["workers"],
    queryFn: () => base44.entities.Worker.list(),
  });
  const { data: incomes = [] } = useQuery({
    queryKey: ["incomes"],
    queryFn: () => base44.entities.Income.list(),
  });
  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list(),
  });

  const activeWorkers = workers.filter((w) => w.status === "activo");
  const totalPayroll = activeWorkers.reduce((s, w) => s + (w.salary || 0), 0);
  const totalIncome = incomes.reduce((s, i) => s + (i.amount || 0), 0);
  const totalExpense = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const balance = totalIncome - totalExpense;

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
        <p className="text-muted-foreground mt-1">Resumen financiero general</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Trabajadores Activos"
          value={activeWorkers.length}
          icon={Users}
          trendLabel={`${workers.length} total`}
        />
        <StatsCard
          title="Total Planilla"
          value={formatCurrency(totalPayroll)}
          icon={Wallet}
          trendLabel={`${activeWorkers.length} activos`}
        />
        <StatsCard
          title="Total Ingresos"
          value={formatCurrency(totalIncome)}
          icon={TrendingUp}
          trend="up"
          trendLabel={`${incomes.length} registros`}
        />
        <StatsCard
          title="Total Gastos"
          value={formatCurrency(totalExpense)}
          icon={TrendingDown}
          trend="down"
          trendLabel={`${expenses.length} registros`}
        />
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
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Bar dataKey="Ingresos" fill="hsl(167, 72%, 46%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Gastos" fill="hsl(0, 84%, 60%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No hay datos para graficar
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Balance General</h3>
          <div className="space-y-6">
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-2">Balance Actual</p>
              <p className={`text-4xl font-bold ${balance >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {formatCurrency(balance)}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50">
                <span className="text-sm font-medium text-emerald-700">Ingresos</span>
                <span className="font-bold text-emerald-600">{formatCurrency(totalIncome)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-red-50">
                <span className="text-sm font-medium text-red-700">Gastos</span>
                <span className="font-bold text-red-500">{formatCurrency(totalExpense)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-primary/5">
                <span className="text-sm font-medium">Planilla</span>
                <span className="font-bold text-primary">{formatCurrency(totalPayroll)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}