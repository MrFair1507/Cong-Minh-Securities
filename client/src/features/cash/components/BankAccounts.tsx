import { useQuery } from '@tanstack/react-query'
import { Plus, Unlink } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { formatDateTime, formatMoney } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { bankErrorCode, useUnlinkBank } from '../api/bankActions'
import {
  type BankLink,
  bankLinksQueryOptions,
  bankName,
  banksQueryOptions,
} from '../api/banks'
import { MAX_BANK_LINKS, maskAccount } from '../lib/cash'
import { BankMark } from './BankParts'

// Thẻ "Ngân hàng liên kết": các tài khoản đang liên kết + nút liên kết thêm
export function BankAccounts({
  userId,
  onLink,
}: {
  userId: string
  onLink: () => void // mở hộp thoại liên kết (do trang quản lý)
}) {
  const { t } = useTranslation('cash')
  const { data: banks } = useQuery(banksQueryOptions())
  const { data: links = [] } = useQuery(bankLinksQueryOptions(userId))
  const [unlinkTarget, setUnlinkTarget] = useState<BankLink>()
  const unlink = useUnlinkBank()
  const full = links.length >= MAX_BANK_LINKS

  const targetLabel = unlinkTarget
    ? {
        bank: bankName(banks, unlinkTarget.bank_code),
        account: maskAccount(unlinkTarget.account_no),
      }
    : { bank: '', account: '' }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold">{t('banks.title')}</CardTitle>
        <CardDescription>{t('banks.description')}</CardDescription>
        <CardAction>
          <Button
            variant="outline"
            onClick={onLink}
            disabled={full}
            title={
              full
                ? t('banks.limitReached', { max: MAX_BANK_LINKS })
                : undefined
            }
          >
            <Plus aria-hidden />
            {t('banks.add')}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            {t('banks.noLink')}
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {links.map((link) => {
              const name = bankName(banks, link.bank_code)
              const account = maskAccount(link.account_no)
              return (
                <li
                  key={link.id}
                  className="flex items-start gap-3 rounded-lg border p-4"
                >
                  <BankMark code={link.bank_code} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-semibold">
                      {name}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {account} · {link.holder_name.toUpperCase()}
                    </span>
                    <span className="mt-2 text-xs text-muted-foreground">
                      {t('banks.bankBalance')}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatMoney(link.balance)}
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      {t('banks.linkedAt', {
                        date: formatDateTime(link.created_at),
                      })}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('banks.unlinkLabel', { bank: name, account })}
                    title={t('banks.unlink')}
                    onClick={() => setUnlinkTarget(link)}
                  >
                    <Unlink aria-hidden />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>

      <ConfirmDialog
        open={Boolean(unlinkTarget)}
        onOpenChange={(open) => !open && setUnlinkTarget(undefined)}
        title={t('banks.unlinkTitle')}
        description={t('banks.unlinkDescription', targetLabel)}
        confirmText={t('banks.unlinkConfirm')}
        cancelText={t('transfer.cancel')}
        destructive
        pending={unlink.isPending}
        onConfirm={() => {
          if (!unlinkTarget) return
          unlink.mutate(unlinkTarget.id, {
            onSuccess: () => {
              toast.success(t('banks.unlinked'))
              setUnlinkTarget(undefined)
            },
            onError: (error) =>
              toast.error(t(`errors.${bankErrorCode(error)}`)),
          })
        }}
      />
    </Card>
  )
}
