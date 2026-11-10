import { queryOptions } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'

export const profileQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, cash_balance')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data
    },
  })
