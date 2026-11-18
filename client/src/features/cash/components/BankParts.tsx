import { useMutation } from '@tanstack/react-query'
import { cn } from 'cn'
import { Copy, KeyRound, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { formatMoney } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  bankErrorCode,
  type OtpPurpose,
  useRequestOtp,
} from '../api/bankActions'

export function BankMark({
  code,
  className,
}: {
  code: string
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground',
        className,
      )}
    >
      {code.charAt(0)}
    </span>
  )
}

type ChoiceOption = {
  value: string
  title: string
  subtitle?: string
  mark: string
}

// Nhóm thẻ chọn một (radio thật, ẩn đi), dùng chọn ngân hàng hoặc tài khoản liên kết
export function ChoiceCards({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string
  legend: string
  options: ChoiceOption[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm leading-5 font-medium">{legend}</legend>
      <div
        className={cn(
          'grid grid-cols-1 gap-2',
          options.length > 1 && 'sm:grid-cols-2',
        )}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/60 has-checked:border-primary has-checked:bg-muted/60 has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <BankMark code={option.mark} />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">
                {option.title}
              </span>
              {option.subtitle && (
                <span className="truncate text-xs text-muted-foreground tabular-nums">
                  {option.subtitle}
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

// Ô nhập số tiền dời sang shared/components/AmountField.tsx (dùng chung với /margin)
export { AmountField } from '@/shared/components/AmountField'

// Kiểm số tiền nộp/rút: trả câu lỗi hoặc undefined
export function useAmountError(amount: number, max: number, touched: boolean) {
  const { t } = useTranslation('cash')
  if (!touched) return undefined
  if (amount <= 0) return t('errors.amountRequired')
  if (amount < 10_000)
    return t('errors.amountMin', { min: formatMoney(10_000) })
  if (amount > max) return t('errors.amountMax', { max: formatMoney(max) })
  return undefined
}

// Xin mã OTP mô phỏng và giữ mã mới nhất để hiện lên
export function useOtp(purpose: OtpPurpose) {
  const { t } = useTranslation('cash')
  const request = useRequestOtp()
  return {
    code: request.data,
    isPending: request.isPending,
    request: () =>
      request.mutate(purpose, {
        onError: (error) => toast.error(t(`errors.${bankErrorCode(error)}`)),
      }),
  }
}

export type OtpState = ReturnType<typeof useOtp>

// Khối OTP: hộp hiện mã mô phỏng + ô nhập 6 số + nút gửi lại
export function OtpField({
  otp,
  value,
  onChange,
}: {
  otp: OtpState
  value: string
  onChange: (value: string) => void
}) {
  const { t } = useTranslation('cash')
  return (
    <section
      aria-labelledby="otp-title"
      className="flex flex-col gap-3 rounded-lg border p-4"
    >
      <h3
        id="otp-title"
        className="flex items-center gap-2 text-sm font-semibold"
      >
        <KeyRound className="size-4" aria-hidden />
        {t('otp.title')}
      </h3>
      <div
        role="status"
        className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/60 px-3 py-2 text-xs"
      >
        <span className="text-muted-foreground">
          {t('otp.mockNotice')}{' '}
          <strong className="font-mono text-sm tracking-widest text-foreground">
            {otp.isPending ? t('otp.sending') : (otp.code ?? '------')}
          </strong>
        </span>
        <span className="text-muted-foreground">{t('otp.expires')}</span>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="otp-code" className="leading-5">
            {t('otp.label')}
          </Label>
          <Input
            id="otp-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder={t('otp.placeholder')}
            value={value}
            onChange={(e) =>
              onChange(e.target.value.replace(/\D/g, '').slice(0, 6))
            }
            className="h-9 px-3 font-mono tracking-widest"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={otp.request}
          disabled={otp.isPending}
        >
          <RefreshCw aria-hidden />
          {t('otp.resend')}
        </Button>
      </div>
    </section>
  )
}

// Một dòng thông tin chuyển khoản có nút sao chép
export function CopyRow({
  label,
  value,
  display,
}: {
  label: string
  value: string
  display?: ReactNode
}) {
  const { t } = useTranslation('cash')
  const copy = useMutation({
    mutationFn: () => navigator.clipboard.writeText(value),
    onSuccess: () => toast.success(t('deposit.copied', { label })),
  })
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="flex min-w-0 items-center gap-1">
        <span className="truncate text-right font-medium tabular-nums">
          {display ?? value}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('deposit.copy', { label })}
          onClick={() => copy.mutate()}
        >
          <Copy aria-hidden />
        </Button>
      </span>
    </div>
  )
}
