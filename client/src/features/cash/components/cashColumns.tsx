import type { TFunction } from 'i18next'
import { createDataColumnHelper } from '@/shared/components/DataTable'
import {
  formatDateTime,
  formatMoney,
  formatTime,
  formatVolume,
} from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { type Bank, bankName } from '../api/banks'
import type { CashRow } from '../api/cash'
import { type CashTxType, cashReference, maskAccount } from '../lib/cash'

const column = createDataColumnHelper<CashRow>()

// Màu nhãn theo loại giao dịch (viết đủ tên class để Tailwind quét được)
const TYPE_CLASS: Record<CashTxType, string> = {
  BUY: 'bg-price-up/10 text-price-up',
  SELL: 'bg-price-down/10 text-price-down',
  DEPOSIT: 'bg-safe-bg text-safe',
  WITHDRAW: 'border-border bg-background text-foreground',
  LOAN: 'bg-warning-bg text-warning',
  REPAY: 'bg-secondary text-secondary-foreground',
  INIT: 'bg-muted text-muted-foreground',
}

function describe(
  row: CashRow,
  t: TFunction<'cash'>,
  banks: Bank[] | undefined,
) {
  switch (row.type) {
    case 'BUY':
    case 'SELL':
      return t(`describe.${row.type}`, {
        quantity: formatVolume(row.orders?.quantity ?? 0),
        symbol: row.orders?.stocks.symbol ?? '',
      })
    case 'DEPOSIT':
    case 'WITHDRAW':
      return t(`describe.${row.type}`, {
        bank: row.bank_links ? bankName(banks, row.bank_links.bank_code) : '',
        account: row.bank_links ? maskAccount(row.bank_links.account_no) : '',
      })
    default:
      return t(`describe.${row.type}`)
  }
}

export function cashColumns(t: TFunction<'cash'>, banks: Bank[] | undefined) {
  return column.columns([
    column.accessor('created_at', {
      header: t('columns.time'),
      cell: ({ getValue }) => (
        <div className="flex flex-col">
          <span>{formatDateTime(getValue())}</span>
          <span className="text-xs text-muted-foreground">
            {formatTime(getValue())}
          </span>
        </div>
      ),
    }),
    column.accessor('type', {
      header: t('columns.type'),
      cell: ({ getValue }) => (
        <Badge variant="outline" className={TYPE_CLASS[getValue()]}>
          {t(`types.${getValue()}`)}
        </Badge>
      ),
    }),
    column.display({
      id: 'description',
      header: t('columns.description'),
      cell: ({ row }) => describe(row.original, t, banks),
    }),
    column.display({
      id: 'ref',
      header: t('columns.ref'),
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums">
          {cashReference(row.original)}
        </span>
      ),
    }),
    column.accessor('amount', {
      header: t('columns.amount'),
      meta: { className: 'text-right' },
      cell: ({ getValue }) => {
        const amount = getValue()
        return (
          <span
            className={`font-medium tabular-nums ${amount > 0 ? 'text-price-up' : 'text-price-down'}`}
          >
            {amount > 0 ? '+' : '−'}
            {formatVolume(Math.abs(amount))}
          </span>
        )
      },
    }),
    column.accessor('balance_after', {
      header: t('columns.balanceAfter'),
      meta: { className: 'text-right' },
      cell: ({ getValue }) => (
        <span className="tabular-nums">{formatMoney(getValue())}</span>
      ),
    }),
  ])
}
