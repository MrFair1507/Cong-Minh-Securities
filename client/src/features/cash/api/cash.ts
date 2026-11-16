import type { QueryData } from '@supabase/supabase-js'
import { queryOptions } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'

const CASH_FIELDS =
  'id, type, amount, balance_after, created_at, order_id, margin_loan_id, orders(quantity, stocks(symbol)), bank_links(bank_code, account_no)'

const cashQuery = (userId: string) =>
  supabase
    .from('cash_transactions')
    .select(CASH_FIELDS)
    .eq('user_id', userId)
    .order('id', { ascending: false })

export type CashRow = QueryData<ReturnType<typeof cashQuery>>[number]

export const cashQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['cash', userId],
    queryFn: async () => {
      const { data, error } = await cashQuery(userId)
      if (error) throw error
      return data
    },
  })
