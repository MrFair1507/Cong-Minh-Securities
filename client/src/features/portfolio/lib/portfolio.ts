// Hàm thuần tính danh mục (test được bằng Vitest ở tuần 3).
import type { BoardStock } from '@/features/market/api/stocks'
import type { HoldingRow } from '../api/holdings'

// Số mã có màu riêng trên biểu đồ tỷ trọng, từ mã thứ 6 gộp vào "Khác"
export const ALLOCATION_SLOTS = 5

export type PortfolioRow = {
  stock: BoardStock
  quantity: number
  avgCost: number
  cost: number
  value: number
  profit: number
  ratio: number
  weight: number
  slot: number | null
}

export type Portfolio = {
  rows: PortfolioRow[]
  marketValue: number
  cost: number
  profit: number
  ratio: number
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

export function buildPortfolio(
  holdings: HoldingRow[],
  stocks: BoardStock[],
): Portfolio {
  const byId = new Map(stocks.map((stock) => [stock.id, stock]))
  const base = holdings.flatMap((holding) => {
    const stock = byId.get(holding.stock_id)
    if (!stock) return []
    const cost = holding.avg_cost * holding.quantity
    const value = stock.price * holding.quantity
    return [
      {
        stock,
        quantity: holding.quantity,
        avgCost: holding.avg_cost,
        cost,
        value,
        profit: value - cost,
        ratio: cost > 0 ? (value - cost) / cost : 0,
      },
    ]
  })

  // Xếp theo vốn bỏ ra: chỉ đổi khi mua/bán, không đổi theo từng nhịp giá,
  // nên thứ tự dòng và màu của mỗi mã đứng yên khi giá nhảy.
  base.sort(
    (a, b) => b.cost - a.cost || a.stock.symbol.localeCompare(b.stock.symbol),
  )

  const marketValue = sum(base.map((row) => row.value))
  const cost = sum(base.map((row) => row.cost))
  const rows = base.map((row, index) => ({
    ...row,
    weight: marketValue > 0 ? row.value / marketValue : 0,
    slot: index < ALLOCATION_SLOTS ? index : null,
  }))

  return {
    rows,
    marketValue,
    cost,
    profit: marketValue - cost,
    ratio: cost > 0 ? (marketValue - cost) / cost : 0,
  }
}

export type AllocationSlice = {
  key: string
  symbol: string | null // null: nhóm "Khác"
  count: number // số mã trong lát (nhóm "Khác" có thể nhiều mã)
  weight: number
  slot: number | null
}

// Lát biểu đồ tỷ trọng: 5 mã vốn lớn nhất, còn lại gộp một lát "Khác"
export function allocationSlices(rows: PortfolioRow[]): AllocationSlice[] {
  const slices: AllocationSlice[] = rows
    .filter((row) => row.slot !== null)
    .map((row) => ({
      key: row.stock.symbol,
      symbol: row.stock.symbol,
      count: 1,
      weight: row.weight,
      slot: row.slot,
    }))
  const others = rows.filter((row) => row.slot === null)
  if (others.length > 0) {
    slices.push({
      key: 'others',
      symbol: null,
      count: others.length,
      weight: sum(others.map((row) => row.weight)),
      slot: null,
    })
  }
  return slices
}
