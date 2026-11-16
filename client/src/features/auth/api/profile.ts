import { queryOptions } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'

export const profileQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, full_name, cash_balance, account_no, kyc_verified_at, phone, id_number, date_of_birth, gender, id_issued_on, created_at',
        )
        .eq('id', userId)
        .single()
      if (error) throw error
      return data
    },
  })
