// Hàm thuần cho bảng giá (test được bằng Vitest ở tuần 3).
import type { BoardStock } from '../api/stocks'

export type PriceTone = 'ceil' | 'floor' | 'ref' | 'up' | 'down'

type PriceLimits = Pick<
  BoardStock,
  'ref_price' | 'ceiling_price' | 'floor_price'
>

// Quy ước màu công khai của thị trường: trần tím, sàn xanh lơ, tham chiếu vàng, tăng xanh, giảm đỏ
export function priceTone(price: number, limits: PriceLimits): PriceTone {
  if (price >= limits.ceiling_price) return 'ceil'
  if (price <= limits.floor_price) return 'floor'
  if (price > limits.ref_price) return 'up'
  if (price < limits.ref_price) return 'down'
  return 'ref'
}

// Viết đủ tên class để Tailwind quét được
export const TONE_CLASS: Record<PriceTone, string> = {
  ceil: 'text-price-ceil',
  floor: 'text-price-floor',
  ref: 'text-price-ref',
  up: 'text-price-up',
  down: 'text-price-down',
}

export function toneClass(price: number | undefined, limits: PriceLimits) {
  return price === undefined ? undefined : TONE_CLASS[priceTone(price, limits)]
}

// Giá bình quân trong phiên = tổng giá trị khớp / tổng KL
export function averagePrice(stock: BoardStock): number | undefined {
  return stock.volume > 0 ? stock.total_value / stock.volume : undefined
}

// Lọc theo sàn và từ khóa mã (không phân biệt hoa thường)
export function filterStocks(
  stocks: BoardStock[],
  exchange: string | undefined,
  keyword: string | undefined,
): BoardStock[] {
  const q = keyword?.trim().toUpperCase()
  return stocks.filter(
    (s) =>
      (!exchange || s.exchanges.code === exchange) &&
      (!q || s.symbol.includes(q)),
  )
}
