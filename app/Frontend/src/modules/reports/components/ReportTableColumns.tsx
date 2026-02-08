import type { ColumnDef } from "@tanstack/react-table"
import type { ReportModel } from "../types/report.types"
import { formatCurrency } from "../../../shared/utils/currency"

const formatPeriod = (period: string) => {
  const [year, month] = period.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric"
  })
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  })
}

export const reportTableColumns: ColumnDef<ReportModel>[] = [
  {
    accessorKey: "period",
    header: "Periodo",
    cell: ({ row }) => (
      <div className="font-medium">
        {formatPeriod(row.getValue("period"))}
      </div>
    ),
  },
  {
    accessorKey: "totalIncome",
    header: "Ingresos Totales",
    cell: ({ row }) => (
      <div className="text-green-600 font-semibold">
        {formatCurrency(row.getValue("totalIncome"))}
      </div>
    ),
  },
  {
    accessorKey: "totalExpenses",
    header: "Gastos Totales",
    cell: ({ row }) => (
      <div className="text-red-600 font-semibold">
        {formatCurrency(row.getValue("totalExpenses"))}
      </div>
    ),
  },
  {
    accessorKey: "balance",
    header: "Balance Neto",
    cell: ({ row }) => {
      const balance = row.getValue("balance") as number
      return (
        <div className={`font-semibold ${
          balance >= 0 ? "text-green-600" : "text-red-600"
        }`}>
          {formatCurrency(balance)}
        </div>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Fecha de Generación",
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {formatDate(row.getValue("createdAt"))}
      </div>
    ),
  },
  {
    accessorKey: "savings",
    header: "Ahorros",
    cell: ({ row }) => {
      const savings = row.getValue("savings") as number
      return (
        <div className={`font-medium ${
          savings > 0 ? "text-blue-600" : "text-gray-600"
        }`}>
          {formatCurrency(savings)}
        </div>
      )
    },
  },
]