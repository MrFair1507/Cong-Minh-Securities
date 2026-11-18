// Công thức ký quỹ dùng chung cho client (xem trước, hiển thị) và simulator (cảnh báo).
// Các kiểm tra ở đây phải khớp với migration margin (place_order, loan_interest, renew_loan_internal).
import { FEE_RATE, maxBuyQuantity, orderCost } from './trading'

export type MarginRates = {
  initialRate: number // tỷ lệ tối thiểu ngay sau khi vay
  callRate: number // dưới ngưỡng này: sinh cảnh báo
  maintenanceRate: number // dưới ngưỡng này: hiển thị "nguy hiểm" (không tự bán)
}

// Giá trị mặc định, khớp default của bảng margin_accounts
export const DEFAULT_RATES: MarginRates = {
  initialRate: 0.5,
  callRate: 0.4,
  maintenanceRate: 0.3,
}

// SAFE: ≥ tỷ lệ ban đầu (hoặc không nợ) · WATCH: giữa ngưỡng cảnh báo và ban đầu
// CALL: dưới ngưỡng cảnh báo · DANGER: dưới ngưỡng nguy hiểm
export type MarginStatus = 'SAFE' | 'WATCH' | 'CALL' | 'DANGER'

export function marginRatio(totalAssets: number, debt: number): number {
  if (debt <= 0) return 1
  if (totalAssets <= 0) return 0
  return (totalAssets - debt) / totalAssets
}

export function marginStatus(
  totalAssets: number,
  debt: number,
  rates: MarginRates,
): MarginStatus {
  if (debt <= 0) return 'SAFE'
  const ratio = marginRatio(totalAssets, debt)
  if (ratio < rates.maintenanceRate) return 'DANGER'
  if (ratio < rates.callRate) return 'CALL'
  if (ratio < rates.initialRate) return 'WATCH'
  return 'SAFE'
}

export function isMarginCall(
  totalAssets: number,
  debt: number,
  rates: MarginRates,
): boolean {
  return debt > 0 && marginRatio(totalAssets, debt) < rates.callRate
}

// ---------- Gói vay và lãi ----------

export type InterestTier = {
  fromDay: number
  toDay: number | null // null: từ fromDay trở đi
  annualRate: number
}

// rate: lãi năm cố định; null thì dùng bảng bậc (gói Bậc thang)
export type InterestPlan = { rate: number | null; tiers: InterestTier[] }

// Lãi năm của ngày thứ day (ngày vay là ngày 1), khớp loan_annual_rate()
export function annualRateOnDay(plan: InterestPlan, day: number): number {
  if (plan.rate !== null) return plan.rate
  const tier = plan.tiers.find(
    (t) => day >= t.fromDay && (t.toDay === null || day <= t.toDay),
  )
  return tier?.annualRate ?? 0
}

// Lãi của khoản vay principal trong days ngày (tính cả ngày vay), làm tròn tới đồng.
// Khớp loan_interest(): cộng lãi từng ngày rồi mới làm tròn.
export function packageInterest(
  principal: number,
  days: number,
  plan: InterestPlan,
): number {
  let sum = 0
  for (let day = 1; day <= days; day++) {
    sum += (principal * annualRateOnDay(plan, day)) / 365
  }
  return Math.round(sum)
}

// ---------- Mua có vay ----------

export type MarginPosition = {
  cash: number
  stockValue: number // giá trị cổ phiếu theo giá hiện tại
  debt: number // gốc + lãi tạm tính
}

export type MarginOrderError =
  | 'STOCK_NOT_MARGINABLE'
  | 'LOAN_LIMIT_EXCEEDED'
  | 'MARGIN_RATIO_TOO_LOW'

export type MarginOrderPreview = {
  total: number // tiền phải trả (giá trị + phí)
  cashUsed: number
  loan: number
  ratioAfter: number
  error?: MarginOrderError
}

// Xem trước lệnh mua có vay. Vay đúng phần tiền mặt còn thiếu.
// Điều kiện giống place_order: mã cho vay, tiền vay ≤ giá trị × loanRate, tỷ lệ sau lệnh ≥ initialRate.
export function marginOrderPreview(input: {
  price: number
  quantity: number
  position: MarginPosition
  initialRate: number
  loanRate: number
}): MarginOrderPreview {
  const { price, quantity, position, initialRate, loanRate } = input
  const { value, total } = orderCost('BUY', price, quantity)

  if (position.cash >= total) {
    return {
      total,
      cashUsed: total,
      loan: 0,
      ratioAfter: marginRatio(
        position.cash - total + position.stockValue + value,
        position.debt,
      ),
    }
  }

  const loan = total - position.cash
  const ratioAfter = marginRatio(
    position.stockValue + value,
    position.debt + loan,
  )
  const preview = { total, cashUsed: position.cash, loan, ratioAfter }
  if (loanRate <= 0) return { ...preview, error: 'STOCK_NOT_MARGINABLE' }
  if (loan > value * loanRate)
    return { ...preview, error: 'LOAN_LIMIT_EXCEEDED' }
  if (ratioAfter < initialRate)
    return { ...preview, error: 'MARGIN_RATIO_TOO_LOW' }
  return preview
}

// Giá trị lệnh tối đa khi được vay (chưa gồm phí), lấy mức thấp hơn của 2 giới hạn:
//   tiền vay ≤ giá trị × loanRate  →  V ≤ cash / (1 + phí − loanRate)
//   tỷ lệ sau lệnh ≥ initialRate   →  V ≤ (S − D + C − i·S) / (i + phí)
export function maxMarginOrderValue(
  position: MarginPosition,
  initialRate: number,
  loanRate: number,
): number {
  const { cash, stockValue, debt } = position
  const cashOnly = cash / (1 + FEE_RATE)
  if (loanRate <= 0) return cashOnly
  const byLoanRate = cash / (1 + FEE_RATE - loanRate)
  const byRatio =
    (stockValue - debt + cash - initialRate * stockValue) /
    (initialRate + FEE_RATE)
  return Math.max(cashOnly, Math.min(byLoanRate, byRatio))
}

// Khối lượng mua tối đa (bội số lot) khi được vay. Làm tròn có thể lệch vài đồng: lùi từng lô.
export function maxMarginBuyQuantity(input: {
  price: number
  position: MarginPosition
  initialRate: number
  loanRate: number
  lot: number
}): number {
  const { price, position, initialRate, loanRate, lot } = input
  if (price <= 0) return 0
  const cashOnly = maxBuyQuantity(position.cash, price, lot)
  if (loanRate <= 0) return cashOnly

  const limit = maxMarginOrderValue(position, initialRate, loanRate)
  let quantity = Math.floor(limit / price / lot) * lot
  while (
    quantity > cashOnly &&
    marginOrderPreview({ price, quantity, position, initialRate, loanRate })
      .error
  ) {
    quantity -= lot
  }
  return Math.max(quantity, cashOnly)
}

// Sức mua có vay chung (chưa xét tỷ lệ vay riêng từng mã), như "2 × tiền mặt" khi chưa có cổ phiếu
export function marginBuyingPower(
  position: MarginPosition,
  initialRate: number,
): number {
  const equity = position.cash + position.stockValue - position.debt
  return Math.max(position.cash, equity / initialRate - position.stockValue, 0)
}

// Số tiền cần trả để tỷ lệ về lại targetRate.
// Trả X thì tài sản và nợ cùng giảm X: (A − D) / (A − X) ≥ rate  →  X ≥ A − (A − D) / rate
export function repayToReach(
  totalAssets: number,
  debt: number,
  targetRate: number,
): number {
  if (marginRatio(totalAssets, debt) >= targetRate) return 0
  const equity = totalAssets - debt
  if (equity <= 0) return debt
  const amount = Math.ceil(totalAssets - equity / targetRate)
  return Math.min(Math.max(amount, 0), debt)
}

// ---------- Hạn vay ----------

export const RENEW_WINDOW_DAYS = 10
export const MAX_RENEWALS = 2

// Số ngày từ ngày a tới ngày b (chuỗi 'YYYY-MM-DD')
export function daysBetween(a: string, b: string): number {
  const toUtc = (d: string) => {
    const [y, m, day] = d.split('-').map(Number)
    return Date.UTC(y, m - 1, day)
  }
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000)
}

export type RenewError =
  | 'RENEW_TOO_EARLY'
  | 'RENEW_LIMIT'
  | 'MARGIN_RATIO_TOO_LOW'

// Khớp renew_loan_internal(): còn ≤ 10 ngày tới hạn, tối đa 2 lần, tỷ lệ ≥ ngưỡng cảnh báo
export function renewError(input: {
  dueDate: string
  today: string
  renewCount: number
  ratio: number
  callRate: number
}): RenewError | undefined {
  if (daysBetween(input.today, input.dueDate) > RENEW_WINDOW_DAYS)
    return 'RENEW_TOO_EARLY'
  if (input.renewCount >= MAX_RENEWALS) return 'RENEW_LIMIT'
  if (input.ratio < input.callRate) return 'MARGIN_RATIO_TOO_LOW'
  return undefined
}

// ---------- Minh họa khoản vay ----------

export type IllustrationInput = {
  capital: number // vốn tự có
  buyPrice: number
  sellPrice: number // giá bán mục tiêu
  days: number // số ngày nắm giữ
  loanRate: number // tỷ lệ cho vay của mã
  lot: number
}

export type IllustrationScenario = {
  quantity: number
  investment: number // tiền mua (giá trị + phí)
  loan: number
  interest: number
  feeAndTax: number // phí mua + phí bán + thuế bán
  profit: number
  profitRatio: number // so với vốn tự có
}

export type IllustrationPackage<Code extends string> =
  | {
      code: Code
      eligible: true
      scenario: IllustrationScenario
      extraRatio: number // lợi nhuận hơn/kém phương án tiền mặt, so với vốn tự có
    }
  | { code: Code; eligible: false }

function scenario(
  quantity: number,
  input: IllustrationInput,
  plan: InterestPlan | null,
): IllustrationScenario {
  const buy = orderCost('BUY', input.buyPrice, quantity)
  const sell = orderCost('SELL', input.sellPrice, quantity)
  const loan = Math.max(0, buy.total - input.capital)
  const interest = plan ? packageInterest(loan, input.days, plan) : 0
  const profit = sell.total - buy.total - interest
  return {
    quantity,
    investment: buy.total,
    loan,
    interest,
    feeAndTax: buy.fee + sell.fee + sell.tax,
    profit,
    profitRatio: input.capital > 0 ? profit / input.capital : 0,
  }
}

// So sánh chỉ dùng tiền mặt với vay theo từng gói. Có tính phí, thuế (khớp orderCost).
// Khi vay: mua tới mức vốn / (1 − tỷ lệ cho vay), vay phần vượt vốn tự có.
// Gói không áp dụng được (mã không cho vay, ngoài rổ) xếp cuối; còn lại xếp theo lợi nhuận giảm dần.
export function illustrateLoan<Code extends string>(
  input: IllustrationInput,
  packages: { code: Code; plan: InterestPlan; eligible: boolean }[],
): { cash: IllustrationScenario; packages: IllustrationPackage<Code>[] } {
  const cashQuantity = maxBuyQuantity(input.capital, input.buyPrice, input.lot)
  const cash = scenario(cashQuantity, input, null)

  const target =
    input.loanRate > 0 && input.loanRate < 1
      ? input.capital / (1 - input.loanRate)
      : input.capital
  const loanQuantity = Math.max(
    cashQuantity,
    Math.floor(target / (input.buyPrice * (1 + FEE_RATE)) / input.lot) *
      input.lot,
  )

  const eligible: IllustrationPackage<Code>[] = []
  const ineligible: IllustrationPackage<Code>[] = []
  for (const item of packages) {
    if (!item.eligible || input.loanRate <= 0) {
      ineligible.push({ code: item.code, eligible: false })
      continue
    }
    const result = scenario(loanQuantity, input, item.plan)
    eligible.push({
      code: item.code,
      eligible: true,
      scenario: result,
      extraRatio:
        input.capital > 0 ? (result.profit - cash.profit) / input.capital : 0,
    })
  }
  eligible.sort(
    (a, b) =>
      (b.eligible ? b.scenario.profit : 0) -
      (a.eligible ? a.scenario.profit : 0),
  )
  return { cash, packages: [...eligible, ...ineligible] }
}
