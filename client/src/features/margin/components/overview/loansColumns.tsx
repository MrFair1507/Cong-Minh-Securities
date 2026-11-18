import {
  daysBetween,
  MAX_RENEWALS,
  RENEW_WINDOW_DAYS,
} from '@cms/shared/margin'
import type { TFunction } from 'i18next'
import { createDataColumnHelper } from '@/shared/components/DataTable'
import { formatDate, formatRate, formatVolume } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import type { MarginLoan } from '../../api/margin'
import { loanCode } from '../../lib/dates'

const column = createDataColumnHelper<MarginLoan>()

// Khoản vay còn hạn mà còn ≤ RENEW_WINDOW_DAYS ngày: "sắp tới hạn", được gia hạn
export function isDueSoon(loan: MarginLoan, today: string): boolean {
  return (
    loan.status === 'ACTIVE' &&
    daysBetween(today, loan.due_date) <= RENEW_WINDOW_DAYS
  )
}

// Bảng Khoản vay: trạng thái gộp vào cột Hạn trả (sắp hạn, quá hạn, đã trả)
export function loansColumns(
  t: TFunction<'margin'>,
  today: string,
  onRepay: (loan: MarginLoan) => void,
  onRenew: (loan: MarginLoan) => void,
) {
  return column.columns([
    column.accessor('id', {
      header: t('loans.columns.code'),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium tabular-nums">
            {loanCode(row.original.id)}
          </span>
          <span className="text-xs text-muted-foreground">
            {t('loans.orderValue', {
              symbol: row.original.symbol,
              quantity: formatVolume(row.original.order_quantity),
            })}
          </span>
        </div>
      ),
    }),
    column.accessor('package_code', {
      header: t('loans.columns.package'),
      cell: ({ row }) => {
        const { package_code: code, interest_rate: rate } = row.original
        const name = t(
          `packages.${code as 'BASIC' | 'PREFERRED' | 'TIERED'}.name`,
        )
        return rate === null ? name : `${name} · ${formatRate(rate)}`
      },
    }),
    column.accessor('loan_date', {
      header: t('loans.columns.loanDate'),
      cell: ({ getValue }) => (
        <span className="tabular-nums">{formatDate(getValue())}</span>
      ),
    }),
    column.accessor('due_date', {
      header: t('loans.columns.dueDate'),
      cell: ({ row }) => {
        const loan = row.original
        const left = daysBetween(today, loan.due_date)
        let tag = null
        if (loan.status === 'PAID')
          tag = (
            <span className="text-xs text-muted-foreground">
              {t('loans.paidOff')}
            </span>
          )
        else if (loan.status === 'OVERDUE')
          tag = (
            <Badge className="bg-danger-bg text-danger">
              {t('loans.overdueBy', { days: -left })}
            </Badge>
          )
        else if (isDueSoon(loan, today))
          tag = (
            <Badge className="bg-warning-bg text-warning">
              {t('loans.dueIn', { days: left })}
            </Badge>
          )
        return (
          <div className="flex flex-col gap-0.5">
            <span className="tabular-nums">{formatDate(loan.due_date)}</span>
            {tag}
          </div>
        )
      },
    }),
    column.accessor('principal', {
      header: t('loans.columns.principal'),
      meta: { className: 'text-right' },
      cell: ({ getValue }) => (
        <span className="tabular-nums">{formatVolume(getValue())}</span>
      ),
    }),
    column.accessor('interest_due', {
      header: t('loans.columns.interest'),
      meta: { className: 'text-right' },
      cell: ({ getValue }) => (
        <span className="tabular-nums">{formatVolume(getValue())}</span>
      ),
    }),
    column.accessor('debt', {
      header: t('loans.columns.debt'),
      meta: { className: 'text-right' },
      cell: ({ row }) => (
        <span
          className={
            row.original.status === 'PAID'
              ? 'tabular-nums'
              : 'font-semibold tabular-nums'
          }
        >
          {formatVolume(row.original.debt)}
        </span>
      ),
    }),
    column.display({
      id: 'actions',
      header: () => (
        <span className="sr-only">{t('loans.columns.actions')}</span>
      ),
      meta: { className: 'text-right' },
      cell: ({ row }) =>
        row.original.status === 'PAID' ? null : (
          <div className="flex justify-end gap-1.5">
            {isDueSoon(row.original, today) &&
              row.original.renew_count < MAX_RENEWALS && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRenew(row.original)}
                >
                  {t('actions.renew')}
                </Button>
              )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRepay(row.original)}
            >
              {t('actions.repay')}
            </Button>
          </div>
        ),
    }),
  ])
}
