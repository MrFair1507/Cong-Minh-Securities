import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { profileQueryOptions } from '@/features/auth/api/profile'
import {
  SummaryBox,
  SummaryRow,
} from '@/features/trading/components/OrderSummary'
import { formatMoney } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { bankErrorCode, useWithdraw } from '../api/bankActions'
import {
  bankLinksQueryOptions,
  bankName,
  banksQueryOptions,
} from '../api/banks'
import { MIN_TRANSFER, maskAccount, parseMoney } from '../lib/cash'
import {
  AmountField,
  ChoiceCards,
  OtpField,
  useAmountError,
  useOtp,
} from './BankParts'

const QUICK_RATIOS = [0.25, 0.5, 0.75, 1] as const

type WithdrawDialogProps = {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onLink: () => void // chưa có tài khoản liên kết: mở hộp thoại liên kết
}

// Rút tiền mặt chứng khoán về ngân hàng mô phỏng: bước 1 chọn TK + số tiền, bước 2 xác nhận + OTP
export function WithdrawDialog({
  userId,
  open,
  onOpenChange,
  onLink,
}: WithdrawDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 sm:max-w-[520px]">
        <WithdrawSteps
          userId={userId}
          onDone={() => onOpenChange(false)}
          onLink={onLink}
        />
      </DialogContent>
    </Dialog>
  )
}

function WithdrawSteps({
  userId,
  onDone,
  onLink,
}: {
  userId: string
  onDone: () => void
  onLink: () => void
}) {
  const { t } = useTranslation('cash')
  const { data: banks } = useQuery(banksQueryOptions())
  const { data: links = [] } = useQuery(bankLinksQueryOptions(userId))
  const { data: profile } = useQuery(profileQueryOptions(userId))
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [linkId, setLinkId] = useState(links[0]?.id)
  const [amountText, setAmountText] = useState('')
  const [touched, setTouched] = useState(false)
  const [otpValue, setOtpValue] = useState('')
  const otp = useOtp('WITHDRAW')
  const withdraw = useWithdraw()

  const link = links.find((l) => l.id === linkId) ?? links[0]
  const cash = profile?.cash_balance ?? 0
  const amount = parseMoney(amountText)
  const amountError = useAmountError(amount, cash, touched || amount > 0)
  const valid = Boolean(link) && amount >= MIN_TRANSFER && amount <= cash

  const header = (title: string, description: string) => (
    <DialogHeader>
      <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
  )

  if (!link) {
    return (
      <div className="flex flex-col gap-4">
        {header(t('withdraw.title'), t('withdraw.description'))}
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t('transfer.needLink')}
        </p>
        <DialogFooter>
          <Button type="button" variant="outline" size="lg" onClick={onDone}>
            {t('transfer.cancel')}
          </Button>
          <Button type="button" size="lg" onClick={onLink}>
            {t('banks.add')}
          </Button>
        </DialogFooter>
      </div>
    )
  }

  const bank = bankName(banks, link.bank_code)

  function submit() {
    if (!link) return
    withdraw.mutate(
      { linkId: link.id, amount, otp: otpValue },
      {
        onSuccess: () => {
          toast.success(
            t('withdraw.success', { amount: formatMoney(amount), bank }),
          )
          onDone()
        },
        onError: (error) => toast.error(t(`errors.${bankErrorCode(error)}`)),
      },
    )
  }

  if (step === 'confirm') {
    return (
      <div className="flex flex-col gap-4">
        {header(t('withdraw.confirmTitle'), t('withdraw.confirmDescription'))}
        <SummaryBox>
          <SummaryRow
            label={t('transfer.target')}
            value={`${bank} ${maskAccount(link.account_no)}`}
            strong
          />
          <SummaryRow
            label={t('withdraw.amountRow')}
            value={formatMoney(amount)}
            strong
          />
          <SummaryRow label={t('withdraw.fee')} value={t('withdraw.free')} />
          <div className="my-1 border-t" />
          <SummaryRow
            label={t('withdraw.cashAfter')}
            value={formatMoney(cash - amount)}
          />
        </SummaryBox>

        <OtpField otp={otp} value={otpValue} onChange={setOtpValue} />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setStep('form')}
            disabled={withdraw.isPending}
          >
            {t('transfer.back')}
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={submit}
            disabled={otpValue.length !== 6 || withdraw.isPending}
          >
            {withdraw.isPending
              ? t('withdraw.submitting')
              : t('withdraw.submit')}
          </Button>
        </DialogFooter>
      </div>
    )
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        setTouched(true)
        if (!valid) return
        setOtpValue('')
        otp.request()
        setStep('confirm')
      }}
      className="flex flex-col gap-4"
    >
      {header(t('withdraw.title'), t('withdraw.description'))}

      <ChoiceCards
        name="withdraw-target"
        legend={t('transfer.target')}
        value={String(link.id)}
        onChange={(value) => setLinkId(Number(value))}
        options={links.map((l) => ({
          value: String(l.id),
          title: bankName(banks, l.bank_code),
          subtitle: `${maskAccount(l.account_no)} · ${l.holder_name.toUpperCase()}`,
          mark: l.bank_code,
        }))}
      />

      <div className="flex items-baseline justify-between rounded-lg bg-muted/60 px-4 py-3 text-sm">
        <span className="text-muted-foreground">{t('withdraw.available')}</span>
        <span className="font-semibold tabular-nums">{formatMoney(cash)}</span>
      </div>

      <AmountField
        id="withdraw-amount"
        label={t('transfer.amount')}
        value={amountText}
        onChange={setAmountText}
        error={amountError}
        hint={t('transfer.min', { min: formatMoney(MIN_TRANSFER) })}
        quick={QUICK_RATIOS.map((ratio) => {
          const value = Math.floor(cash * ratio)
          return {
            label: `${ratio * 100}%`,
            amount: value >= MIN_TRANSFER ? value : 0,
            ariaLabel: t('transfer.quickLabel', { amount: formatMoney(value) }),
          }
        })}
      />

      <DialogFooter>
        <Button type="button" variant="outline" size="lg" onClick={onDone}>
          {t('transfer.cancel')}
        </Button>
        <Button type="submit" size="lg" disabled={touched && !valid}>
          {t('transfer.continue')}
        </Button>
      </DialogFooter>
    </form>
  )
}
