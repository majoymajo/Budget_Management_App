import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getTransactionsByUser, createTransaction } from "../services/transactionService"
import type { TransactionFormData } from "../types/transaction.types"
import { toast } from "sonner"
import { useUserStore } from "@/modules/auth"

export function useTransactions(period?: string) {
  const { user} = useUserStore()
  if (!user) return null

  const queryClient = useQueryClient()

  const transactionsQuery = useQuery({
    queryKey: ["transactions", period],
    queryFn: () => getTransactionsByUser(user.uid, period),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  })

  const createTransactionMutation = useMutation({
    mutationFn: (data: TransactionFormData) => createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      toast.success("Transacción creada con éxito")
    },
    onError: (error: any) => {
      toast.error(`Error al crear transacción: ${error.message}`)
    },
  })

  return {
    transactions: transactionsQuery.data || [],
    isLoading: transactionsQuery.isLoading,
    error: transactionsQuery.error,
    createTransaction: createTransactionMutation.mutate,
    isCreating: createTransactionMutation.isPending,
  }
}