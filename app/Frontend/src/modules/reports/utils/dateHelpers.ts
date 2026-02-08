/**
 * Date helpers para el módulo de reports
 */

/**
 * Obtiene el rango de fechas del último año (desde hace 12 meses hasta el mes actual)
 * @returns Objeto con startPeriod y endPeriod en formato YYYY-MM
 */
export const getLastYearRange = (): { startPeriod: string; endPeriod: string } => {
  const now = new Date();
  const endMonth = new Date(now.getFullYear(), now.getMonth(), 1); // Mes actual
  
  // Mes de hace 12 meses (inclusive)
  const startMonth = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  return {
    startPeriod: formatDate(startMonth),
    endPeriod: formatDate(endMonth),
  };
};

/**
 * Obtiene el rango del mes actual
 * @returns Objeto con startPeriod y endPeriod del mes actual en formato YYYY-MM
 */
export const getCurrentMonthRange = (): { startPeriod: string; endPeriod: string } => {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const period = formatDate(currentMonth);
  return {
    startPeriod: period,
    endPeriod: period,
  };
};

/**
 * Convierte un período YYYY-MM a Date (primer día del mes)
 * @param period - Período en formato YYYY-MM
 * @returns Date del primer día del mes
 */
export const periodToDate = (period: string): Date | null => {
  if (!period) return null;
  
  const [year, month] = period.split('-').map(Number);
  if (isNaN(year) || isNaN(month)) return null;
  
  return new Date(year, month - 1, 1);
};

/**
 * Convierte una lista de períodos a rango (primero y último)
 * @param periods - Array de períodos en formato YYYY-MM
 * @returns Objeto con startPeriod y endPeriod
 */
export const periodsToRange = (periods: string[]): { startPeriod: string; endPeriod: string } => {
  if (!periods || periods.length === 0) {
    return getLastYearRange();
  }
  
  // Ordenar períodos y tomar el primero y el último
  const sortedPeriods = [...periods].sort();
  const startPeriod = sortedPeriods[0];
  const endPeriod = sortedPeriods[sortedPeriods.length - 1];
  
  return { startPeriod, endPeriod };
};