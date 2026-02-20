import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteReport } from "../services/reportService"
import { toast } from "sonner"

/**
 * Hook para gestionar la eliminación de reportes.
 * Invalida las queries de reportes tras una eliminación exitosa.
 */
export function useDeleteReport() {
  const queryClient = useQueryClient()

  const deleteReportMutation = useMutation({
    mutationFn: (reportId: string | number) => deleteReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] })
      toast.success("Reporte eliminado con éxito")
    },
    onError: (error: any) => {
      toast.error(`Error al eliminar reporte: ${error.message}`)
    },
  })

  return {
    mutate: deleteReportMutation.mutate,
    isPending: deleteReportMutation.isPending,
    isError: deleteReportMutation.isError,
    error: deleteReportMutation.error,
  }
}
