// Tab của trang /margin, lưu trên URL: /margin?tab=stocks
// Gói vay nằm luôn trong Tổng quan (bấm ô gói để mở chi tiết), không còn tab riêng
export const MARGIN_TABS = [
  'overview',
  'stocks',
  'illustration',
  'history',
] as const

export type MarginTab = (typeof MARGIN_TABS)[number]
