import { packageInterest } from '@cms/shared/margin'
import { cn } from 'cn'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { BoardStock } from '@/features/market/api/stocks'
import { formatMoney, formatRate } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { COMPARE_AMOUNT, rateRange, TILE_DAYS } from '../../lib/packageExample'
import type { MarginPackage, PackageCode } from '../../lib/packages'
import { PackageDialog } from './PackageDialog'
import { usePackageActions } from './usePackageActions'


export function PackageTiles({
  packages,
  stocks,
  activeCode,
  hasAccount,
}: {
  packages: MarginPackage[]
  stocks: BoardStock[]
  activeCode: PackageCode
  hasAccount: boolean
}) {
  const { t } = useTranslation('margin')
  const [openCode, setOpenCode] = useState<PackageCode | null>(null)
  const actions = usePackageActions(packages, activeCode, () =>
    setOpenCode(null),
  )
  const marginableCount = stocks.filter((stock) => stock.loan_rate > 0).length
  const openPackage = packages.find((pkg) => pkg.code === openCode) ?? null

  const rateText = (pkg: MarginPackage) => {
    if (pkg.rate !== null) return formatRate(pkg.rate)
    const [min, max] = rateRange(pkg)
    return t('package.rateRange', {
      min: formatRate(min),
      max: formatRate(max),
    })
  }
  const stockCount = (pkg: MarginPackage) =>
    pkg.stockIds?.length ?? marginableCount
  const isActive = (pkg: MarginPackage) => hasAccount && pkg.code === activeCode

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-semibold">{t('package.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {hasAccount ? t('package.sectionHint') : t('package.needAccount')}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <button
            key={pkg.code}
            type="button"
            onClick={() => setOpenCode(pkg.code)}
            className={cn(
              'group flex flex-col gap-3 rounded-xl bg-card p-4 text-left text-sm ring-1 transition-colors outline-none hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50',
              isActive(pkg) ? 'ring-2 ring-foreground' : 'ring-foreground/10',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-medium">
                {t('package.named', { name: t(`packages.${pkg.code}.name`) })}
                {isActive(pkg) ? (
                  <Badge className="bg-safe-bg text-safe">
                    {t('package.active')}
                  </Badge>
                ) : (
                  pkg.code === 'BASIC' && (
                    <Badge variant="secondary">{t('package.default')}</Badge>
                  )
                )}
              </span>
              <ChevronRight
                className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl leading-8 font-semibold tabular-nums">
                {rateText(pkg)}
              </span>
              <span className="text-sm text-muted-foreground">
                {t('package.perYear')}
              </span>
            </div>
            <p className="text-xs leading-4 text-muted-foreground">
              {t(`packages.${pkg.code}.tagline`)}
            </p>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 border-t pt-3 text-xs">
              <dt className="text-muted-foreground">
                {t('package.tileInterest')}
              </dt>
              <dd className="text-right font-medium tabular-nums">
                {formatMoney(
                  packageInterest(COMPARE_AMOUNT, TILE_DAYS, pkg.plan),
                )}
              </dd>
              <dt className="text-muted-foreground">
                {t('package.stocksLabel')}
              </dt>
              <dd className="text-right font-medium">
                {t('package.stockCount', { count: stockCount(pkg) })}{' '}
                <span className="font-normal text-muted-foreground">
                  {pkg.stockIds
                    ? t('package.stocksBasket')
                    : t('package.stocksAll')}
                </span>
              </dd>
            </dl>
          </button>
        ))}
      </div>

      <PackageDialog
        pkg={openPackage}
        packages={packages}
        stocks={stocks}
        rateText={rateText}
        stockCount={stockCount}
        isActive={openPackage !== null && isActive(openPackage)}
        hasAccount={hasAccount}
        onOpenChange={(open) => !open && setOpenCode(null)}
        onRegister={actions.askRegister}
        onCancel={actions.askCancel}
      />
      {actions.dialog}
    </section>
  )
}
