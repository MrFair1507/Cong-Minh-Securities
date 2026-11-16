import type { QueryData } from '@supabase/supabase-js'
import { queryOptions } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'

// margin_loans: 1-1 với lệnh (order_id unique), null khi lệnh không vay
const ORDER_FIELDS =
  'id, side, quantity, price, fee, tax, created_at, stocks(symbol), margin_loans(principal)'

const ordersQuery = (userId: string) =>
  supabase
    .from('orders')
    .select(ORDER_FIELDS)
    .eq('user_id', userId)
    .order('id', { ascending: false })

export type OrderRow = QueryData<ReturnType<typeof ordersQuery>>[number]

// Lấy hết lệnh của người dùng (vài chục dòng), lọc và phân trang ở client
export const ordersQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['orders', userId],
    queryFn: async () => {
      const { data, error } = await ordersQuery(userId)
      if (error) throw error
      return data
    },
  })
