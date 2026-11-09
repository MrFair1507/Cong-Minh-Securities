export const INITIAL_RATIO = 0.5
export const MAINTENANCE_RATIO = 0.4

// Tỷ lệ ký quỹ = (Tổng tài sản - Dư nợ) / Tổng tài sản
export function marginRatio(totalAssets: number, debt: number): number {
  if (totalAssets <= 0) return 0
  return (totalAssets - debt) / totalAssets
}

export function isMarginCall(totalAssets: number, debt: number): boolean {
  return debt > 0 && marginRatio(totalAssets, debt) < MAINTENANCE_RATIO
}
