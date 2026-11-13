// Hàm thuần cho biểu đồ nến ở trang chi tiết mã (test được bằng Vitest ở tuần 3).
import type { PriceHistoryRow } from '../api/priceHistory'
import type { BoardStock } from '../api/stocks'

export type Candle = {
  time: string // 'YYYY-MM-DD', lightweight-charts nhận thẳng chuỗi ngày
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export const CHART_RANGES = ['1M', '3M', '6M', '1Y'] as const
export type ChartRange = (typeof CHART_RANGES)[number]

const RANGE_MONTHS: Record<ChartRange, number> = {
  '1M': 1,
  '3M': 3,
  '6M': 6,
  '1Y': 12,
}

export function toCandle(row: PriceHistoryRow): Candle {
  return {
    time: row.trade_date,
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    volume: row.volume,
  }
}

type LiveQuote = Pick<
  BoardStock,
  'price' | 'high_price' | 'low_price' | 'volume'
>

// Realtime chỉ đẩy bảng stocks, không đẩy price_history.
// Nên nến cuối (phiên đang chạy) lấy giá, cao, thấp, KL từ stocks để biểu đồ nhảy theo bảng giá.
export function withLiveCandle(candles: Candle[], quote: LiveQuote): Candle[] {
  const last = candles.at(-1)
  if (!last) return candles
  const live: Candle = {
    ...last,
    close: quote.price,
    high: Math.max(last.high, quote.high_price ?? quote.price, quote.price),
    low: Math.min(last.low, quote.low_price ?? quote.price, quote.price),
    volume: Math.max(last.volume, quote.volume),
  }
  return [...candles.slice(0, -1), live]
}

// Giữ các nến trong N tháng tính lùi từ nến cuối
export function filterRange(candles: Candle[], range: ChartRange): Candle[] {
  const last = candles.at(-1)
  if (!last) return candles
  const from = new Date(`${last.time}T00:00:00Z`)
  from.setUTCMonth(from.getUTCMonth() - RANGE_MONTHS[range])
  const fromDate = from.toISOString().slice(0, 10)
  return candles.filter((c) => c.time > fromDate)
}
