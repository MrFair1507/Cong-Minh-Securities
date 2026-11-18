import type { MarginRates, MarginStatus } from '@cms/shared/margin'
import { cn } from 'cn'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  formatMoney,
  formatRate,
  formatRatio,
  formatVolume,
} from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Label } from '@/shared/ui/label'
import { Switch } from '@/shared/ui/switch'
import type { MarginAccount } from '../../api/margin'
import {
  marginErrorCode,
  useUpdateMarginSettings,
} from '../../api/marginActions'
import type { MarginSummary } from '../../hooks/useMarginSummary'
import { STATUS_BADGE, STATUS_FILL } from '../../lib/status'

// Khối đầu Tổng quan: tỷ lệ ký quỹ (việc chính), dư nợ + nút Trả nợ, tổng tài sản, sức mua,
// và hai công tắc dịch vụ ở chân khối
export function MarginHero({
  summary,
  onRepay,
}: {
  summary: MarginSummary
  onRepay: () => void
}) {
  const { t } = useTranslation('margin')
  const { rates, account } = summary
  const hasDebt = summary.debt > 0

  return (
    <Card className="gap-0 py-0">
      <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t('ratio.label')}
            </span>
            {hasDebt ? (
              <Badge className={STATUS_BADGE[summary.status]}>
                {t(`status.${summary.status}`)}
              </Badge>
            ) : (
              <Badge variant="secondary">{t('ratio.noDebt')}</Badge>
            )}
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl leading-10 font-semibold tabular-nums">
              {hasDebt ? formatRatio(summary.ratio) : '—'}
            </span>
            <span className="text-sm text-muted-foreground">
              {t('ratio.formula')}
            </span>
          </div>
          <RatioGauge
            ratio={hasDebt ? summary.ratio : 0}
            status={summary.status}
            rates={rates}
          />
          <p className="text-xs text-muted-foreground">
            {t('ratio.hint', {
              call: formatRate(rates.callRate),
              maintenance: formatRate(rates.maintenanceRate),
            })}
          </p>
        </div>

        <div className="grid grid-cols-2 content-start gap-5 border-l p-6">
          <Figure
            big
            label={t('stats.debt')}
            value={formatMoney(summary.debt)}
            hint={
              hasDebt
                ? t('stats.debtHint', {
                    principal: formatVolume(summary.principal),
                    interest: formatVolume(summary.interest),
                  })
                : t('loans.emptyTitle')
            }
          />
          <div className="flex items-start justify-end">
            <Button
              size="lg"
              className="min-w-28"
              onClick={onRepay}
              disabled={summary.activeLoans.length === 0}
            >
              {t('actions.repay')}
            </Button>
          </div>
          <Figure
            label={t('stats.totalAssets')}
            value={formatMoney(summary.totalAssets)}
            hint={t('stats.totalAssetsHint')}
          />
          <Figure
            label={t('stats.buyingPower')}
            value={formatMoney(summary.buyingPower)}
            hint={t('stats.buyingPowerHint', {
              rate: formatRate(rates.initialRate),
            })}
          />
        </div>
      </div>

      {account && <ServiceSettings account={account} />}
    </Card>
  )
}

function Figure({
  label,
  value,
  hint,
  big = false,
}: {
  label: string
  value: string
  hint: string
  big?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          'font-semibold tabular-nums',
          big ? 'text-2xl leading-8' : 'text-lg leading-7',
        )}
      >
        {value}
      </span>
      <span className="text-xs leading-4 text-muted-foreground">{hint}</span>
    </div>
  )
}

// Thanh 0–100%: phần tô theo màu trạng thái, ba vạch ngưỡng nguy hiểm, cảnh báo, ban đầu
function RatioGauge({
  ratio,
  status,
  rates,
}: {
  ratio: number
  status: MarginStatus
  rates: MarginRates
}) {
  const percent = (value: number) => `${Math.min(Math.max(value, 0), 1) * 100}%`
  const marks = [rates.maintenanceRate, rates.callRate, rates.initialRate]

  return (
    <div aria-hidden className="flex flex-col gap-1.5">
      <div className="relative h-2 rounded-full bg-muted">
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full',
            STATUS_FILL[status],
          )}
          style={{ width: percent(ratio) }}
        />
        {marks.map((mark) => (
          <span
            key={mark}
            className="absolute -top-1 -bottom-1 w-px bg-foreground/50"
            style={{ left: percent(mark) }}
          />
        ))}
      </div>
      <div className="relative h-4 text-xs leading-4 text-muted-foreground tabular-nums">
        {marks.map((mark) => (
          <span
            key={mark}
            className="absolute -translate-x-1/2 whitespace-nowrap"
            style={{ left: percent(mark) }}
          >
            {formatRate(mark)}
          </span>
        ))}
      </div>
    </div>
  )
}

// Bật/tắt tự trả nợ, tự gia hạn (simulator áp dụng ở lần sang phiên kế tiếp)
function ServiceSettings({ account }: { account: MarginAccount }) {
  const { t } = useTranslation('margin')
  const update = useUpdateMarginSettings()

  function save(next: { autoRepay: boolean; autoRenew: boolean }) {
    update.mutate(next, {
      onSuccess: () => toast.success(t('settings.saved')),
      onError: (error) => toast.error(t(`errors.${marginErrorCode(error)}`)),
    })
  }

  const settings = [
    {
      id: 'autoRepay',
      label: t('settings.autoRepay'),
      hint: t('settings.autoRepayHint'),
      checked: account.auto_repay,
      onChange: (value: boolean) =>
        save({ autoRepay: value, autoRenew: account.auto_renew }),
    },
    {
      id: 'autoRenew',
      label: t('settings.autoRenew'),
      hint: t('settings.autoRenewHint'),
      checked: account.auto_renew,
      onChange: (value: boolean) =>
        save({ autoRepay: account.auto_repay, autoRenew: value }),
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-8 border-t bg-muted/30 px-6 py-4">
      {settings.map((item) => (
        <div key={item.id} className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <Label htmlFor={item.id}>{item.label}</Label>
            <p className="text-xs leading-4 text-muted-foreground">
              {item.hint}
            </p>
          </div>
          <Switch
            id={item.id}
            className="mt-0.5"
            checked={item.checked}
            disabled={update.isPending}
            onCheckedChange={item.onChange}
          />
        </div>
      ))}
    </div>
  )
}
