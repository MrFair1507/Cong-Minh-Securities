import { repayToReach } from '@cms/shared/margin'
import { Info, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  formatClock,
  formatDateTime,
  formatMoney,
  formatRate,
  formatRatio,
} from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import type { MarginCall } from '../api/margin'
import type { MarginSummary } from '../hooks/useMarginSummary'

// Popup cảnh báo ký quỹ (frame 14). Số tài sản/dư nợ là số hiện tại, tỷ lệ là lúc cảnh báo.
export function MarginCallDialog({
  call,
  summary,
  onClose,
  onRepay,
}: {
  call: MarginCall
  summary: MarginSummary
  onClose: () => void
  onRepay: () => void
}) {
  const { t } = useTranslation('margin')
  const callRate = formatRate(summary.rates.callRate)
  const minRepay = repayToReach(
    summary.totalAssets,
    summary.debt,
    summary.rates.callRate,
  )

  const rows = [
    {
      label: t('call.time'),
      value: `${formatDateTime(call.created_at)} ${formatClock(call.created_at)}`,
    },
    { label: t('call.totalAssets'), value: formatMoney(summary.totalAssets) },
    {
      label: t('call.debt'),
      value: formatMoney(summary.debt),
      className: 'text-danger',
    },
  ]

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="ring-danger/40 sm:max-w-[460px]">
        <DialogHeader className="flex-row items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-danger-bg text-danger">
            <TriangleAlert className="size-5" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <DialogTitle className="text-lg font-semibold">
              {t('call.title')}
            </DialogTitle>
            <DialogDescription>
              {t('call.description', { rate: callRate })}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <span className="text-4xl font-semibold text-danger tabular-nums">
            {formatRatio(call.ratio_at_call)}
          </span>
          <Badge className="bg-danger-bg text-danger">
            {t('call.below', { rate: callRate })}
          </Badge>
        </div>

        <dl className="flex flex-col gap-1.5 rounded-lg bg-muted/60 px-4 py-3 text-sm tabular-nums">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className={`font-semibold ${row.className ?? ''}`}>
                {row.value}
              </dd>
            </div>
          ))}
          <div className="my-1 border-t" />
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">
              {t('call.minRepay', { rate: callRate })}
            </dt>
            <dd className="font-semibold">≈ {formatMoney(minRepay)}</dd>
          </div>
        </dl>

        <p className="flex gap-2 rounded-lg bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t('call.note')}
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('call.later')}
          </Button>
          <Button variant="destructive" onClick={onRepay}>
            {t('call.repayNow')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
