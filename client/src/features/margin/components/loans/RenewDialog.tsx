import { MAX_RENEWALS, RENEW_WINDOW_DAYS, renewError } from '@cms/shared/margin'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { formatDate } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import type { MarginLoan } from '../../api/margin'
import { marginErrorCode, useRenewLoan } from '../../api/marginActions'
import type { MarginSummary } from '../../hooks/useMarginSummary'
import { addDays, loanCode, vnToday } from '../../lib/dates'

// Hỏi lại trước khi gia hạn. Chưa đủ điều kiện thì nói lý do và khóa nút (RPC cũng kiểm lại).
export function RenewDialog({
  loan,
  termDays,
  summary,
  onClose,
}: {
  loan: MarginLoan | null
  termDays: number
  summary: MarginSummary
  onClose: () => void
}) {
  const { t } = useTranslation('margin')
  const renew = useRenewLoan()
  if (!loan) return null

  const blocked = renewError({
    dueDate: loan.due_date,
    today: vnToday(),
    renewCount: loan.renew_count,
    ratio: summary.ratio,
    callRate: summary.rates.callRate,
  })
  const newDue = addDays(loan.due_date, termDays)

  function submit() {
    if (!loan) return
    renew.mutate(loan.id, {
      onSuccess: (date) => {
        toast.success(t('renew.success', { date: formatDate(date) }))
        onClose()
      },
      onError: (error) => toast.error(t(`errors.${marginErrorCode(error)}`)),
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {t('renew.title', { code: loanCode(loan.id) })}
          </DialogTitle>
          <DialogDescription>
            {blocked
              ? t(`renew.unavailable.${blocked}`, {
                  days: RENEW_WINDOW_DAYS,
                  count: MAX_RENEWALS,
                })
              : t('renew.description', {
                  date: formatDate(newDue),
                  days: termDays,
                  left: MAX_RENEWALS - loan.renew_count - 1,
                })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={renew.isPending}
          >
            {t('renew.cancel')}
          </Button>
          <Button
            onClick={submit}
            disabled={Boolean(blocked) || renew.isPending}
          >
            {t('renew.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
