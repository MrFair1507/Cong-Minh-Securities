import { revalidateLogic, useForm } from '@tanstack/react-form'
import { cn } from 'cn'
import { Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { fieldError } from '@/shared/components/FormField'
import { formatDate } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import type { MockIdentity } from '../../lib/mockIdentity'
import { confirmSchema } from '../../schemas'
import { StepHeading } from './RegisterStepper'

type ConfirmStepProps = {
  identity: MockIdentity
  onBack: () => void
  onSubmit: () => Promise<void>
}

// Thông tin đọc từ thẻ nên khóa hết, người dùng chỉ xem lại rồi đồng ý
export function ConfirmStep({ identity, onBack, onSubmit }: ConfirmStepProps) {
  const { t } = useTranslation('auth')
  const schema = confirmSchema(t)

  const form = useForm({
    defaultValues: { accepted: false },
    // Chưa bấm Mở tài khoản thì không báo lỗi (cùng mẫu với màn đăng nhập)
    validationLogic: revalidateLogic(),
    validators: { onDynamic: schema },
    onSubmit,
  })

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="flex flex-col gap-4"
    >
      <StepHeading
        title={t('kyc.confirm.title')}
        description={t('kyc.confirm.description')}
      />

      <dl className="divide-y rounded-lg border text-sm">
        <LockedRow
          label={t('kyc.confirm.idNumber')}
          value={identity.idNumber}
          className="font-mono"
        />
        <LockedRow
          label={t('kyc.confirm.fullName')}
          value={identity.fullName}
        />
        <LockedRow
          label={t('kyc.confirm.dateOfBirth')}
          value={formatDate(identity.dateOfBirth)}
        />
        <LockedRow
          label={t('kyc.confirm.gender')}
          value={t(`kyc.gender.${identity.gender}`)}
        />
        <LockedRow
          label={t('kyc.confirm.issuedOn')}
          value={formatDate(identity.issuedOn)}
        />
      </dl>

      <form.Field name="accepted">
        {(field) => {
          const error = fieldError(field)
          return (
            <div className="flex flex-col gap-1">
              <label className="flex items-start gap-2.5 rounded-lg bg-warning-bg px-3 py-2.5 text-sm text-warning">
                <input
                  type="checkbox"
                  name={field.name}
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                  onBlur={field.handleBlur}
                  className="mt-0.5 size-4 shrink-0 accent-primary"
                />
                {t('kyc.confirm.accept')}
              </label>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          )
        }}
      </form.Field>

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onBack}
              disabled={isSubmitting}
            >
              {t('register.back')}
            </Button>
            <Button
              type="submit"
              size="lg"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('kyc.confirm.submitting')
                : t('kyc.confirm.submit')}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  )
}

type LockedRowProps = { label: string; value: string; className?: string }

function LockedRow({ label, value, className }: LockedRowProps) {
  const { t } = useTranslation('auth')
  return (
    <div className="grid grid-cols-[128px_1fr] items-center gap-3 px-4 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex items-center justify-between gap-2 font-medium">
        <span className={cn('min-w-0 wrap-break-word', className)}>
          {value}
        </span>
        <Lock
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-label={t('kyc.confirm.locked')}
        />
      </dd>
    </div>
  )
}
