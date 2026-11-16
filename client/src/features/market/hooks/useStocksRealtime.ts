import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { Tables } from '@/shared/api/database.types'
import { supabase } from '@/shared/api/supabase'
import { stocksQueryOptions } from '../api/stocks'

export function useStocksRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const { queryKey } = stocksQueryOptions()
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
