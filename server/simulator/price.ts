// Các hàm thuần tính giá, tách riêng để dễ viết unit test.

export const TICK_SIZE = 100 // bước giá thống nhất 100 đ

export type Trend = 'none' | 'up' | 'down'

export function roundToTick(value: number): number {
  return Math.round(value / TICK_SIZE) * TICK_SIZE
}

// Trần làm tròn xuống, sàn làm tròn lên (khớp seed.sql).
// Đổi biên độ sang điểm cơ bản (0.07 -> 700) để tính bằng số nguyên, tránh sai số float.
export function priceLimits(
  refPrice: number,
  priceBand: number,
): { ceiling: number; floor: number } {
  const bp = Math.round(priceBand * 10_000)
  return {
    ceiling:
      Math.floor((refPrice * (10_000 + bp)) / (10_000 * TICK_SIZE)) * TICK_SIZE,
    floor:
      Math.ceil((refPrice * (10_000 - bp)) / (10_000 * TICK_SIZE)) * TICK_SIZE,
  }
}

// Tỷ lệ thay đổi giá cho một lần cập nhật.
// none: dao động ±0,5% và bị kéo dần về giá tham chiếu để không chạm trần/sàn liên tục.
// up/down: xu hướng ±1,5% mỗi lần, dùng khi demo.
export function randomChange(
  trend: Trend,
  price: number,
  refPrice: number,
): number {
  const noise = (Math.random() - 0.5) * 0.01
  if (trend === 'down') return noise - 0.015
  if (trend === 'up') return noise + 0.015
  return noise - 0.02 * ((price - refPrice) / refPrice)
}

export function nextPrice(
  price: number,
  change: number,
  limits: { ceiling: number; floor: number },
): number {
  const raw = roundToTick(price * (1 + change))
  return Math.min(limits.ceiling, Math.max(limits.floor, raw))
}

// Khối lượng khớp mỗi lần: 1 đến 500 lô (1 lô = 100 cổ phiếu)
export function randomVolume(): number {
  return (Math.floor(Math.random() * 500) + 1) * 100
}

export function pickRandom<T>(items: T[], count: number): T[] {
  return [...items].sort(() => Math.random() - 0.5).slice(0, count)
}

export const BOOK_DEPTH = 3 // bảng giá hiện 3 bước giá mỗi bên

export type OrderBook = {
  bidPrices: number[] // giá mua 1 (cao nhất) → 3
  bidVolumes: number[]
  askPrices: number[] // giá bán 1 (thấp nhất) → 3
  askVolumes: number[]
}

// Sổ lệnh giả lập quanh giá khớp: bên mua thấp hơn 1–3 bước giá, bên bán cao hơn 1–3 bước.
// Giá trần: dư mua ngay tại trần, bên bán trống. Giá sàn: dư bán ngay tại sàn, bên mua trống.
// Chỉ để hiển thị, lệnh thị trường vẫn khớp theo giá khớp.
export function buildOrderBook(
  price: number,
  limits: { ceiling: number; floor: number },
): OrderBook {
  const bidStart = price >= limits.ceiling ? price : price - TICK_SIZE
  const askStart = price <= limits.floor ? price : price + TICK_SIZE
  const bidPrices: number[] = []
  const askPrices: number[] = []
  for (let step = 0; step < BOOK_DEPTH; step++) {
    const bid = bidStart - step * TICK_SIZE
    const ask = askStart + step * TICK_SIZE
    if (bid >= limits.floor) bidPrices.push(bid)
    if (ask <= limits.ceiling) askPrices.push(ask)
  }
  return {
    bidPrices,
    bidVolumes: bidPrices.map(() => randomVolume()),
    askPrices,
    askVolumes: askPrices.map(() => randomVolume()),
  }
}

// Room NĐTNN còn lại: thỉnh thoảng khối ngoại mua thêm vài lô, không xuống dưới 0
export function nextForeignRoom(room: number): number {
  if (Math.random() >= 0.3) return room
  return Math.max(0, room - randomVolume())
}

export type TradeSide = 'BUY' | 'SELL'

// Bên chủ động của một lần khớp: giá lên là mua chủ động, giá xuống là bán chủ động,
// đứng giá thì giữ như lần khớp trước
export function tradeSide(
  previousPrice: number,
  price: number,
  lastSide: TradeSide,
): TradeSide {
  if (price > previousPrice) return 'BUY'
  if (price < previousPrice) return 'SELL'
  return lastSide
}
