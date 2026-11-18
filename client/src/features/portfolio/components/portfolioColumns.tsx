import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import type { TFunction } from 'i18next'
import { BoardValue } from '@/features/market/components/BoardValue'
import { toneClass } from '@/features/market/lib/board'
import { createDataColumnHelper } from '@/shared/components/DataTable'
import {
  formatPercent,
  formatPrice,
  formatRatio,
  formatVolume,
} from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { allocationFill } from '../lib/allocationColors'
import type { PortfolioRow } from '../lib/portfolio'

const column = createDataColumnHelper<PortfolioRow>()

const RIGHT = { className: 'text-right' }

function profitClass(value: number) {
  return cn(value > 0 && 'text-price-up', value < 0 && 'text-price-down')
}

// Cột bảng Danh mục (frame 06). Giá theo nghìn đồng như bảng giá, tiền ghi đủ đồng.
export function portfolioColumns(
  t: TFunction<'portfolio'>,
  onSell: (row: PortfolioRow) => void,
) {
  return column.columns([
    column.accessor((row) => row.stock.symbol, {
      id: 'symbol',
      header: t('columns.symbol'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'size-2 shrink-0 rounded-full',
              allocationFill(row.original.slot),
            )}
            aria-hidden
          />
          <Link
            to="/stocks/$symbol"
            params={{ symbol: row.original.stock.symbol }}
            className="font-semibold hover:underline"
          >
            {row.original.stock.symbol}
          </Link>
        </div>
      ),
    }),
    column.accessor('quantity', {
      header: t('columns.quantity'),
      meta: RIGHT,
      cell: ({ getValue }) => formatVolume(getValue()),
    }),
    column.accessor('avgCost', {
      header: t('columns.avgCost'),
      meta: RIGHT,
      cell: ({ getValue }) => formatPrice(getValue()),
    }),
    column.accessor((row) => row.stock.price, {
      id: 'price',
      header: t('columns.price'),
      meta: RIGHT,
      // Tô màu theo tham chiếu/trần/sàn như bảng giá, nháy khi giá đổi
      cell: ({ row }) => {
        const { stock } = row.original
        return (
          <BoardValue
            value={stock.price}
            text={formatPrice(stock.price)}
            className={cn('-mx-1.5 font-medium', toneClass(stock.price, stock))}
          />
        )
      },
    }),
    column.accessor('value', {
      header: t('columns.value'),
      meta: RIGHT,
      cell: ({ getValue }) => (
        <span className="font-medium">{formatVolume(getValue())}</span>
      ),
    }),
    column.accessor('profit', {
      header: t('columns.profit'),
      meta: RIGHT,
      cell: ({ row }) => {
        const { profit, ratio } = row.original
        return (
          <div className={cn('flex flex-col', profitClass(profit))}>
            <span className="font-medium">
              {profit > 0 ? '+' : ''}
              {formatVolume(profit)}
            </span>
            <span className="text-xs opacity-80">{formatPercent(ratio)}</span>
          </div>
        )
      },
    }),
    column.accessor('weight', {
      header: t('columns.weight'),
      meta: RIGHT,
      cell: ({ getValue }) => formatRatio(getValue()),
    }),
    column.display({
      id: 'actions',
      header: () => <span className="sr-only">{t('sell')}</span>,
      meta: RIGHT,
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSell(row.original)}
          aria-label={t('sellLabel', { symbol: row.original.stock.symbol })}
        >
          {t('sell')}
        </Button>
      ),
    }),
  ])
}
