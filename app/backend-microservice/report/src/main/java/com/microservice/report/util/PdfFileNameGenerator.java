package com.microservice.report.util;

/**
 * Utilidad para generar nombres de archivo PDF con formato estandarizado.
 *
 * <p>Formato esperado: {@code reporte-yyyy-MM.pdf}</p>
 * <p>Ejemplo: Para el período {@code "2025-01"} → {@code "reporte-2025-01.pdf"}</p>
 *
 * <p><strong>Historia de usuario:</strong> US-021 — Valor Límite BV3 (Formato de nombre de archivo)</p>
 */
public class PdfFileNameGenerator {

    /**
     * Genera el nombre de archivo PDF para un reporte de período individual.
     *
     * @param period período en formato {@code "yyyy-MM"}
     * @return nombre del archivo con formato {@code "reporte-yyyy-MM.pdf"}
     * @throws UnsupportedOperationException siempre — stub TDD pendiente de implementación (fase RED)
     */
    public static String generateFileName(String period) {
        // TODO: US-021-E1 GREEN — Implementar generación de nombre de archivo
        throw new UnsupportedOperationException("Pendiente de implementación — fase RED TDD");
    }
}
