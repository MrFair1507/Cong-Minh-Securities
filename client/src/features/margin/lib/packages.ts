import type { InterestPlan } from '@cms/shared/margin'

// Mã gói khớp bảng margin_packages
export const PACKAGE_CODES = ['BASIC', 'PREFERRED', 'TIERED'] as const
export type PackageCode = (typeof PACKAGE_CODES)[number]

export function isPackageCode(value: unknown): value is PackageCode {
  return PACKAGE_CODES.includes(value as PackageCode)
}

export type MarginPackage = {
  code: PackageCode
  rate: number | null // lãi năm cố định; null là gói bậc thang
  termDays: number
  exclusive: boolean
  plan: InterestPlan
  stockIds: number[] | null // rổ mã riêng; null là mọi mã cho vay
}

// Gói có cho vay mã này không: mã phải cho vay, và nằm trong rổ nếu gói có rổ riêng
export function packageCovers(
  pkg: MarginPackage,
  stockId: number,
  loanRate: number,
): boolean {
  return (
    loanRate > 0 && (pkg.stockIds === null || pkg.stockIds.includes(stockId))
  )
}

// Gói thật sự áp dụng khi vay mua mã này, khớp place_order:
// đang dùng gói có rổ mà mã ngoài rổ thì áp dụng gói Cơ bản
export function appliedPackage(
  packages: MarginPackage[],
  activeCode: PackageCode,
  stockId: number,
): MarginPackage | undefined {
  const active = packages.find((pkg) => pkg.code === activeCode)
  if (active && (active.stockIds === null || active.stockIds.includes(stockId)))
    return active
  return packages.find((pkg) => pkg.code === 'BASIC')
}

// Gói loại trừ đang dùng (khác gói định đăng ký) → phải hủy trước khi đăng ký gói mới
export function conflictingPackage(
  packages: MarginPackage[],
  activeCode: PackageCode,
  targetCode: PackageCode,
): MarginPackage | undefined {
  const active = packages.find((pkg) => pkg.code === activeCode)
  const target = packages.find((pkg) => pkg.code === targetCode)
  if (!active || !target || active.code === target.code) return undefined
  return active.exclusive && target.exclusive ? active : undefined
}
