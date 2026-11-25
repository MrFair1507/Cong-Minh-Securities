import { type IllustrationScenario, illustrateLoan } from '@cms/shared/margin'
import { cn } from 'cn'
import { Info, Trophy } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { BoardStock } from '@/features/market/api/stocks'
import { profitClass } from '@/features/trading/components/OrderSummary'
import { StockPicker } from '@/features/trading/components/StockPicker'
import { AmountField } from '@/shared/components/AmountField'
import { LOT_SIZE } from '@/shared/constants/market'
import {
  formatMoney,
  formatPercent,
  formatRate,
  formatVolume,
} from '@/shared/lib/format'
import { formatMoneyInput, parseMoney } from '@/shared/lib/money'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { type MarginPackage, packageCovers } from '../../lib/packages'

const DEFAULT_CAPITAL = 100_000_000
const DEFAULT_DAYS = 30
const DEFAULT_GAIN = 0.1 // giá bán mục tiêu mặc định: +10%

function ScenarioRows({ scenario }: { scenario: IllustrationScenario }) {
  const { t } = useTranslation('margin')
  const rows = [
    {
      label: t('illustration.quantity'),
      value: t('illustration.quantityValue', {
        quantity: formatVolume(scenario.quantity),
      }),
    },
    {
      label: t('illustration.investment'),
      value: formatMoney(scenario.investment),
    },
    { label: t('illustration.loan'), value: formatMoney(scenario.loan) },
    {
      label: t('illustration.interest'),
      value: formatMoney(scenario.interest),
    },
    {
      label: t('illustration.feeAndTax'),
      value: formatMoney(scenario.feeAndTax),
    },
  ]
  return (
    <dl className="flex flex-col gap-1.5 text-sm tabular-nums">
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="font-medium">{row.value}</dd>
        </div>
      ))}
      <div className="my-1 border-t" />
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">{t('illustration.profit')}</dt>
        <dd className={cn('font-semibold', profitClass(scenario.profit))}>
          {scenario.profit > 0 ? '+' : ''}
          {formatMoney(scenario.profit)} ({formatPercent(scenario.profitRatio)})
        </dd>
      </div>
    </dl>
  )
}


export function IllustrationTab({
  stocks,
  packages,
}: {
  stocks: BoardStock[]
  packages: MarginPackage[]
}) {
  const { t } = useTranslation('margin')
  const marginable = stocks.filter((stock) => stock.loan_rate > 0)
  const [symbol, setSymbol] = useState(marginable[0]?.symbol ?? '')
  const [pickerOpen, setPickerOpen] = useState(false)
  const stock = marginable.find((item) => item.symbol === symbol)

  const [capitalText, setCapitalText] = useState(
    formatMoneyInput(String(DEFAULT_CAPITAL)),
  )
  const [buyText, setBuyText] = useState(
    stock ? formatMoneyInput(String(stock.price)) : '',
  )
  const [sellText, setSellText] = useState(
    stock
      ? formatMoneyInput(String(Math.round(stock.price * (1 + DEFAULT_GAIN))))
      : '',
  )
  const [daysText, setDaysText] = useState(String(DEFAULT_DAYS))

  function pickStock(next: string) {
    setSymbol(next)
    const picked = marginable.find((item) => item.symbol === next)
    if (picked) {
      setBuyText(formatMoneyInput(String(picked.price)))
      setSellText(
        formatMoneyInput(String(Math.round(picked.price * (1 + DEFAULT_GAIN)))),
      )
    }
  }

  const capital = parseMoney(capitalText)
  const buyPrice = parseMoney(buyText)
  const sellPrice = parseMoney(sellText)
  const days = Number.parseInt(daysText, 10) || 0
  const valid =
    stock && capital > 0 && buyPrice > 0 && sellPrice > 0 && days > 0

  const result = valid
    ? illustrateLoan(
        {
          capital,
          buyPrice,
          sellPrice,
          days,
          loanRate: stock.loan_rate,
          lot: LOT_SIZE,
        },
        packages.map((pkg) => ({
          code: pkg.code,
          plan: pkg.plan,
          eligible: packageCovers(pkg, stock.id, stock.loan_rate),
        })),
      )
    : undefined
  const bestCode = result?.packages.find((item) => item.eligible)?.code

  const priceInput = (
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
  ) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="leading-5">
        {label}
      </Label>
      <Input
        id={id}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(formatMoneyInput(e.target.value))}
        className="h-9 px-3 text-right tabular-nums"
      />
    </div>
  )

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle className="font-semibold">
            {t('tabs.illustration')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('illustration.description')}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm leading-5 font-medium">
              {t('illustration.stock')}
            </span>
            <div className="flex items-center gap-2">
              <StockPicker
                stocks={marginable}
                value={symbol}
                onChange={pickStock}
                open={pickerOpen}
                onOpenChange={setPickerOpen}
              />
              {stock && (
                <span className="truncate text-xs text-muted-foreground">
                  {t('illustration.loanRate', {
                    rate: formatRate(stock.loan_rate),
                  })}
                </span>
              )}
            </div>
          </div>
          <AmountField
            id="illustrationCapital"
            label={t('illustration.capital')}
            value={capitalText}
            onChange={setCapitalText}
          />
          {priceInput(
            'illustrationBuy',
            t('illustration.buyPrice'),
            buyText,
            setBuyText,
          )}
          {priceInput(
            'illustrationSell',
            t('illustration.sellPrice'),
            sellText,
            setSellText,
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="illustrationDays" className="leading-5">
              {t('illustration.days')}
            </Label>
            <Input
              id="illustrationDays"
              inputMode="numeric"
              value={daysText}
              onChange={(e) =>
                setDaysText(e.target.value.replace(/\D/g, '').slice(0, 3))
              }
              className="h-9 px-3 text-right tabular-nums"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {result ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="font-semibold">
                    {t('illustration.cash')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScenarioRows scenario={result.cash} />
                </CardContent>
              </Card>
              {result.packages.map((item) => (
                <Card
                  key={item.code}
                  className={cn(!item.eligible && 'opacity-60')}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="font-semibold">
                        {t(`packages.${item.code}.name`)}
                      </CardTitle>
                      {item.code === bestCode && (
                        <Badge className="bg-safe-bg text-safe">
                          <Trophy aria-hidden />
                          {t('illustration.best')}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {item.eligible ? (
                      <>
                        <ScenarioRows scenario={item.scenario} />
                        <div className="flex justify-between gap-4 rounded-md bg-muted/60 px-3 py-2 text-sm">
                          <span className="text-muted-foreground">
                            {t('illustration.extra')}
                          </span>
                          <span
                            className={cn(
                              'font-semibold tabular-nums',
                              profitClass(item.extraRatio),
                            )}
                          >
                            {formatPercent(item.extraRatio)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {t('illustration.notEligible')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="flex gap-2 text-xs leading-5 text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t('illustration.note')}
            </p>
          </>
        ) : (
          <p className="rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground">
            {t('illustration.invalid')}
          </p>
        )}
      </div>
    </div>
  )
}
