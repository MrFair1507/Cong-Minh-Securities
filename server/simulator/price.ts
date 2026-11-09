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
