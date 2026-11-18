import type { MarginStatus } from '@cms/shared/margin'

// Màu theo trạng thái ký quỹ (viết đủ tên class để Tailwind quét được)
export const STATUS_TEXT: Record<MarginStatus, string> = {
  SAFE: 'text-safe',
  WATCH: 'text-warning',
  CALL: 'text-danger',
  DANGER: 'text-danger',
}

export const STATUS_BADGE: Record<MarginStatus, string> = {
  SAFE: 'bg-safe-bg text-safe',
  WATCH: 'bg-warning-bg text-warning',
  CALL: 'bg-danger-bg text-danger',
  DANGER: 'bg-danger-bg text-danger',
}

// Phần đã tô của thanh tỷ lệ ký quỹ
export const STATUS_FILL: Record<MarginStatus, string> = {
  SAFE: 'bg-safe',
  WATCH: 'bg-warning',
  CALL: 'bg-danger',
  DANGER: 'bg-danger',
}
