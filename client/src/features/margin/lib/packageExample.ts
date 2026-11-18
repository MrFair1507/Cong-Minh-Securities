import { packageInterest } from '@cms/shared/margin'
import type { BoardStock } from '@/features/market/api/stocks'
import type { MarginPackage } from './packages'

// Số tiền và số ngày dùng để so lãi giữa các gói (ô gói và popup chi tiết)
export const COMPARE_AMOUNT = 100_000_000
export const COMPARE_DAYS = [7, 30, 90] as const
export const TILE_DAYS = 30

// Một đoạn của thanh ví dụ trong popup chi tiết gói
export type ExamplePart =
  | {
      kind: 'basket'
      inBasket: boolean
      symbol: string
      amount: number
      rate: number
      interest: number
      weight: number
    }
  | {
      kind: 'tier'
      fromDay: number
      toDay: number
      rate: number
      interest: number
      weight: number
    }

export type PackageExample = {
  amount: number
  days: number
  parts: ExamplePart[]
  total: number
}

// Khoảng lãi của gói bậc thang: [thấp nhất, cao nhất]
export function rateRange(pkg: MarginPackage): [number, number] {
  const rates = pkg.plan.tiers.map((tier) => tier.annualRate)
  return [Math.min(...rates), Math.max(...rates)]
}

// Gói có rổ: vay 100 triệu mua mã trong rổ + 50 triệu mua mã ngoài rổ (tính theo gói Cơ bản) trong 30 ngày.
// Gói bậc thang: vay 100 triệu hết hạn vay, tách tiền lãi theo từng bậc. Gói lãi cố định không cần ví dụ.
export function packageExample(
  pkg: MarginPackage,
  packages: MarginPackage[],
  stocks: BoardStock[],
): PackageExample | null {
  if (pkg.stockIds) {
    const basket = pkg.stockIds
    const basic = packages.find((item) => item.code === 'BASIC')
    const inside = stocks.find((stock) => basket.includes(stock.id))
    const outside = stocks.find(
      (stock) => stock.loan_rate > 0 && !basket.includes(stock.id),
    )
    if (
      !basic ||
      !inside ||
      !outside ||
      pkg.rate === null ||
      basic.rate === null
    )
      return null
    const days = 30
    const parts: ExamplePart[] = [
      {
        kind: 'basket',
        inBasket: true,
        symbol: inside.symbol,
        amount: COMPARE_AMOUNT,
        rate: pkg.rate,
        interest: packageInterest(COMPARE_AMOUNT, days, pkg.plan),
        weight: 2,
      },
      {
        kind: 'basket',
        inBasket: false,
        symbol: outside.symbol,
        amount: COMPARE_AMOUNT / 2,
        rate: basic.rate,
        interest: packageInterest(COMPARE_AMOUNT / 2, days, basic.plan),
        weight: 1,
      },
    ]
    return { amount: COMPARE_AMOUNT * 1.5, days, parts, total: sum(parts) }
  }

  if (pkg.rate === null) {
    const days = pkg.termDays
    const parts: ExamplePart[] = []
    for (const tier of pkg.plan.tiers) {
      if (tier.fromDay > days) continue
      const toDay = Math.min(tier.toDay ?? days, days)
      const interest =
        packageInterest(COMPARE_AMOUNT, toDay, pkg.plan) -
        packageInterest(COMPARE_AMOUNT, tier.fromDay - 1, pkg.plan)
      parts.push({
        kind: 'tier',
        fromDay: tier.fromDay,
        toDay,
        rate: tier.annualRate,
        interest,
        weight: toDay - tier.fromDay + 1,
      })
    }
    return { amount: COMPARE_AMOUNT, days, parts, total: sum(parts) }
  }

  return null
}

function sum(parts: ExamplePart[]): number {
  return parts.reduce((total, part) => total + part.interest, 0)
}
