import type { OrderSide } from '@cms/shared/trading'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'

export type PlaceOrderInput = {
  symbol: string
  side: OrderSide
  quantity: number
}

// Mã lỗi RPC place_order trả trong message (raise exception 'INSUFFICIENT_CASH')
const ERROR_CODES = [
  'NOT_AUTHENTICATED',
  'INVALID_QUANTITY',
  'STOCK_NOT_FOUND',
  'INSUFFICIENT_CASH',
  'INSUFFICIENT_SHARES',
] as const

export type PlaceOrderErrorCode = (typeof ERROR_CODES)[number] | 'UNKNOWN'

export function placeOrderErrorCode(error: unknown): PlaceOrderErrorCode {
  const message = (error as { message?: unknown } | null)?.message
  return ERROR_CODES.find((code) => code === message) ?? 'UNKNOWN'
}

// Đặt lệnh xong thì số dư, danh mục, lịch sử lệnh, dòng tiền đều đổi
const AFFECTED_KEYS = ['profile', 'holdings', 'orders', 'cash'] as const

export function usePlaceOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ symbol, side, quantity }: PlaceOrderInput) => {
      const { data, error } = await supabase.rpc('place_order', {
        p_symbol: symbol,
        p_side: side,
        p_quantity: quantity,
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
