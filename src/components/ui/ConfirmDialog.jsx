import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

/**
 * Reusable confirm dialog replacing window.confirm.
 * Props: open, onOpenChange, title, description, onConfirm, confirmLabel, destructive
 */
export default function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, confirmLabel = "Confirmar", destructive = false }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl max-w-sm p-6 gap-4">
        <AlertDialogHeader className="gap-2">
          <AlertDialogTitle className="text-lg font-semibold text-foreground">{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row justify-end gap-2 mt-2">
          <AlertDialogCancel className="rounded-lg border border-input bg-background hover:bg-muted text-sm font-medium px-4">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={`rounded-lg text-sm font-medium px-4 ${destructive ? "bg-destructive text-white hover:bg-destructive/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}