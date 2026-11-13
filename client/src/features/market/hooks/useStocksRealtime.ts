import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { Tables } from '@/shared/api/database.types'
import { supabase } from '@/shared/api/supabase'
import { stocksQueryOptions } from '../api/stocks'

// Nghe UPDATE trên bảng stocks (simulator ghi mỗi 3 giây) và gộp dòng mới vào cache của TanStack Query.
// Bảng giá đọc từ cache nên tự vẽ lại, không cần store riêng.
export function useStocksRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const { queryKey } = stocksQueryOptions()
    // Tên kênh riêng cho mỗi lần mount: StrictMode mount 2 lần, tránh trùng kênh cũ đang đóng
    const channel = supabase
      .channel(`stocks-board-${crypto.randomUUID()}`)
      .on<Tables<'stocks'>>(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'stocks' },
        ({ new: row }) => {
          queryClient.setQueryData(queryKey, (old) =>
            old?.map((stock) =>
              stock.id === row.id ? { ...stock, ...row } : stock,
            ),
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
