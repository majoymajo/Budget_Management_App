# TDD-US21 — Descargar Reporte de un Período como PDF

> **Historia de Usuario:** US-021  
> **Fase TDD:** 🔴 RED (Tests que fallan)  
> **Fecha:** 2026-02-19  
> **Autor:** Equipo de Desarrollo  

---

## 1. Objetivo

Implementar la fase **🔴 RED** del ciclo TDD para la funcionalidad de descarga de reportes financieros en formato PDF. En esta fase se escriben los tests **antes** de la implementación, garantizando que todos fallen inicialmente.

### Valores Límite Cubiertos (según TEST_PLAN.md §2.2)

| Valor Límite | Descripción | Resultado esperado |
|---|---|---|
| BV1 — Reporte con todos los campos en `$0.00` | Contenido mínimo | PDF generado con valores en $0.00 |
| BV2 — Reporte con montos muy grandes (`$9,999,999.99`) | Límite superior de representación | PDF generado sin desbordamiento visual |
| BV3 — Nombre de archivo con período `"2025-01"` | Formato estándar | Archivo: `reporte-2025-01.pdf` |
| BV4 — Descarga inmediatamente después de recalculación | Dependencia temporal | PDF refleja datos recalculados más recientes |

---

## 2. Archivos de Producción Creados (Stubs)

### 2.1 `PdfGeneratorService.java` — Interface del Servicio de PDF

**Ruta:** `src/main/java/com/microservice/report/service/PdfGeneratorService.java`

**¿Qué hace?**  
Define el **contrato** (interface) que cualquier implementación de generación de PDF debe cumplir. Declara un único método:

```java
byte[] generatePdf(Report report);
```

- Recibe una entidad `Report` con los datos financieros del período.
- Retorna un arreglo de bytes (`byte[]`) que representa el contenido del archivo PDF.
- Aún no tiene implementación concreta → esto es intencional en la fase RED.

**¿Por qué se creó?**  
Los tests necesitan referenciar este tipo para compilar. Sin la interface, los tests no pueden declarar mocks ni invocar el método `generatePdf()`.

---

### 2.2 `PdfGenerationException.java` — Excepción de Dominio

**Ruta:** `src/main/java/com/microservice/report/exception/PdfGenerationException.java`

**¿Qué hace?**  
Es una excepción personalizada (`RuntimeException`) que se lanza cuando la generación de un PDF falla por un error del sistema. Tiene dos constructores:

```java
public PdfGenerationException(String message)
public PdfGenerationException(String message, Throwable cause)
```

**¿Por qué se creó?**  
El **Escenario E4** (Error interno durante generación) requiere que los tests verifiquen que esta excepción se lanza correctamente cuando hay un fallo. Sin esta clase, el test `ReportPdfControllerTest.ErrorInterno` no compilaría.

---

### 2.3 `PdfFileNameGenerator.java` — Utilidad para Nombres de Archivo

**Ruta:** `src/main/java/com/microservice/report/util/PdfFileNameGenerator.java`

**¿Qué hace?**  
Es un stub (esqueleto) de la utilidad que generará nombres de archivo PDF con formato `reporte-yyyy-MM.pdf`. Actualmente el método **siempre lanza** `UnsupportedOperationException`:

```java
public static String generateFileName(String period) {
    throw new UnsupportedOperationException("Pendiente de implementación — fase RED TDD");
}
```

**¿Por qué lanza excepción?**  
Esto es parte del ciclo TDD: el código existe solo para que los tests compilen, pero **falla intencionalmente**. En la fase 🟢 GREEN, se reemplazará con la lógica real `return "reporte-" + period + ".pdf";`.

---

## 3. Archivos de Test Creados (🔴 RED)

### 3.1 `PdfGeneratorServiceTest.java` — Tests del Servicio de PDF

**Ruta:** `src/test/java/com/microservice/report/service/PdfGeneratorServiceTest.java`

**¿Qué hace?**  
Contiene **6 tests unitarios** organizados en 4 grupos (`@Nested`):

| Grupo | Test | Escenario / Valor Límite | Qué verifica |
|---|---|---|---|
| `DescargaExitosa` | `generatePdf_conReporteValido_retornaPdfNoVacio` | E1 | Que el PDF generado no sea `null` ni vacío |
| `DescargaExitosa` | `generatePdf_conReporteValido_comienzaConFirmaPdf` | E1 | Que los primeros bytes del archivo sean `%PDF-` (firma estándar de PDF) |
| `ContenidoMinimo` | `generatePdf_conTotalesEnCero_generaPdfValido` | BV1 | Que un reporte con `$0.00` en todos los campos genera un PDF válido |
| `MontosGrandes` | `generatePdf_conMontosGrandes_generaPdfSinDesbordamiento` | BV2 | Que montos de `$9,999,999.99` no causan desbordamiento |
| `MontosGrandes` | `generatePdf_conBalanceNegativoGrande_generaPdfValido` | BV2 | Que un balance extremadamente negativo no rompe la generación |
| `DatosRecalculados` | `generatePdf_conDatosRecalculados_reflejaDatosRecientes` | BV4 | Que el PDF usa los valores post-recalculación (no datos cacheados) |

**¿Por qué fallan?**  
Todos los tests intentan instanciar `PdfGeneratorServiceImpl` mediante reflexión (`Class.forName`). Como esa clase **no existe todavía**, el `Class.forName` lanza `ClassNotFoundException` y el test ejecuta `fail()` con el mensaje:

> *"🔴 RED: La implementación PdfGeneratorServiceImpl no existe todavía. Implementar en la fase GREEN."*

#### 📸 Captura de pantalla — Fallos de `PdfGeneratorServiceTest`

<!-- INSTRUCCIÓN: Pegar aquí la captura de pantalla mostrando los 6 tests fallidos -->



---

### 3.2 `PdfFileNameGeneratorTest.java` — Tests del Generador de Nombres

**Ruta:** `src/test/java/com/microservice/report/util/PdfFileNameGeneratorTest.java`

**¿Qué hace?**  
Contiene **3 tests unitarios** para el **Valor Límite BV3** (formato de nombre de archivo):

| Test | Entrada | Resultado esperado |
|---|---|---|
| `generateFileName_conPeriodo2025_01_retornaFormatoCorrecto` | `"2025-01"` | `"reporte-2025-01.pdf"` |
| `generateFileName_conPeriodo2026_12_retornaFormatoCorrecto` | `"2026-12"` | `"reporte-2026-12.pdf"` |
| `generateFileName_conPeriodoIntermedio_retornaFormatoCorrecto` | `"2025-06"` | `"reporte-2025-06.pdf"` |

**¿Por qué fallan?**  
El método `PdfFileNameGenerator.generateFileName()` es un stub que lanza `UnsupportedOperationException`. Los tests esperan un `String` como retorno, pero reciben la excepción:

> *"UnsupportedOperationException: Pendiente de implementación — fase RED TDD"*

#### 📸 Captura de pantalla — Fallos de `PdfFileNameGeneratorTest`

<!-- INSTRUCCIÓN: Pegar aquí la captura de pantalla mostrando los 3 tests con error -->



---

### 3.3 `ReportPdfControllerTest.java` — Tests del Controlador REST

**Ruta:** `src/test/java/com/microservice/report/controller/ReportPdfControllerTest.java`

**¿Qué hace?**  
Contiene **4 tests unitarios** organizados en 3 grupos que validan la lógica de orquestación:

| Grupo | Test | Escenario | Qué verifica |
|---|---|---|---|
| `ReporteInexistente` | `downloadPdf_conReporteInexistente_lanzaReportNotFoundException` | E3 | Que se lanza `ReportNotFoundException` cuando el reporte no existe, y que el generador de PDF **nunca** se invoca |
| `ErrorInterno` | `downloadPdf_conErrorDeGeneracion_lanzaPdfGenerationException` | E4 | Que se lanza `PdfGenerationException` cuando la generación falla |
| `ErrorInterno` | `downloadPdf_conErrorDeGeneracion_reportePermaneceIntacto` | E4 | Que los datos del reporte (`totalIncome`, `totalExpense`, `balance`) **no se modifican** tras un error de PDF |
| `UsuarioNoAutenticado` | `downloadPdf_sinUsuarioAutenticado_accesoDenegado` | E5 | Que con `userId = null` se rechaza la operación y no se ejecuta ninguna consulta |

**¿Estos tests pasan o fallan?**  
Estos 4 tests **pasan** ✅ porque validan la lógica de orquestación usando mocks de Mockito (`@Mock`). No dependen de implementaciones concretas que no existan. Sin embargo, **no** validan un controlador REST real (no hay MockMvc), lo cual se implementará en la fase GREEN.

#### 📸 Captura de pantalla — Resultados de `ReportPdfControllerTest`

<!-- INSTRUCCIÓN: Pegar aquí la captura de pantalla mostrando los 4 tests pasados (verde) -->



---

## 4. Resumen de Ejecución

### Comando ejecutado

```bash
.\mvnw.cmd test "-Dtest=PdfGeneratorServiceTest,PdfFileNameGeneratorTest,ReportPdfControllerTest"
```

### Resultado global

```
Tests run: 13, Failures: 6, Errors: 3, Skipped: 0
BUILD FAILURE
```

| Clase de Test | Tests | ✅ Pasaron | ❌ Fallaron | Tipo de fallo |
|---|---|---|---|---|
| `PdfGeneratorServiceTest` | 6 | 0 | 6 | `AssertionFailedError` — implementación no existe |
| `PdfFileNameGeneratorTest` | 3 | 0 | 3 | `UnsupportedOperationException` — stub sin implementar |
| `ReportPdfControllerTest` | 4 | 4 | 0 | N/A — validan lógica con mocks |
| **Total** | **13** | **4** | **9** | — |

#### 📸 Captura de pantalla — Resultado global de Maven

<!-- INSTRUCCIÓN: Pegar aquí la captura de pantalla del terminal mostrando el resultado BUILD FAILURE -->



---

## 5. Conclusión de la Fase RED

| Criterio | Estado |
|---|---|
| ¿Los tests compilan? | ✅ Sí |
| ¿Los tests de servicio fallan? | ✅ 6/6 fallan (esperado) |
| ¿Los tests de utilidad fallan? | ✅ 3/3 fallan (esperado) |
| ¿Los tests de controlador validan lógica? | ✅ 4/4 pasan (mocks) |
| ¿Existe implementación de producción? | ❌ No — solo stubs e interfaces |

> **Fase 🔴 RED confirmada.** Todos los tests que dependen de implementaciones reales fallan correctamente. El próximo paso es la fase 🟢 GREEN: implementar el código mínimo para que los 9 tests que fallan empiecen a pasar.

---

## 6. Próximo Paso — Fase 🟢 GREEN

**Commit sugerido para esta fase RED:**
```
test: US-021-E1 descarga exitosa de PDF con valores límite
```

**Acciones para la fase GREEN:**
1. Agregar dependencia de librería PDF al `pom.xml` (e.g., Apache PDFBox o iText)
2. Implementar `PdfGeneratorServiceImpl` que genere PDFs reales
3. Implementar `PdfFileNameGenerator.generateFileName()` con la lógica real
4. Crear endpoint REST `GET /api/v1/reports/{userId}/pdf?period=yyyy-MM`
5. Re-ejecutar todos los tests → los 13 deben **pasar**

**Commit sugerido para la fase GREEN:**
```
feat: US-021-E1 implementar generación de PDF
```
