import type { QueryData } from '@supabase/supabase-js'
import { queryOptions } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'

const BOARD_FIELDS =
  'id, symbol, name, ref_price, ceiling_price, floor_price, price, volume, last_volume, high_price, low_price, total_value, bid_prices, bid_volumes, ask_prices, ask_volumes, foreign_limit, foreign_room, loan_rate, exchanges(code)'

const boardQuery = () =>
  supabase.from('stocks').select(BOARD_FIELDS).order('symbol')

export type BoardStock = QueryData<ReturnType<typeof boardQuery>>[number]
export const stocksQueryOptions = () =>
  queryOptions({
    queryKey: ['stocks'],
    queryFn: async () => {
      const { data, error } = await boardQuery()
      if (error) throw error
      return data
    },
  })
