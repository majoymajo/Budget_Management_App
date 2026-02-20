import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import { Button } from "../../../components/ui/button"

interface DeleteReportDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending: boolean
  period: string
}

/**
 * Diálogo de confirmación para eliminar reportes financieros.
 * Muestra el período del reporte a eliminar y requiere confirmación explícita.
 */
export function DeleteReportDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  isPending,
  period,
}: DeleteReportDialogProps) {
  const formattedPeriod = period
    ? new Date(period + '-01').toLocaleDateString("es-CO", {
        month: "long",
        year: "numeric"
      })
    : ''

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar reporte?</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente el reporte del período{" "}
            <span className="font-semibold text-foreground">{formattedPeriod}</span>.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Eliminando..." : "Eliminar reporte"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
