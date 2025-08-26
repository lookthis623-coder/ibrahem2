import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../utils/supabase'
import type { TransactionIncome, TransactionExpense, Product } from '../types'

export function useIncomeTransactions(clientId: number) {
  return useQuery({
    queryKey: ['incomeTransactions', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions_income')
        .select('*')
        .eq('client_id', clientId)
        .order('timestamp', { ascending: false })

      if (error) throw error
      return data as TransactionIncome[]
    },
  })
}

export function useExpenseTransactions(clientId: number) {
  return useQuery({
    queryKey: ['expenseTransactions', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions_expense')
        .select('*')
        .eq('client_id', clientId)
        .order('timestamp', { ascending: false })

      if (error) throw error
      return data as TransactionExpense[]
    },
  })
}

export function useProducts(clientId: number) {
  return useQuery({
    queryKey: ['products', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('client_id', clientId)
        .order('name', { ascending: true })

      if (error) throw error
      return data as Product[]
    },
  })
}

export function useAddIncomeTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (transaction: Omit<TransactionIncome, 'id'>) => {
      const { data, error } = await supabase
        .from('transactions_income')
        .insert([transaction])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['incomeTransactions', variables.client_id],
      })
    },
  })
}

export function useAddExpenseTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (transaction: Omit<TransactionExpense, 'id'>) => {
      const { data, error } = await supabase
        .from('transactions_expense')
        .insert([transaction])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['expenseTransactions', variables.client_id],
      })
    },
  })
}

export function useAddProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['products', variables.client_id],
      })
    },
  })
}
