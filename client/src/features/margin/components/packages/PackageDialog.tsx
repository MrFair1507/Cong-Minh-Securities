import {
  MAX_RENEWALS,
  packageInterest,
  RENEW_WINDOW_DAYS,
} from '@cms/shared/margin'
import { cn } from 'cn'
import { Check, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { BoardStock } from '@/features/market/api/stocks'
import { formatMoney, formatRate } from '@/shared/lib/format'
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
import {
  COMPARE_AMOUNT,
  COMPARE_DAYS,
  type ExamplePart,
  packageExample,
} from '../../lib/packageExample'
import type { MarginPackage } from '../../lib/packages'

// Màu từng đoạn của thanh ví dụ: mã ngoài rổ màu cảnh báo; bậc miễn lãi màu an toàn, các bậc sau đậm dần
const TIER_TONES = ['bg-foreground/40', 'bg-foreground/65', 'bg-foreground']

function partTone(part: ExamplePart, index: number): string {
  if (part.kind === 'basket')
    return part.inBasket ? 'bg-foreground' : 'bg-warning'
  if (part.rate === 0) return 'bg-safe'
  return (
    TIER_TONES[Math.min(index - 1, TIER_TONES.length - 1)] ?? 'bg-foreground'
  )
}

type PackageDialogProps = {
  pkg: MarginPackage | null
  packages: MarginPackage[]
  stocks: BoardStock[]
  rateText: (pkg: MarginPackage) => string
  stockCount: (pkg: MarginPackage) => number
  isActive: boolean
  hasAccount: boolean
  onOpenChange: (open: boolean) => void
  onRegister: (pkg: MarginPackage) => void
  onCancel: (pkg: MarginPackage) => void
}

// Popup chi tiết gói vay: lãi suất và chỉ số chính, điều kiện, cách tính lãi, ví dụ, rổ mã, lưu ý
export function PackageDialog({
  pkg,
  packages,
  stocks,
  rateText,
  stockCount,
  isActive,
  hasAccount,
  onOpenChange,
  onRegister,
  onCancel,
}: PackageDialogProps) {
  return (
    <Dialog open={pkg !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-4rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[640px]">
        {pkg && (
          <PackageDetail
            pkg={pkg}
            packages={packages}
            stocks={stocks}
            rateText={rateText}
            stockCount={stockCount}
            isActive={isActive}
            hasAccount={hasAccount}
            onClose={() => onOpenChange(false)}
            onRegister={onRegister}
            onCancel={onCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function PackageDetail({
  pkg,
  packages,
  stocks,
  rateText,
  stockCount,
  isActive,
  hasAccount,
  onClose,
  onRegister,
  onCancel,
}: Omit<PackageDialogProps, 'pkg' | 'onOpenChange'> & {
  pkg: MarginPackage
  onClose: () => void
}) {
  const { t } = useTranslation('margin')
  const name = t(`packages.${pkg.code}.name`)
  const basic = packages.find((item) => item.code === 'BASIC')
  const rival = packages.find(
    (item) => item.exclusive && pkg.exclusive && item.code !== pkg.code,
  )
  const example = packageExample(pkg, packages, stocks)
  const basket = pkg.stockIds
    ? stocks.filter((stock) => pkg.stockIds?.includes(stock.id))
    : []

  const stats = [
    {
      label: t('package.rateLabel'),
      value: rateText(pkg),
      unit: t('package.perYear'),
    },
    {
      label: t('package.termLabel'),
      value: t('package.termDays', { days: pkg.termDays }),
    },
    {
      label: t('package.stocksLabel'),
      value: t('package.stockCount', { count: stockCount(pkg) }),
    },
    {
      label: t('package.renewLabel'),
      value: t('package.renewValue', { count: MAX_RENEWALS }),
    },
  ]

  let how = t('package.howTiered')
  if (pkg.rate !== null)
    how =
      pkg.stockIds && basic?.rate != null
        ? t('package.howBasket', {
            rate: formatRate(pkg.rate),
            basic: formatRate(basic.rate),
          })
        : t('package.howFixed', { rate: formatRate(pkg.rate) })

  const notes =
    pkg.code === 'BASIC'
      ? [
          t('package.noteBasic'),
          t('package.noteTerm', {
            days: pkg.termDays,
            window: RENEW_WINDOW_DAYS,
            count: MAX_RENEWALS,
          }),
        ]
      : [
          t('package.noteNew'),
          ...(rival
            ? [
                t('package.noteExclusive', {
                  name: t(`packages.${rival.code}.name`),
                }),
              ]
            : []),
        ]

  const partLabel = (part: ExamplePart) =>
    part.kind === 'basket'
      ? t(part.inBasket ? 'package.inBasket' : 'package.outBasket', {
          symbol: part.symbol,
          amount: formatMoney(part.amount),
        })
      : t('package.tierRange', { from: part.fromDay, to: part.toDay })

  return (
    <>
      <DialogHeader className="px-6 pt-5 pb-4 pr-12">
        <div className="flex items-center gap-2">
          <DialogTitle className="text-lg leading-7 font-semibold">
            {t('package.named', { name })}
          </DialogTitle>
          {isActive ? (
            <Badge className="bg-safe-bg text-safe">
              {t('package.active')}
            </Badge>
          ) : (
            pkg.code === 'BASIC' && (
              <Badge variant="secondary">{t('package.default')}</Badge>
            )
          )}
        </div>
        <DialogDescription>
          {t(`packages.${pkg.code}.tagline`)}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-6 overflow-y-auto px-6 pb-6">
        <dl className="grid grid-cols-[1.5fr_1fr_1fr_1fr] divide-x rounded-lg bg-muted/50 py-3">
          {stats.map((stat, index) => (
            <div key={stat.label} className="flex flex-col gap-1 px-4">
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd
                className={cn(
                  'leading-7 font-semibold whitespace-nowrap tabular-nums',
                  index === 0 ? 'text-xl' : 'text-base',
                )}
              >
                {stat.value}
                {stat.unit && (
                  <span className="text-xs font-normal text-muted-foreground">
                    {stat.unit}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>

        <section className="flex flex-col gap-2.5">
          <h3 className="text-sm font-semibold">
            {t('package.conditionsTitle')}
          </h3>
          <ul className="flex flex-col gap-2">
            {(['condition1', 'condition2', 'condition3'] as const).map(
              (key) => (
                <li key={key} className="flex items-start gap-2">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-safe"
                    aria-hidden
                  />
                  {t(`packages.${pkg.code}.${key}`)}
                </li>
              ),
            )}
          </ul>
        </section>

        <section className="flex flex-col gap-1.5">
          <h3 className="text-sm font-semibold">{t('package.how')}</h3>
          <p className="leading-6 text-muted-foreground">{how}</p>
        </section>

        {example && (
          <section className="flex flex-col gap-2.5">
            <h3 className="text-sm font-semibold">
              {t('package.splitTitle', {
                amount: formatMoney(example.amount),
                days: example.days,
              })}
            </h3>
            <div
              aria-hidden
              className="flex h-2.5 gap-0.5 overflow-hidden rounded-full"
            >
              {example.parts.map((part, index) => (
                <span
                  key={partLabel(part)}
                  className={partTone(part, index)}
                  style={{ flex: part.weight }}
                />
              ))}
            </div>
            <ul className="flex flex-col gap-1.5">
              {example.parts.map((part, index) => (
                <li key={partLabel(part)} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      'size-2 shrink-0 rounded-full',
                      partTone(part, index),
                    )}
                  />
                  <span className="flex-1 text-muted-foreground">
                    {partLabel(part)}
                  </span>
                  <span className="w-20 text-right text-muted-foreground tabular-nums">
                    {formatRate(part.rate)}
                  </span>
                  <span className="w-28 text-right font-medium tabular-nums">
                    {formatMoney(part.interest)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between border-t pt-2">
              <span className="text-muted-foreground">
                {t('package.totalInterest')}
              </span>
              <span className="font-semibold tabular-nums">
                {formatMoney(example.total)}
              </span>
            </div>
          </section>
        )}

        <section className="flex flex-col gap-2.5">
          <h3 className="text-sm font-semibold">
            {t('package.interestBy', { amount: formatMoney(COMPARE_AMOUNT) })}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {COMPARE_DAYS.map((days) => (
              <div
                key={days}
                className="flex flex-col gap-0.5 rounded-lg border px-3 py-2.5"
              >
                <span className="text-xs text-muted-foreground">
                  {t('package.days', { count: days })}
                </span>
                <span className="font-semibold tabular-nums">
                  {formatMoney(packageInterest(COMPARE_AMOUNT, days, pkg.plan))}
                </span>
              </div>
            ))}
          </div>
        </section>

        {basket.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <h3 className="text-sm font-semibold">
              {t('package.basketCount', { count: basket.length })}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {basket.map((stock) => (
                <span
                  key={stock.id}
                  className="inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-medium"
                >
                  {stock.symbol}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className="flex gap-2.5 rounded-lg bg-warning-bg p-3 text-warning">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <ul className="flex flex-col gap-1 text-sm leading-5">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      </div>

      <DialogFooter className="mx-0 mb-0 px-6 py-4">
        <Button variant="outline" size="lg" onClick={onClose}>
          {t('package.closeDetail')}
        </Button>
        {pkg.code !== 'BASIC' &&
          (!hasAccount ? (
            <Button size="lg" disabled>
              {t('package.needAccountShort')}
            </Button>
          ) : isActive ? (
            <Button variant="outline" size="lg" onClick={() => onCancel(pkg)}>
              {t('package.cancel')}
            </Button>
          ) : (
            <Button size="lg" onClick={() => onRegister(pkg)}>
              {t('package.registerNamed', { name })}
            </Button>
          ))}
      </DialogFooter>
    </>
  )
}
