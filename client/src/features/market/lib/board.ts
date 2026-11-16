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

export type BookLevel = {
  bidPrice?: number
  bidVolume?: number
  askPrice?: number
  askVolume?: number
}

export type BookSummary = {
  levels: BookLevel[] // dòng 1 = giá mua cao nhất và giá bán thấp nhất
  bidTotal: number
  askTotal: number
  bidRatio: number // tỷ lệ KL dư mua trên tổng hai bên, 0..1
  maxVolume: number // KL lớn nhất trong sổ, để vẽ thanh nền
}

// Gom 3 bước giá mỗi bên thành từng dòng và tính tổng dư mua/dư bán
export function bookSummary(
  stock: Pick<
    BoardStock,
    'bid_prices' | 'bid_volumes' | 'ask_prices' | 'ask_volumes'
  >,
  depth = 3,
): BookSummary {
  const sum = (list: number[]) => list.reduce((a, b) => a + b, 0)
  const bidTotal = sum(stock.bid_volumes)
  const askTotal = sum(stock.ask_volumes)
  const total = bidTotal + askTotal
  const levels = Array.from({ length: depth }, (_, i) => ({
    bidPrice: stock.bid_prices[i],
    bidVolume: stock.bid_volumes[i],
    askPrice: stock.ask_prices[i],
    askVolume: stock.ask_volumes[i],
  }))
  return {
    levels,
    bidTotal,
    askTotal,
    bidRatio: total > 0 ? bidTotal / total : 0.5,
    maxVolume: Math.max(0, ...stock.bid_volumes, ...stock.ask_volumes),
  }
}

// Tổng KL mua chủ động / bán chủ động trong danh sách khớp lệnh
export function sideTotals(
  trades: { side: 'BUY' | 'SELL'; volume: number }[],
): Record<'BUY' | 'SELL', number> {
  const totals = { BUY: 0, SELL: 0 }
  for (const trade of trades) totals[trade.side] += trade.volume
  return totals
}
