import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PayrollForm from "@/components/payroll/PayrollForm";
import PayrollTable from "@/components/payroll/PayrollTable";

export default function Payroll() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: workers = [] } = useQuery({
    queryKey: ["workers"],
    queryFn: () => base44.entities.Worker.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Worker.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workers"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Worker.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workers"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Worker.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workers"] }),
  });

  const handleSubmit = (data) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
    setEditing(null);
  };

  const handleEdit = (worker) => {
    setEditing(worker);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Planilla</h1>
          <p className="text-muted-foreground mt-1">Gestiona los pagos de tus trabajadores</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Agregar Trabajador
        </Button>
      </div>

      <PayrollTable
        workers={workers}
        onEdit={handleEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      <PayrollForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        editingWorker={editing}
      />
    </div>
  );
}