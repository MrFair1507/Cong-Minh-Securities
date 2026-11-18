import { useForm } from '@tanstack/react-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FormField } from '@/shared/components/FormField'
import { Button } from '@/shared/ui/button'
import {
  type ResetChallenge,
  requestPasswordReset,
} from '../../api/passwordReset'
import { type ForgotInfoValues, forgotInfoSchema } from '../../schemas'

// Bước 1: email + số giấy tờ + số điện thoại phải khớp hồ sơ eKYC thì mới nhận OTP
export function ForgotInfoStep({
  defaultEmail,
  onVerified,
}: {
  defaultEmail: string
  onVerified: (info: ForgotInfoValues, challenge: ResetChallenge) => void
}) {
  const { t } = useTranslation('auth')
  const schema = forgotInfoSchema(t)

  const form = useForm({
    defaultValues: { email: defaultEmail, idNumber: '', phone: '' },
    validators: { onChange: schema, onSubmit: schema },
    onSubmit: async ({ value }) => {
      const result = await requestPasswordReset(value)
      if ('errorKey' in result) {
        toast.error(t(result.errorKey))
        return
      }
      onVerified(value, result.challenge)
    },
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
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl leading-8 font-semibold">
          {t('forgot.info.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('forgot.info.description')}
        </p>
      </div>

      <form.Field name="email">
        {(field) => (
          <FormField
            field={field}
            label={t('fields.email')}
            type="email"
            autoComplete="email"
            placeholder={t('fields.emailPlaceholder')}
          />
        )}
      </form.Field>
      <form.Field name="idNumber">
        {(field) => (
          <FormField
            field={field}
            label={t('forgot.info.idNumber')}
            inputMode="numeric"
            maxLength={12}
            placeholder={t('forgot.info.idNumberPlaceholder')}
          />
        )}
      </form.Field>
      <form.Field name="phone">
        {(field) => (
          <FormField
            field={field}
            label={t('fields.phone')}
            type="tel"
            autoComplete="tel"
            maxLength={10}
            placeholder={t('fields.phonePlaceholder')}
          />
        )}
      </form.Field>

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting
              ? t('forgot.info.submitting')
              : t('forgot.info.submit')}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
