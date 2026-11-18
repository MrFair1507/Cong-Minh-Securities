import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatMoney } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { profileQueryOptions } from '../../api/profile'
import { StepHeading } from './RegisterStepper'

export function CompleteStep({ userId }: { userId?: string }) {
  const { t } = useTranslation('auth')
  const { data: profile } = useQuery({
    ...profileQueryOptions(userId ?? ''),
    enabled: Boolean(userId),
  })

  return (
    <div className="flex flex-col items-center gap-5">
      <span className="grid size-16 place-items-center rounded-full bg-safe-bg text-safe duration-500 animate-in fade-in zoom-in-50 motion-reduce:animate-none">
        <Check className="size-8" strokeWidth={3} aria-hidden />
      </span>

      <StepHeading
        title={t('kyc.complete.title')}
        description={t('kyc.complete.description')}
        className="items-center text-center"
      />

      <dl className="grid w-full grid-cols-2 divide-x rounded-lg border">
        <div className="flex flex-col gap-1 p-4">
          <dt className="text-xs text-muted-foreground">
            {t('kyc.complete.accountNo')}
          </dt>
          <dd className="font-mono text-lg font-semibold">
            {profile?.account_no ?? '—'}
          </dd>
        </div>
        <div className="flex flex-col gap-1 p-4">
          <dt className="text-xs text-muted-foreground">
            {t('kyc.complete.capital')}
          </dt>
          <dd className="text-lg font-semibold tabular-nums">
            {profile ? formatMoney(profile.cash_balance) : '—'}
          </dd>
        </div>
      </dl>

      <div className="grid w-full grid-cols-2 gap-3">
        <Button asChild size="lg" variant="outline">
          <Link to="/market">{t('kyc.complete.goToMarket')}</Link>
        </Button>
        <Button asChild size="lg">
          <Link to="/cash">{t('kyc.complete.deposit')}</Link>
        </Button>
      </div>
    </div>
  )
}
