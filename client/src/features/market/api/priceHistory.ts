import type { QueryData } from '@supabase/supabase-js'
import { queryOptions } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'

// Nến ngày của một mã, cũ đến mới: lịch sử seed + nến hôm nay do simulator ghi
const historyQuery = (stockId: number) =>
  supabase
    .from('price_history')
    .select('trade_date, open, high, low, close, volume')
    .eq('stock_id', stockId)
    .order('trade_date')

export type PriceHistoryRow = QueryData<ReturnType<typeof historyQuery>>[number]

export const priceHistoryQueryOptions = (stockId: number) =>
  queryOptions({
    queryKey: ['price-history', stockId],
    queryFn: async () => {
      const { data, error } = await historyQuery(stockId)
      if (error) throw error
      return data
    },
  })
