import { marginRatio, marginStatus } from '@cms/shared/margin'
import { cn } from 'cn'
import { Info } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AmountField } from '@/shared/components/AmountField'
import { formatMoney, formatRatio, formatVolume } from '@/shared/lib/format'
import { parseMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Label } from '@/shared/ui/label'
import { marginErrorCode, useRepayLoan } from '../../api/marginActions'
import type { MarginSummary } from '../../hooks/useMarginSummary'
import { loanCode } from '../../lib/dates'
import { STATUS_TEXT } from '../../lib/status'

type RepayDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  summary: MarginSummary
  loanId?: number // khoản vay chọn sẵn; không có thì chọn khoản cũ nhất
}

// Hộp thoại Trả nợ ký quỹ (frame 13). Form nằm trong DialogContent nên mở lại là trống.
export function RepayDialog({
  open,
  onOpenChange,
  summary,
  loanId,
}: RepayDialogProps) {
  const { t } = useTranslation('margin')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {t('repay.title')}
          </DialogTitle>
          <DialogDescription>{t('repay.description')}</DialogDescription>
        </DialogHeader>
        <RepayForm
          summary={summary}
          loanId={loanId}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function RepayForm({
  summary,
  loanId,
  onDone,
}: {
  summary: MarginSummary
  loanId?: number
  onDone: () => void
}) {
  const { t } = useTranslation('margin')
  const repay = useRepayLoan()
  // Khoản cũ nhất trước (danh sách xếp id giảm dần)
  const loans = [...summary.activeLoans].reverse()
  const [selectedId, setSelectedId] = useState(loanId ?? loans[0]?.id)
  const [amountText, setAmountText] = useState('')
  const [touched, setTouched] = useState(false)

  const loan = loans.find((item) => item.id === selectedId)
  const cash = summary.position.cash
  const amount = parseMoney(amountText)
  const payable = loan ? Math.min(loan.debt, Math.floor(cash)) : 0

  let error: string | undefined
  if (touched && loan) {
    if (amount <= 0) error = t('repay.errors.required')
    else if (amount > loan.debt)
      error = t('repay.errors.exceedsDebt', { max: formatMoney(loan.debt) })
    else if (amount > cash)
      error = t('repay.errors.exceedsCash', { max: formatMoney(cash) })
  }
  const valid = loan && amount > 0 && amount <= loan.debt && amount <= cash

  const paid = valid ? amount : 0
  const debtAfter = summary.debt - paid
  const totalAfter = summary.totalAssets - paid
  const ratioAfter = marginRatio(totalAfter, debtAfter)
  const statusAfter = marginStatus(totalAfter, debtAfter, summary.rates)

  function submit() {
    setTouched(true)
    if (!valid || !loan) return
    repay.mutate(
      { loanId: loan.id, amount },
      {
        onSuccess: () => {
          toast.success(t('repay.success', { amount: formatMoney(amount) }))
          onDone()
        },
        onError: (e) => toast.error(t(`errors.${marginErrorCode(e)}`)),
      },
    )
  }

  const quick = [
    { label: '25%', amount: Math.floor(payable * 0.25) },
    { label: '50%', amount: Math.floor(payable * 0.5) },
    { label: t('repay.max'), amount: payable },
  ].map((item) => ({
    ...item,
    ariaLabel: t('repay.quick', { label: item.label }),
  }))

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="repayLoan" className="leading-5">
          {t('repay.loan')}
        </Label>
        <select
          id="repayLoan"
          value={selectedId ?? ''}
          onChange={(e) => {
            setSelectedId(Number(e.target.value))
            setAmountText('')
            setTouched(false)
          }}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          {loans.map((item) => (
            <option key={item.id} value={item.id}>
              {t('repay.loanOption', {
                code: loanCode(item.id),
                quantity: formatVolume(item.order_quantity),
                symbol: item.symbol,
              })}
            </option>
          ))}
        </select>
      </div>

      {loan && (
        <dl className="flex flex-col gap-1.5 rounded-lg bg-muted/60 px-4 py-3 text-sm tabular-nums">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t('repay.debt')}</dt>
            <dd className="font-semibold">{formatMoney(loan.debt)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t('repay.split')}</dt>
            <dd className="font-medium">
              {formatVolume(loan.outstanding)} ·{' '}
              {formatVolume(loan.interest_due)}
            </dd>
          </div>
        </dl>
      )}

      <AmountField
        id="repayAmount"
        label={t('repay.amount')}
        value={amountText}
        onChange={(value) => {
          setAmountText(value)
          setTouched(true)
        }}
        error={error}
        quick={quick}
      />

      <dl className="flex flex-col gap-1.5 rounded-lg bg-safe-bg/60 px-4 py-3 text-sm tabular-nums">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t('repay.cash')}</dt>
          <dd className="font-semibold">{formatMoney(cash)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t('repay.debtAfter')}</dt>
          <dd className="font-semibold">{formatMoney(debtAfter)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t('repay.ratioAfter')}</dt>
          <dd className={cn('font-semibold', STATUS_TEXT[statusAfter])}>
            {formatRatio(ratioAfter)}
          </dd>
        </div>
      </dl>

      <p className="flex gap-2 text-xs leading-5 text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t('repay.interestFirst')}
      </p>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          disabled={repay.isPending}
        >
          {t('repay.cancel')}
        </Button>
        <Button type="submit" disabled={!loan || repay.isPending}>
          {repay.isPending ? t('repay.submitting') : t('repay.submit')}
        </Button>
      </DialogFooter>
    </form>
  )
}
