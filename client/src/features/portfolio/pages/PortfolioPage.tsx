import {
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { Link, useRouteContext } from '@tanstack/react-router'
import { cn } from 'cn'
import { type ReactNode, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { profileQueryOptions } from '@/features/auth/api/profile'
import { useMarginSummary } from '@/features/margin/hooks/useMarginSummary'
import { stocksQueryOptions } from '@/features/market/api/stocks'
import { useStocksRealtime } from '@/features/market/hooks/useStocksRealtime'
import { OrderDialog } from '@/features/trading/components/OrderDialog'
import { DataTable } from '@/shared/components/DataTable'
import { PageHeader } from '@/shared/components/PageHeader'
import { formatMoney, formatPercent } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { holdingQueryOptions, holdingsQueryOptions } from '../api/holdings'
import { AllocationCard } from '../components/AllocationCard'
import { portfolioColumns } from '../components/portfolioColumns'
import { allocationSlices, buildPortfolio } from '../lib/portfolio'

const ROUTE_ID = '/_app/_authed/portfolio'

type Stat = {
  key: string
  label: string
  value: string
  hint?: ReactNode
  className?: string
}

export function PortfolioPage() {
  const { t } = useTranslation('portfolio')
  const { t: tc } = useTranslation()
  const { session } = useRouteContext({ from: ROUTE_ID })
  const userId = session.user.id
  const queryClient = useQueryClient()
  useStocksRealtime()

  const { data: holdings } = useSuspenseQuery(holdingsQueryOptions(userId))
  const { data: stocks } = useSuspenseQuery(stocksQueryOptions())
  const { data: profile } = useQuery(profileQueryOptions(userId))
  const [sellId, setSellId] = useState<number>()
  const sellStock = stocks.find((stock) => stock.id === sellId)

  const portfolio = useMemo(
    () => buildPortfolio(holdings, stocks),
    [holdings, stocks],
  )
  const slices = useMemo(
    () => allocationSlices(portfolio.rows),
    [portfolio.rows],
  )
  const columns = useMemo(
    () =>
      portfolioColumns(t, (row) => {
        queryClient.setQueryData(
          holdingQueryOptions(userId, row.stock.id).queryKey,
          () => ({ quantity: row.quantity, avg_cost: row.avgCost }),
        )
        setSellId(row.stock.id)
      }),
    [t, queryClient, userId],
  )

  const cash = profile?.cash_balance ?? 0
  // Dư nợ ký quỹ (gốc + lãi tạm tính): tài sản ròng = tổng tài sản − nợ
  const { debt } = useMarginSummary(userId)
  const total = portfolio.marketValue + cash
  const { profit } = portfolio
  const stats: Stat[] = [
    {
      key: 'total',
      label: t('stats.total'),
      value: formatMoney(total),
      hint:
        debt > 0
          ? t('stats.netHint', { value: formatMoney(total - debt) })
          : t('stats.totalHint'),
    },
    {
      key: 'marketValue',
      label: t('stats.marketValue'),
      value: formatMoney(portfolio.marketValue),
      hint: t('stats.marketValueHint', { n: portfolio.rows.length }),
    },
    {
      key: 'profit',
      label: t('stats.profit'),
      value: `${profit > 0 ? '+' : ''}${formatMoney(profit)}`,
      hint: t('stats.profitHint', { percent: formatPercent(portfolio.ratio) }),
      className: cn(
        profit > 0 && 'text-price-up',
        profit < 0 && 'text-price-down',
      ),
    },
    {
      key: 'cash',
      label: t('stats.cash'),
      value: formatMoney(cash),
      hint:
        debt > 0 ? (
          <Link
            to="/margin"
            className="text-danger underline-offset-4 hover:underline"
          >
            {t('stats.debtHint', { debt: formatMoney(debt) })}
          </Link>
        ) : (
          <Link to="/cash" className="underline-offset-4 hover:underline">
            {t('stats.cashHint')}
          </Link>
        ),
    },
  ]

  const hasHoldings = portfolio.rows.length > 0

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={tc('pages.portfolio.title')}
        description={tc('pages.portfolio.description')}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.key} className="py-5">
            <CardContent className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">
                {stat.label}
              </span>
              <span
                className={cn(
                  'text-xl font-semibold tabular-nums',
                  stat.className,
                )}
              >
                {stat.value}
              </span>
              <span
                className={cn('text-xs text-muted-foreground', stat.className)}
              >
                {stat.hint}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div
        className={cn(
          'grid items-start gap-4',
          hasHoldings && 'lg:grid-cols-[minmax(0,1fr)_340px]',
        )}
      >
        <DataTable
          columns={columns}
          data={portfolio.rows}
          getRowId={(row) => String(row.stock.id)}
          empty={
            <div className="flex flex-col items-center gap-3">
              <p>{t('empty')}</p>
              <Button asChild variant="outline" size="sm">
                <Link to="/market">{t('toMarket')}</Link>
              </Button>
            </div>
          }
        />
        {hasHoldings && (
          <AllocationCard
            slices={slices}
            stockCount={portfolio.rows.length}
            marketValue={portfolio.marketValue}
          />
        )}
      </div>

      {sellStock && (
        <OrderDialog
          stock={sellStock}
          userId={userId}
          side="SELL"
          open
          onOpenChange={(open) => !open && setSellId(undefined)}
        />
      )}
    </div>
  )
}
