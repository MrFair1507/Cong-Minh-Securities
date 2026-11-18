import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import type { TFunction } from 'i18next'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { BoardStock } from '@/features/market/api/stocks'
import { toneClass } from '@/features/market/lib/board'
import {
  createDataColumnHelper,
  DataTable,
} from '@/shared/components/DataTable'
import { formatPercent, formatPrice, formatRate } from '@/shared/lib/format'
import { foldText } from '@/shared/lib/text'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { type MarginPackage, packageCovers } from '../../lib/packages'

const column = createDataColumnHelper<BoardStock>()

function stockColumns(t: TFunction<'margin'>, packages: MarginPackage[]) {
  return column.columns([
    column.accessor('symbol', {
      header: t('stocks.columns.symbol'),
      cell: ({ row }) => (
        <Link
          to="/stocks/$symbol"
          params={{ symbol: row.original.symbol }}
          className={cn(
            'font-semibold underline-offset-4 hover:underline',
            toneClass(row.original.price, row.original),
          )}
        >
          {row.original.symbol}
        </Link>
      ),
    }),
    column.accessor('name', {
      header: t('stocks.columns.name'),
      cell: ({ getValue }) => (
        <span className="line-clamp-1 max-w-[320px]" title={getValue()}>
          {getValue()}
        </span>
      ),
    }),
    column.display({
      id: 'exchange',
      header: t('stocks.columns.exchange'),
      cell: ({ row }) => row.original.exchanges.code,
    }),
    column.accessor('price', {
      header: t('stocks.columns.price'),
      meta: { className: 'text-right' },
      cell: ({ row }) => (
        <span
          className={cn(
            'font-medium tabular-nums',
            toneClass(row.original.price, row.original),
          )}
        >
          {formatPrice(row.original.price)}
        </span>
      ),
    }),
    column.display({
      id: 'change',
      header: t('stocks.columns.change'),
      meta: { className: 'text-right' },
      cell: ({ row }) => {
        const { price, ref_price } = row.original
        return (
          <span className={cn('tabular-nums', toneClass(price, row.original))}>
            {formatPercent(ref_price > 0 ? (price - ref_price) / ref_price : 0)}
          </span>
        )
      },
    }),
    column.accessor('loan_rate', {
      header: t('stocks.columns.loanRate'),
      meta: { className: 'text-right' },
      cell: ({ getValue }) => (
        <span className="font-semibold tabular-nums">
          {formatRate(getValue())}
        </span>
      ),
    }),
    column.display({
      id: 'packages',
      header: t('stocks.columns.packages'),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {packages
            .filter((pkg) =>
              packageCovers(pkg, row.original.id, row.original.loan_rate),
            )
            .map((pkg) => (
              <Badge key={pkg.code} variant="outline">
                {t(`packages.${pkg.code}.name`)}
              </Badge>
            ))}
        </div>
      ),
    }),
  ])
}

export function MarginStocksTab({
  stocks,
  packages,
}: {
  stocks: BoardStock[]
  packages: MarginPackage[]
}) {
  const { t } = useTranslation('margin')
  const [exchange, setExchange] = useState('ALL')
  const [query, setQuery] = useState('')
  const columns = useMemo(() => stockColumns(t, packages), [t, packages])

  const marginable = stocks.filter((stock) => stock.loan_rate > 0)
  const exchanges = [...new Set(marginable.map((s) => s.exchanges.code))]
  const needle = foldText(query.trim())
  const rows = marginable.filter(
    (stock) =>
      (exchange === 'ALL' || stock.exchanges.code === exchange) &&
      (!needle ||
        foldText(stock.symbol).includes(needle) ||
        foldText(stock.name).includes(needle)),
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Tabs value={exchange} onValueChange={setExchange}>
            <TabsList aria-label={t('stocks.exchange')}>
              <TabsTrigger value="ALL">{t('stocks.all')}</TabsTrigger>
              {exchanges.map((code) => (
                <TabsTrigger key={code} value={code}>
                  {code}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <span className="text-xs text-muted-foreground">
            {t('stocks.count', { count: marginable.length })}
          </span>
        </div>
        <div className="relative w-64">
          <Search
            className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('stocks.search')}
            aria-label={t('stocks.searchLabel')}
            className="h-8 pl-8"
          />
        </div>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(stock) => String(stock.id)}
        empty={t('stocks.empty')}
      />
    </div>
  )
}
