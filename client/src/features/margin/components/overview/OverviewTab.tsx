import { Link } from '@tanstack/react-router'
import { CircleAlert, HandCoins } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { DataTable } from '@/shared/components/DataTable'
import { Button } from '@/shared/ui/button'
import type { MarginLoan } from '../../api/margin'
import type { MarginSummary } from '../../hooks/useMarginSummary'
import { vnToday } from '../../lib/dates'
import { isDueSoon, loansColumns } from './loansColumns'
import { MarginHero } from './MarginHero'

// Tổng quan khi đã mở tài khoản: khối tỷ lệ + dư nợ + cài đặt, rồi bảng khoản vay
export function OverviewTab({
  summary,
  onRepay,
  onRepayAny,
  onRenew,
}: {
  summary: MarginSummary
  onRepay: (loan: MarginLoan) => void
  onRepayAny: () => void
  onRenew: (loan: MarginLoan) => void
}) {
  const { t } = useTranslation('margin')
  const today = vnToday()
  const columns = useMemo(
    () => loansColumns(t, today, onRepay, onRenew),
    [t, today, onRepay, onRenew],
  )
  const { loans } = summary
  const overdue = loans.filter((loan) => loan.status === 'OVERDUE').length
  const dueSoon = loans.filter((loan) => isDueSoon(loan, today)).length
  const alerts = [
    overdue > 0 && t('loans.alertOverdue', { count: overdue }),
    dueSoon > 0 && t('loans.alertDue', { count: dueSoon }),
  ].filter(Boolean)

  return (
    <>
      <MarginHero summary={summary} onRepay={onRepayAny} />

      <section className="flex flex-col gap-3">
        {loans.length === 0 ? (
          <>
            <h2 className="text-base font-semibold">{t('loans.title')}</h2>
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center">
              <span className="grid size-10 place-items-center rounded-lg bg-muted text-muted-foreground">
                <HandCoins className="size-5" aria-hidden />
              </span>
              <div className="flex flex-col gap-1">
                <p className="font-medium">{t('loans.emptyTitle')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('loans.empty')}
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/market">{t('loans.emptyAction')}</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">{t('loans.title')}</h2>
                <span className="text-sm text-muted-foreground">
                  {t('loans.summary', {
                    active: summary.activeLoans.length,
                    paid: loans.length - summary.activeLoans.length,
                  })}
                </span>
              </div>
              {alerts.length > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-danger">
                  <CircleAlert className="size-4" aria-hidden />
                  {alerts.join(', ')}
                </span>
              )}
            </div>
            <DataTable
              columns={columns}
              data={loans}
              getRowId={(loan) => String(loan.id)}
              pageSize={10}
              empty={t('loans.empty')}
            />
          </>
        )}
      </section>
    </>
  )
}
