import type { QueryData } from '@supabase/supabase-js'
import { queryOptions } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'

// Danh sách ngân hàng mô phỏng (ít khi đổi)
export const banksQueryOptions = () =>
  queryOptions({
    queryKey: ['banks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banks')
        .select('code, name')
        .order('sort_order')
      if (error) throw error
      return data
    },
    staleTime: Number.POSITIVE_INFINITY,
  })

export type Bank = { code: string; name: string }

const bankLinksQuery = (userId: string) =>
  supabase
    .from('bank_links')
    .select('id, bank_code, account_no, holder_name, balance, created_at')
    .eq('user_id', userId)
    .is('unlinked_at', null)
    .order('id')

export type BankLink = QueryData<ReturnType<typeof bankLinksQuery>>[number]

// Các tài khoản ngân hàng đang liên kết (đã hủy thì không hiện)
export const bankLinksQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['bank-links', userId],
    queryFn: async () => {
      const { data, error } = await bankLinksQuery(userId)
      if (error) throw error
      return data
    },
  })

// Tên ngân hàng theo mã; không có trong danh sách thì hiện mã
export function bankName(banks: Bank[] | undefined, code: string): string {
  return banks?.find((bank) => bank.code === code)?.name ?? code
}
