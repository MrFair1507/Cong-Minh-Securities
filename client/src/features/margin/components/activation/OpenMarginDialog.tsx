import { DEFAULT_RATES } from '@cms/shared/margin'
import { Check, Scale } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { formatRate } from '@/shared/lib/format'
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
import { Switch } from '@/shared/ui/switch'
import { marginErrorCode, useOpenMarginAccount } from '../../api/marginActions'
import { useActivationParams } from './useActivationParams'

// Hộp thoại Mở tài khoản ký quỹ (frame 12) + 2 dịch vụ đi kèm: tự trả nợ, tự gia hạn
export function OpenMarginDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation('margin')
  const params = useActivationParams()
  const openAccount = useOpenMarginAccount()
  const [accepted, setAccepted] = useState(false)
  const [autoRepay, setAutoRepay] = useState(true)
  const [autoRenew, setAutoRenew] = useState(true)

  function submit() {
    openAccount.mutate(
      { autoRepay, autoRenew },
      {
        onSuccess: () => {
          toast.success(t('open.success'))
          onOpenChange(false)
        },
        onError: (error) => toast.error(t(`errors.${marginErrorCode(error)}`)),
      },
    )
  }

  const services = [
    {
      id: 'openAutoRepay',
      label: t('settings.autoRepay'),
      hint: t('settings.autoRepayHint'),
      checked: autoRepay,
      onChange: setAutoRepay,
    },
    {
      id: 'openAutoRenew',
      label: t('settings.autoRenew'),
      hint: t('settings.autoRenewHint'),
      checked: autoRenew,
      onChange: setAutoRenew,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader className="flex-row items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted">
            <Scale className="size-5" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <DialogTitle className="text-lg font-semibold">
              {t('open.title')}
            </DialogTitle>
            <DialogDescription>{t('open.description')}</DialogDescription>
          </div>
        </DialogHeader>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{t('activation.params')}</h3>
          <dl className="flex flex-col gap-1.5 rounded-lg bg-muted/60 px-4 py-3 text-sm">
            {params.map((row) => (
              <div key={row.label} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="text-right font-medium tabular-nums">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{t('open.services')}</h3>
          <div className="flex flex-col divide-y rounded-lg border px-4">
            {services.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <Label htmlFor={item.id}>{item.label}</Label>
                  <p className="text-xs text-muted-foreground">{item.hint}</p>
                </div>
                <Switch
                  id={item.id}
                  checked={item.checked}
                  onCheckedChange={item.onChange}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{t('activation.know')}</h3>
          <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            {[
              t('activation.know1'),
              t('activation.know2', {
                rate: formatRate(DEFAULT_RATES.callRate),
              }),
              t('activation.know3'),
            ].map((line) => (
              <li key={line} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </section>

        <label className="flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-primary"
          />
          {t('open.accept')}
        </label>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={openAccount.isPending}
          >
            {t('open.cancel')}
          </Button>
          <Button
            onClick={submit}
            disabled={!accepted || openAccount.isPending}
          >
            {openAccount.isPending ? t('open.submitting') : t('open.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
