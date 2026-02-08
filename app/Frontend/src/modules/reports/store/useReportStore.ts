import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ReportModel, ReportFilters } from '../types/report.types';
import { getLastYearRange } from '../utils/dateHelpers';

interface ReportState {
    currentReport: ReportModel | null;
    filters: ReportFilters;

    setCurrentReport: (report: ReportModel | null) => void;
    setFilters: (filters: ReportFilters) => void;
    clearReportData: () => void;
}

// Obtener rango por defecto del último año
const defaultFilters = getLastYearRange();

export const useReportStore = create<ReportState>()(
    devtools(
        (set) => ({
            currentReport: null,
            filters: {
                startPeriod: defaultFilters.startPeriod,
                endPeriod: defaultFilters.endPeriod,
            },

            setCurrentReport: (report) =>
                set({ currentReport: report }, false, 'setCurrentReport'),

            setFilters: (filters) =>
                set({ filters: { ...filters } }, false, 'setFilters'),

            clearReportData: () =>
                set(
                    { 
                        currentReport: null, 
                        filters: {
                            startPeriod: defaultFilters.startPeriod,
                            endPeriod: defaultFilters.endPeriod,
                        }
                    },
                    false,
                    'clearReportData'
                ),
        }),
        { name: 'Report Store' }
    )
);