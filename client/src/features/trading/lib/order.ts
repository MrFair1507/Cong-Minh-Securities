// Hàm thuần cho đặt lệnh và lịch sử lệnh (test được bằng Vitest ở tuần 3).
import type { OrderSide } from '@cms/shared/trading'
import { LOT_SIZE } from '@/shared/constants/market'

// Ô khối lượng cho gõ "1.000" (dấu chấm ngăn nghìn). Không phải số nguyên dương thì trả 0.
export function parseQuantity(text: string): number {
  const digits = text.trim().replaceAll('.', '')
  return /^\d+$/.test(digits) ? Number(digits) : 0
}

export function isLotQuantity(quantity: number): boolean {
  return quantity > 0 && quantity % LOT_SIZE === 0
}

type FilterableOrder = { side: OrderSide; stocks: { symbol: string } }

// Lọc lịch sử lệnh theo chiều lệnh và mã (khớp đầu mã, không phân biệt hoa thường)
export function filterOrders<T extends FilterableOrder>(
  orders: T[],
  side: OrderSide | undefined,
  symbol: string | undefined,
): T[] {
  const q = symbol?.trim().toUpperCase()
  return orders.filter(
    (order) =>
      (!side || order.side === side) &&
      (!q || order.stocks.symbol.startsWith(q)),
  )
}

// Nút 25/50/75/100%: lấy tỷ lệ của KL tối đa rồi làm tròn xuống bội số lô
export function quickQuantity(max: number, ratio: number, lot: number): number {
  return Math.floor((max * ratio) / lot) * lot
}

// Nút −/+: lên/xuống một lô tới bội số kế tiếp (150 → 200 hoặc 100), kẹp trong 0..max
export function stepQuantity(
  quantity: number,
  direction: 1 | -1,
  max: number,
): number {
  const next =
    direction > 0
      ? Math.floor(quantity / LOT_SIZE) * LOT_SIZE + LOT_SIZE
      : Math.ceil(quantity / LOT_SIZE) * LOT_SIZE - LOT_SIZE
  return Math.min(Math.max(next, 0), Math.max(max, 0))
}
