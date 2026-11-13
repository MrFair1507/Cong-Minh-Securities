import { cn } from 'cn'
import { Check, Circle, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const SCAN_STEPS = ['quality', 'extract', 'match'] as const
const STEP_MS = 600

// "Quét" chỉ là bộ đếm thời gian (~2 giây), không có OCR. Xong 3 dòng thì gọi onDone.
export function ScanProgress({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation('auth')
  const [doneCount, setDoneCount] = useState(0)

  useEffect(() => {
    if (doneCount === SCAN_STEPS.length) {
      const id = setTimeout(onDone, 300)
      return () => clearTimeout(id)
    }
    const id = setTimeout(() => setDoneCount((n) => n + 1), STEP_MS)
    return () => clearTimeout(id)
  }, [doneCount, onDone])

  return (
    <ul
      aria-live="polite"
      className="flex flex-col gap-2 rounded-lg border p-3 text-sm"
    >
      {SCAN_STEPS.map((step, index) => {
        const done = index < doneCount
        const running = index === doneCount
        const Icon = done ? Check : running ? LoaderCircle : Circle
        return (
          <li
            key={step}
            className={cn(
              'flex items-center gap-2',
              !done && !running && 'text-muted-foreground',
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
