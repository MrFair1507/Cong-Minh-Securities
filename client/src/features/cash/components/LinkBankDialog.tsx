import { useQuery } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { profileQueryOptions } from '@/features/auth/api/profile'
import {
  SummaryBox,
  SummaryRow,
} from '@/features/trading/components/OrderSummary'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { bankErrorCode, useLinkBank } from '../api/bankActions'
import { bankName, banksQueryOptions } from '../api/banks'
import { BankMark, ChoiceCards, OtpField, useOtp } from './BankParts'

const ACCOUNT_NO = /^\d{6,14}$/

type LinkBankDialogProps = {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Liên kết ngân hàng mô phỏng: bước 1 chọn ngân hàng + số TK, bước 2 xác nhận + OTP
export function LinkBankDialog({
  userId,
  open,
  onOpenChange,
}: LinkBankDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 sm:max-w-[520px]">
        <LinkBankSteps userId={userId} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function LinkBankSteps({
  userId,
  onDone,
}: {
  userId: string
  onDone: () => void
}) {
  const { t } = useTranslation('cash')
  const { data: banks = [] } = useQuery(banksQueryOptions())
  const { data: profile } = useQuery(profileQueryOptions(userId))
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [bankCode, setBankCode] = useState('ALPHA')
  const [accountNo, setAccountNo] = useState('')
  const [touched, setTouched] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [otpValue, setOtpValue] = useState('')
  const otp = useOtp('LINK_BANK')
  const linkBank = useLinkBank()

  const accountError =
    touched && !ACCOUNT_NO.test(accountNo) ? t('errors.accountNo') : undefined
  const bank = bankName(banks, bankCode)

  function submit() {
    linkBank.mutate(
      { bankCode, accountNo, otp: otpValue },
      {
        onSuccess: () => {
          toast.success(t('link.success', { bank, account: accountNo }))
          onDone()
        },
        onError: (error) => toast.error(t(`errors.${bankErrorCode(error)}`)),
      },
    )
  }

  if (step === 'confirm') {
    return (
      <div className="flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {t('link.confirmTitle')}
          </DialogTitle>
          <DialogDescription>{t('link.confirmDescription')}</DialogDescription>
        </DialogHeader>

        <SummaryBox>
          <SummaryRow
            label={t('link.stockAccount')}
            value={profile?.account_no ?? '—'}
            strong
          />
          <SummaryRow
            label={t('link.fullName')}
            value={profile?.full_name ?? '—'}
            strong
          />
          <SummaryRow
            label={t('link.idNumber')}
            value={profile?.id_number ?? '—'}
          />
          <SummaryRow label={t('link.phone')} value={profile?.phone ?? '—'} />
          <div className="my-1 border-t" />
          <SummaryRow
            label={t('link.bank')}
            value={
              <span className="inline-flex items-center gap-2">
                <BankMark
                  code={bankCode}
                  className="size-5 rounded text-[10px]"
                />
                {bank}
              </span>
            }
            strong
          />
          <SummaryRow label={t('link.accountNo')} value={accountNo} strong />
        </SummaryBox>

        <p className="flex gap-2 rounded-lg bg-warning-bg p-3 text-xs leading-5 text-warning">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t('link.note')}
        </p>

        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 size-4 accent-primary"
          />
          {t('link.agree')}
        </label>

        <OtpField otp={otp} value={otpValue} onChange={setOtpValue} />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setStep('form')}
            disabled={linkBank.isPending}
          >
            {t('transfer.back')}
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={submit}
            disabled={!agreed || otpValue.length !== 6 || linkBank.isPending}
          >
            {linkBank.isPending ? t('link.submitting') : t('link.submit')}
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
        if (!ACCOUNT_NO.test(accountNo)) return
        setOtpValue('')
        otp.request()
        setStep('confirm')
      }}
      className="flex flex-col gap-4"
    >
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">
          {t('link.title')}
        </DialogTitle>
        <DialogDescription>{t('link.description')}</DialogDescription>
      </DialogHeader>

      <ChoiceCards
        name="bank"
        legend={t('link.bank')}
        value={bankCode}
        onChange={setBankCode}
        options={banks.map((b) => ({
          value: b.code,
          title: b.name,
          mark: b.code,
        }))}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bank-account-no" className="leading-5">
          {t('link.accountNo')}
        </Label>
        <Input
          id="bank-account-no"
          inputMode="numeric"
          autoComplete="off"
          maxLength={14}
          value={accountNo}
          onChange={(e) =>
            setAccountNo(e.target.value.replace(/\D/g, '').slice(0, 14))
          }
          onBlur={() => setTouched(true)}
          aria-invalid={accountError ? true : undefined}
          aria-describedby="bank-account-no-msg"
          className="h-9 px-3 tabular-nums"
        />
        <p
          id="bank-account-no-msg"
          className={
            accountError
              ? 'text-xs text-destructive'
              : 'text-xs text-muted-foreground'
          }
        >
          {accountError ?? t('link.accountNoHint')}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bank-holder" className="leading-5">
          {t('link.holder')}
        </Label>
        <Input
          id="bank-holder"
          value={profile?.full_name.toUpperCase() ?? ''}
          readOnly
          disabled
          aria-describedby="bank-holder-hint"
          className="h-9 px-3"
        />
        <p id="bank-holder-hint" className="text-xs text-muted-foreground">
          {t('link.holderHint')}
        </p>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" size="lg" onClick={onDone}>
          {t('transfer.cancel')}
        </Button>
        <Button type="submit" size="lg">
          {t('link.continue')}
        </Button>
      </DialogFooter>
    </form>
  )
}
