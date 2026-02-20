import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteReport } from "../services/reportService";

export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (period: string) => deleteReport(period),
    onSuccess: () => {
      // Invalida la query de reportes para refrescar la lista sin recargar la página
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Reporte eliminado con éxito");
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      
      console.error("[useDeleteReport Error]", error);

      if (status === 404) {
        toast.error("El reporte que intentas eliminar no existe o ya fue eliminado.");
      } else if (status === 422) {
        toast.error("No se puede eliminar el reporte para un periodo protegido o con transacciones activas.");
      } else {
        toast.error("Ocurrió un error al intentar eliminar el reporte. Intenta de nuevo más tarde.");
      }
    },
  });
}
