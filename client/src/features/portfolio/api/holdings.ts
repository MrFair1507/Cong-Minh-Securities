import { queryOptions } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'

// Số cổ phiếu đang giữ của một mã. RLS chỉ trả dòng của chính người dùng; chưa mua thì null.
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
