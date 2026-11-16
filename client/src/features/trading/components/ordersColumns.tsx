import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import type { TFunction } from 'i18next'
import { createDataColumnHelper } from '@/shared/components/DataTable'
import {
  formatDateTime,
  formatPrice,
  formatTime,
  formatVolume,
} from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import type { OrderRow } from '../api/orders'

const column = createDataColumnHelper<OrderRow>()

const RIGHT = { className: 'text-right' }

const SIDE_BADGE = {
  BUY: 'bg-price-up/10 text-price-up',
  SELL: 'bg-price-down/10 text-price-down',
} as const

// Cột bảng Lịch sử lệnh (frame 05). Giá theo nghìn đồng như bảng giá, tiền ghi đủ đồng.
export function ordersColumns(t: TFunction<'trading'>) {
  return column.columns([
    column.accessor('created_at', {
      header: t('orders.columns.time'),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {formatDateTime(row.original.created_at)}
          </span>
          <span className="text-xs text-muted-foreground">
            {t('orders.orderNo', {
              time: formatTime(row.original.created_at),
              id: row.original.id,
            })}
          </span>
        </div>
      ),
    }),
    column.accessor((order) => order.stocks.symbol, {
      id: 'symbol',
      header: t('orders.columns.symbol'),
      cell: ({ getValue }) => (
        <Link
          to="/stocks/$symbol"
          params={{ symbol: getValue() }}
          className="font-semibold hover:underline"
        >
          {getValue()}
        </Link>
      ),
    }),
    column.accessor('side', {
      header: t('orders.columns.side'),
      cell: ({ getValue }) => (
        <Badge className={cn('border-transparent', SIDE_BADGE[getValue()])}>
          {t(`side.${getValue()}`)}
        </Badge>
      ),
    }),
    column.accessor('quantity', {
      header: t('orders.columns.quantity'),
      meta: RIGHT,
      cell: ({ getValue }) => formatVolume(getValue()),
    }),
    column.accessor('price', {
      header: t('orders.columns.price'),
      meta: RIGHT,
      cell: ({ getValue }) => formatPrice(getValue()),
    }),
    column.accessor((order) => order.price * order.quantity, {
      id: 'value',
      header: t('orders.columns.value'),
      meta: RIGHT,
      cell: ({ getValue }) => (
        <span className="font-medium">{formatVolume(getValue())}</span>
      ),
    }),
    column.accessor((order) => order.fee + order.tax, {
      id: 'feeTax',
      header: t('orders.columns.feeTax'),
      meta: RIGHT,
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">
          {formatVolume(getValue())}
        </span>
      ),
    }),
    column.accessor((order) => order.margin_loans?.principal, {
      id: 'loan',
      header: t('orders.columns.loan'),
      meta: RIGHT,
      cell: ({ getValue }) => {
        const principal = getValue()
        return principal ? (
          <span className="font-medium text-warning">
            {formatVolume(principal)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    }),
    column.display({
      id: 'status',
      header: t('orders.columns.status'),
      cell: () => <Badge variant="secondary">{t('orders.filled')}</Badge>,
    }),
  ])
}
