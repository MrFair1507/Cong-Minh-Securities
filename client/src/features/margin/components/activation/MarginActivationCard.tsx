import { DEFAULT_RATES } from '@cms/shared/margin'
import { BellRing, Calculator, ShieldCheck, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatRate } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { useActivationParams } from './useActivationParams'

// Khi chưa mở tài khoản: lời mời mở + điều cần biết bên trái, tham số mô phỏng bên phải.
// Gói vay vẫn hiện bên dưới (trang ráp ở MarginPage) để xem trước khi mở.
export function MarginActivationCard({
  kycVerified,
  onOpen,
  onTryIllustration,
}: {
  kycVerified: boolean
  onOpen: () => void
  onTryIllustration: () => void
}) {
  const { t } = useTranslation('margin')
  const params = useActivationParams()

  const know = [
    { icon: TrendingUp, text: t('activation.know1') },
    {
      icon: BellRing,
      text: t('activation.know2', { rate: formatRate(DEFAULT_RATES.callRate) }),
    },
    { icon: ShieldCheck, text: t('activation.know3') },
  ]

  return (
    <Card className="gap-0 p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-8">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl leading-7 font-semibold">
              {t('activation.title')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('activation.description')}
            </p>
          </div>
          <ul className="flex flex-col gap-2.5">
            {know.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5 text-sm">
                <Icon
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                {text}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="lg" onClick={onOpen} disabled={!kycVerified}>
              {t('actions.open')}
            </Button>
            <Button variant="outline" size="lg" onClick={onTryIllustration}>
              <Calculator aria-hidden />
              {t('activation.tryIllustration')}
            </Button>
          </div>
          {!kycVerified && (
            <p className="text-sm text-muted-foreground">
              {t('activation.kycRequired')}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2.5 self-start rounded-lg bg-muted/50 p-4 text-sm">
          <p className="text-xs font-medium text-muted-foreground">
            {t('activation.params')}
          </p>
          <dl className="contents">
            {params.map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-4"
              >
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="font-medium tabular-nums">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Card>
  )
}
