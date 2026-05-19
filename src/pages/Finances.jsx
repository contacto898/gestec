import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import FinanceForm from "@/components/finance/FinanceForm";
import FinanceTable from "@/components/finance/FinanceTable";
import MonthlySummary from "@/components/finance/MonthlySummary";

export default function Finances() {
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState("income");
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: incomes = [] } = useQuery({
    queryKey: ["incomes"],
    queryFn: () => base44.entities.Income.list("-created_date"),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list("-created_date"),
  });

  const createIncome = useMutation({
    mutationFn: (data) => base44.entities.Income.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incomes"] }),
  });
  const updateIncome = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Income.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incomes"] }),
  });
  const deleteIncome = useMutation({
    mutationFn: (id) => base44.entities.Income.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incomes"] }),
  });

  const createExpense = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });
  const updateExpense = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Expense.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });
  const deleteExpense = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const handleSubmit = (data) => {
    if (formType === "income") {
      editing ? updateIncome.mutate({ id: editing.id, data }) : createIncome.mutate(data);
    } else {
      editing ? updateExpense.mutate({ id: editing.id, data }) : createExpense.mutate(data);
    }
    setEditing(null);
  };

  const openForm = (type) => {
    setFormType(type);
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (item, type) => {
    setFormType(type);
    setEditing(item);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Ingresos y Gastos</h1>
          <p className="text-muted-foreground mt-1">Control financiero mensual con acumulado</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openForm("income")} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4" /> Ingreso
          </Button>
          <Button onClick={() => openForm("expense")} variant="destructive" className="gap-2">
            <Plus className="w-4 h-4" /> Gasto
          </Button>
        </div>
      </div>

      <MonthlySummary incomes={incomes} expenses={expenses} />

      <Tabs defaultValue="incomes">
        <TabsList className="mb-4">
          <TabsTrigger value="incomes" className="gap-2">
            <TrendingUp className="w-4 h-4" /> Ingresos
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2">
            <TrendingDown className="w-4 h-4" /> Gastos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="incomes">
          <FinanceTable
            items={incomes}
            type="income"
            onEdit={(item) => handleEdit(item, "income")}
            onDelete={(id) => deleteIncome.mutate(id)}
          />
        </TabsContent>
        <TabsContent value="expenses">
          <FinanceTable
            items={expenses}
            type="expense"
            onEdit={(item) => handleEdit(item, "expense")}
            onDelete={(id) => deleteExpense.mutate(id)}
          />
        </TabsContent>
      </Tabs>

      <FinanceForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        type={formType}
        editing={editing}
      />
    </div>
  );
}