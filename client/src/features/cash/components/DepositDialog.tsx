import { useQuery } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { profileQueryOptions } from '@/features/auth/api/profile'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { bankErrorCode, useDeposit } from '../api/bankActions'
import {
  type BankLink,
  bankLinksQueryOptions,
  bankName,
  banksQueryOptions,
} from '../api/banks'
import {
  collectionAccount,
  depositMemo,
  depositQrPayload,
  MIN_TRANSFER,
  maskAccount,
  parseMoney,
  QUICK_DEPOSITS,
} from '../lib/cash'
import { AmountField, ChoiceCards, CopyRow, useAmountError } from './BankParts'

type DepositDialogProps = {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onLink: () => void // chưa có tài khoản liên kết: mở hộp thoại liên kết
}

export function DepositDialog({
  userId,
  open,
  onOpenChange,
  onLink,
}: DepositDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 sm:max-w-[600px]">
        <DepositForm
          userId={userId}
          onDone={() => onOpenChange(false)}
          onLink={onLink}
        />
      </DialogContent>
    </Dialog>
  )
}

const amountShort = (amount: number) => `${amount / 1_000_000}tr`

function DepositForm({
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
  const [method, setMethod] = useState<'instant' | 'qr'>('instant')
  const [linkId, setLinkId] = useState(links[0]?.id)
  const [amountText, setAmountText] = useState('')
  const [touched, setTouched] = useState(false)
  const deposit = useDeposit()

  const link: BankLink | undefined =
    links.find((l) => l.id === linkId) ?? links[0]
  const amount = parseMoney(amountText)
  const max = link?.balance ?? 0
  const amountError = useAmountError(amount, max, touched || amount > 0)
  const valid = Boolean(link) && amount >= MIN_TRANSFER && amount <= max
  const memo = depositMemo(profile?.account_no ?? null)

  function submit() {
    setTouched(true)
    if (!link || !valid) return
    deposit.mutate(
      { linkId: link.id, amount },
      {
        onSuccess: () => {
          toast.success(t('deposit.success', { amount: formatMoney(amount) }))
          onDone()
        },
        onError: (error) => toast.error(t(`errors.${bankErrorCode(error)}`)),
      },
    )
  }

  const header = (
    <DialogHeader>
      <DialogTitle className="text-lg font-semibold">
        {t('deposit.title')}
      </DialogTitle>
      <DialogDescription>{t('deposit.description')}</DialogDescription>
    </DialogHeader>
  )

  if (!link) {
    return (
      <div className="flex flex-col gap-4">
        {header}
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

  return (
    <div className="flex flex-col gap-4">
      {header}

      <ChoiceCards
        name="deposit-source"
        legend={t('transfer.source')}
        value={String(link.id)}
        onChange={(value) => setLinkId(Number(value))}
        options={links.map((l) => ({
          value: String(l.id),
          title: bankName(banks, l.bank_code),
          subtitle: `${maskAccount(l.account_no)} · ${formatMoney(l.balance)}`,
          mark: l.bank_code,
        }))}
      />

      <AmountField
        id="deposit-amount"
        label={t('transfer.amount')}
        value={amountText}
        onChange={setAmountText}
        error={amountError}
        hint={t('transfer.min', { min: formatMoney(MIN_TRANSFER) })}
        quick={QUICK_DEPOSITS.map((value) => ({
          label: amountShort(value),
          amount: value <= max ? value : 0,
          ariaLabel: t('transfer.quickLabel', { amount: formatMoney(value) }),
        }))}
      />

      <Tabs
        value={method}
        onValueChange={(value) => setMethod(value as 'instant' | 'qr')}
      >
        <TabsList aria-label={t('deposit.methodLabel')} className="w-full">
          <TabsTrigger value="instant">{t('deposit.instant')}</TabsTrigger>
          <TabsTrigger value="qr">{t('deposit.qr')}</TabsTrigger>
        </TabsList>

        <TabsContent
          value="instant"
          className="pt-2 text-xs text-muted-foreground"
        >
          {t('deposit.instantHint')}
        </TabsContent>

        <TabsContent value="qr" className="flex flex-col gap-3 pt-2">
          <p className="text-xs text-muted-foreground">{t('deposit.qrHint')}</p>
          <div className="grid grid-cols-1 items-center gap-4 rounded-lg border p-4 sm:grid-cols-[148px_1fr]">
            <div className="flex size-[148px] items-center justify-center justify-self-center rounded-lg bg-white p-2">
              {valid ? (
                <QRCodeSVG
                  value={depositQrPayload({
                    bankCode: link.bank_code,
                    amount,
                    memo,
                  })}
                  size={132}
                  level="M"
                  title={t('deposit.qrAlt', { bank })}
                />
              ) : (
                <span className="px-2 text-center text-xs text-zinc-500">
                  {t('deposit.qrNeedAmount')}
                </span>
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <CopyRow label={t('deposit.receiveBank')} value={bank} />
              <CopyRow
                label={t('deposit.receiveAccount')}
                value={collectionAccount(link.bank_code)}
              />
              <CopyRow
                label={t('deposit.receiveHolder')}
                value={t('deposit.receiveHolderValue')}
              />
              <CopyRow
                label={t('transfer.amount')}
                value={String(amount)}
                display={amount > 0 ? formatMoney(amount) : '—'}
              />
              <CopyRow
                label={t('deposit.memo')}
                value={memo}
                display={<span className="text-warning">{memo}</span>}
              />
            </div>
          </div>
          <p className="flex gap-2 rounded-lg bg-warning-bg p-3 text-xs leading-5 text-warning">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t('deposit.qrNote')}
          </p>
        </TabsContent>
      </Tabs>

      <DialogFooter>
        <Button type="button" variant="outline" size="lg" onClick={onDone}>
          {t('transfer.cancel')}
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={submit}
          disabled={deposit.isPending || (touched && !valid)}
        >
          {deposit.isPending
            ? t('deposit.submitting')
            : method === 'qr'
              ? t('deposit.qrDone')
              : t('deposit.submit', {
                  amount: amount > 0 ? formatMoney(amount) : '',
                })}
        </Button>
      </DialogFooter>
    </div>
  )
}
