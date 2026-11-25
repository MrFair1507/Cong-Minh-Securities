import type { OrderSide } from '@cms/shared/trading'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'

export type PlaceOrderInput = {
  symbol: string
  side: OrderSide
  quantity: number
  useMargin?: boolean // vay ký quỹ phần tiền mặt còn thiếu
}

const ERROR_CODES = [
  'NOT_AUTHENTICATED',
  'INVALID_QUANTITY',
  'STOCK_NOT_FOUND',
  'INSUFFICIENT_CASH',
  'INSUFFICIENT_SHARES',
  'MARGIN_ACCOUNT_REQUIRED',
  'LOAN_OVERDUE',
  'STOCK_NOT_MARGINABLE',
  'LOAN_LIMIT_EXCEEDED',
  'MARGIN_RATIO_TOO_LOW',
] as const

export type PlaceOrderErrorCode = (typeof ERROR_CODES)[number] | 'UNKNOWN'

export function placeOrderErrorCode(error: unknown): PlaceOrderErrorCode {
  const message = (error as { message?: unknown } | null)?.message
  return ERROR_CODES.find((code) => code === message) ?? 'UNKNOWN'
}

// Đặt lệnh xong thì số dư, danh mục, lịch sử lệnh, dòng tiền, khoản vay đều đổi
const AFFECTED_KEYS = [
  'profile',
  'holdings',
  'orders',
  'cash',
  'margin',
] as const

export function usePlaceOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      symbol,
      side,
      quantity,
      useMargin,
    }: PlaceOrderInput) => {
      const { data, error } = await supabase.rpc('place_order', {
        p_symbol: symbol,
        p_side: side,
        p_quantity: quantity,
        p_use_margin: useMargin ?? false,
      })
      if (error) throw error
      return data // id của lệnh
    },
    onSuccess: () =>
      Promise.all(
        AFFECTED_KEYS.map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] }),
        ),
      ),
  })
}
