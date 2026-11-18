import type { QueryData } from '@supabase/supabase-js'
import { queryOptions } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'

export const holdingQueryOptions = (userId: string, stockId: number) =>
  queryOptions({
    queryKey: ['holdings', userId, stockId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('holdings')
        .select('quantity, avg_cost')
        .eq('user_id', userId)
        .eq('stock_id', stockId)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

const holdingsQuery = (userId: string) =>
  supabase
    .from('holdings')
    .select('stock_id, quantity, avg_cost')
    .eq('user_id', userId)

export type HoldingRow = QueryData<ReturnType<typeof holdingsQuery>>[number]

export const holdingsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['holdings', userId, 'all'],
    queryFn: async () => {
      const { data, error } = await holdingsQuery(userId)
      if (error) throw error
      return data
    },
  })
