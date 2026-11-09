// Công thức ký quỹ dùng chung cho client (hiển thị) và simulator (sinh cảnh báo).
// Bản quyết định khi đặt lệnh nằm trong RPC place_order (SQL), hai bên phải khớp nhau.

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

export type MarginStatus = 'SAFE' | 'CALL' | 'DANGER'

// Tỷ lệ ký quỹ = (Tổng tài sản - Dư nợ) / Tổng tài sản
// Tổng tài sản = tiền mặt + giá trị cổ phiếu đang giữ theo giá hiện tại
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
  const ratio = marginRatio(totalAssets, debt)
  if (ratio < rates.maintenanceRate) return 'DANGER'
  if (ratio < rates.callRate) return 'CALL'
  return 'SAFE'
}

export function isMarginCall(
  totalAssets: number,
  debt: number,
  rates: MarginRates,
): boolean {
  return debt > 0 && marginRatio(totalAssets, debt) < rates.callRate
}

// Chỉ vay phần còn thiếu, không quá giá trị lệnh × loan_rate của mã
export function loanAmount(
  orderValue: number,
  cash: number,
  loanRate: number,
): number {
  const missing = Math.max(0, orderValue - cash)
  return Math.min(missing, orderValue * loanRate)
}
