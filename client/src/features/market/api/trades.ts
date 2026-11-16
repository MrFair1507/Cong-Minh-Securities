import type { QueryData } from '@supabase/supabase-js'
import { queryOptions } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'

export const TRADES_LIMIT = 30 // số lần khớp gần nhất giữ trong cache

const tradesQuery = (stockId: number) =>
  supabase
    .from('trades')
    .select('id, price, volume, side, created_at')
    .eq('stock_id', stockId)
    .order('id', { ascending: false })
    .limit(TRADES_LIMIT)

export type Trade = QueryData<ReturnType<typeof tradesQuery>>[number]

export const tradesQueryOptions = (stockId: number) =>
  queryOptions({
    queryKey: ['trades', stockId],
    queryFn: async () => {
      const { data, error } = await tradesQuery(stockId)
      if (error) throw error
      return data
    },
  })
