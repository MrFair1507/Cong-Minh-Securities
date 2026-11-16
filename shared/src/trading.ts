// Phí và thuế của lệnh, dùng chung cho client (xem trước số tiền) và khớp với RPC place_order.
// Đổi số ở đây thì đổi luôn fee_rate() / sell_tax_rate() trong migration trading.

export const FEE_RATE = 0.0015
export const SELL_TAX_RATE = 0.001

export type OrderSide = 'BUY' | 'SELL'

export type OrderCost = {
  value: number // giá trị lệnh = giá × khối lượng
  fee: number
  tax: number
  total: number // mua: tiền phải trả; bán: tiền nhận về
}

// Làm tròn tới đồng, giống round() của PostgreSQL với số dương
export function orderCost(
  side: OrderSide,
  price: number,
  quantity: number,
): OrderCost {
  const value = price * quantity
  const fee = Math.round(value * FEE_RATE)
  const tax = side === 'SELL' ? Math.round(value * SELL_TAX_RATE) : 0
  const total = side === 'BUY' ? value + fee : value - fee - tax
  return { value, fee, tax, total }
}

// Khối lượng mua tối đa (bội số lot) với số tiền đang có, đã tính phí
export function maxBuyQuantity(
  cash: number,
  price: number,
  lot: number,
): number {
  if (price <= 0) return 0
  let quantity = Math.floor(cash / (price * (1 + FEE_RATE)) / lot) * lot
  // Làm tròn phí có thể vượt vài đồng: lùi một lô nếu cần
  while (quantity > 0 && orderCost('BUY', price, quantity).total > cash) {
    quantity -= lot
  }
  return quantity
}

export type SellProfit = { profit: number; ratio: number }

// Lãi/lỗ tạm tính khi bán: tiền nhận về (đã trừ phí, thuế) so với giá vốn.
// avgCost đã gồm phí mua (cách place_order tính holdings.avg_cost).
export function sellProfit(
  avgCost: number,
  price: number,
  quantity: number,
): SellProfit {
  const cost = avgCost * quantity
  const profit = orderCost('SELL', price, quantity).total - cost
  return { profit, ratio: cost > 0 ? profit / cost : 0 }
}
