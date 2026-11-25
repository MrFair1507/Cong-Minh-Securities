import type { MarginOrderPreview, MarginPosition } from '@cms/shared/margin'
import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { CircleAlert, CircleCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { MarginPackage } from '@/features/margin/lib/packages'
import { formatMoney, formatRate, formatRatio } from '@/shared/lib/format'
import { Label } from '@/shared/ui/label'
import { Switch } from '@/shared/ui/switch'
import { SummaryRow } from './OrderSummary'

export type OrderMargin = {
  hasAccount: boolean
  position: MarginPosition
  initialRate: number
  pkg?: MarginPackage 
}

export function MarginToggle({
  margin,
  loanRate,
  checked,
  onCheckedChange,
}: {
  margin: OrderMargin
  loanRate: number
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  const { t } = useTranslation('trading')
  const canBorrow = margin.hasAccount && loanRate > 0

  let hint = t('margin.toggleHint', { rate: formatRate(loanRate) })
  if (!margin.hasAccount) hint = t('margin.noAccount')
  else if (loanRate <= 0) hint = t('margin.notMarginable')

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Label htmlFor="useMargin" className="leading-5">
          {t('margin.toggle')}
        </Label>
        <p className="text-xs text-muted-foreground">
          {hint}
          {!margin.hasAccount && (
            <>
              {' '}
              <Link
                to="/margin"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {t('margin.openLink')}
              </Link>
            </>
          )}
        </p>
      </div>
      <Switch
        id="useMargin"
        checked={canBorrow && checked}
        disabled={!canBorrow}
        onCheckedChange={onCheckedChange}
      />
    </div>
  )
}

// Các dòng vay ký quỹ trong hộp tổng tiền
export function MarginOrderRows({
  preview,
  pkg,
  initialRate,
}: {
  preview: MarginOrderPreview
  pkg?: MarginPackage
  initialRate: number
}) {
  const { t } = useTranslation('trading')
  const { t: tm } = useTranslation('margin')
  const rateText = pkg
    ? pkg.rate === null
      ? tm('package.tieredRate')
      : tm('package.yearRate', { rate: formatRate(pkg.rate) })
    : ''

  return (
    <>
      <div className="my-1 border-t" />
      <SummaryRow
        label={t('margin.cashUsed')}
        value={formatMoney(preview.cashUsed)}
      />
      <SummaryRow
        label={t('margin.loan')}
        value={formatMoney(preview.loan)}
        strong
        className="text-warning"
      />
      {pkg && preview.loan > 0 && (
        <SummaryRow
          label={t('margin.package')}
          value={`${tm(`packages.${pkg.code}.name`)} · ${rateText}`}
        />
      )}
      <SummaryRow
        label={t('margin.ratioAfter')}
        value={formatRatio(preview.ratioAfter)}
        strong
        className={
          preview.ratioAfter >= initialRate ? 'text-safe' : 'text-danger'
        }
      />
    </>
  )
}

// Dòng kết luận dưới hộp tổng tiền: hợp lệ (xanh) hoặc lý do bị chặn (đỏ)
export function MarginVerdict({
  preview,
  initialRate,
}: {
  preview: MarginOrderPreview
  initialRate: number
}) {
  const { t } = useTranslation('trading')
  const { error } = preview
  const Icon = error ? CircleAlert : CircleCheck
  const rate = formatRate(initialRate)
  return (
    <p
      role="status"
      className={cn(
        'flex gap-2 rounded-lg p-3 text-xs leading-5',
        error ? 'bg-danger-bg text-danger' : 'bg-safe-bg text-safe',
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      {error
        ? t(`margin.errors.${error}`, { rate })
        : t('margin.valid', { rate })}
    </p>
  )
}
