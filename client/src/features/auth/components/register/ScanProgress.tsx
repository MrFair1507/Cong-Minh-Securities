import { cn } from 'cn'
import { Check, Circle, LoaderCircle, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Ba việc thật mà DocumentStep làm: đọc QR từ ảnh → tách dữ liệu → đối chiếu
export const SCAN_STEPS = ['read', 'extract', 'match'] as const

type ScanProgressProps = {
  current: number // dòng đang chạy; bằng SCAN_STEPS.length là xong hết
  failed: boolean // dừng ở dòng current vì lỗi
}

export function ScanProgress({ current, failed }: ScanProgressProps) {
  const { t } = useTranslation('auth')

  return (
    <ul
      aria-live="polite"
      className="flex flex-col gap-2 rounded-lg border p-3 text-sm"
    >
      {SCAN_STEPS.map((step, index) => {
        const done = index < current
        const running = index === current && !failed
        const error = index === current && failed
        const Icon = done ? Check : error ? X : running ? LoaderCircle : Circle
        return (
          <li
            key={step}
            className={cn(
              'flex items-center gap-2',
              index > current && 'text-muted-foreground',
              error && 'text-destructive',
            )}
          >
            <Icon
              aria-hidden
              className={cn(
                'size-4',
                done && 'text-safe',
                running && 'animate-spin motion-reduce:animate-none',
              )}
            />
            {t(`kyc.scan.${step}`)}
          </li>
        )
      })}
    </ul>
  )
}

// Vạch sáng chạy lên xuống trên ảnh; ẩn khi người dùng bật giảm chuyển động
export function ScanLine() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 h-0.5 animate-scan bg-info shadow-[0_0_12px_2px_var(--info)] motion-reduce:hidden"
    />
  )
}
