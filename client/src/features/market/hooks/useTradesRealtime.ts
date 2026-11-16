import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { Tables } from '@/shared/api/database.types'
import { supabase } from '@/shared/api/supabase'
import { TRADES_LIMIT, tradesQueryOptions } from '../api/trades'

// Nghe lần khớp mới của một mã, chèn lên đầu cache và giữ 30 dòng
export function useTradesRealtime(stockId: number) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const { queryKey } = tradesQueryOptions(stockId)
    const channel = supabase
      .channel(`trades-${stockId}-${crypto.randomUUID()}`)
      .on<Tables<'trades'>>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trades',
          filter: `stock_id=eq.${stockId}`,
        },
        ({ new: row }) => {
          queryClient.setQueryData(queryKey, (old = []) => {
            if (old.some((trade) => trade.id === row.id)) return old
            const trade = {
              id: row.id,
              price: row.price,
              volume: row.volume,
              side: row.side,
              created_at: row.created_at,
            }
            return [trade, ...old].slice(0, TRADES_LIMIT)
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, stockId])
}
