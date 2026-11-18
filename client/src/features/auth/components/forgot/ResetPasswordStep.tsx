import { useForm } from '@tanstack/react-form'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FormField } from '@/shared/components/FormField'
import { Button } from '@/shared/ui/button'
import {
  type ResetChallenge,
  requestPasswordReset,
  resetPassword,
} from '../../api/passwordReset'
import { type ForgotInfoValues, resetPasswordSchema } from '../../schemas'

// Bước 2: nhập OTP mô phỏng + mật khẩu mới
export function ResetPasswordStep({
  info,
  challenge: initialChallenge,
  onDone,
}: {
  info: ForgotInfoValues
  challenge: ResetChallenge
  onDone: () => void
}) {
  const { t } = useTranslation('auth')
  const schema = resetPasswordSchema(t)
  const [challenge, setChallenge] = useState(initialChallenge)
  const [resending, setResending] = useState(false)

  const form = useForm({
    defaultValues: { otp: '', newPassword: '', confirmPassword: '' },
    validators: { onChange: schema, onSubmit: schema },
    onSubmit: async ({ value }) => {
      const errorKey = await resetPassword({
        email: info.email,
        otp: value.otp,
        newPassword: value.newPassword,
      })
      if (errorKey) {
        toast.error(t(errorKey))
        return
      }
      toast.success(t('forgot.reset.success'))
      onDone()
    },
  })

  async function resend() {
    setResending(true)
    const result = await requestPasswordReset(info)
    setResending(false)
    if ('errorKey' in result) {
      toast.error(t(result.errorKey))
      return
    }
    setChallenge(result.challenge)
    form.setFieldValue('otp', '')
    toast.success(t('forgot.reset.resent'))
  }

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
          {t('forgot.reset.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('forgot.reset.description', { phone: challenge.phoneTail })}
        </p>
      </div>

      {/* Thật thì mã nằm trong SMS; đây là mô phỏng nên hiện thẳng trên màn hình */}
      <div
        role="status"
        className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground"
      >
        <span>
          {t('forgot.reset.mockNotice')}{' '}
          <strong className="font-mono text-sm tracking-widest text-foreground">
            {challenge.code}
          </strong>
        </span>
        <span>{t('forgot.reset.expires')}</span>
      </div>

      {/* Trình quản lý mật khẩu cần biết mật khẩu mới của tài khoản nào */}
      <input
        type="email"
        name="username"
        autoComplete="username"
        value={info.email}
        readOnly
        hidden
      />
      <form.Field name="otp">
        {(field) => (
          <FormField
            field={field}
            label={t('forgot.reset.otp')}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder={t('forgot.reset.otpPlaceholder')}
            className="h-9 px-3 font-mono tracking-widest"
            after={
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={resend}
                disabled={resending}
              >
                <RefreshCw aria-hidden />
                {t('forgot.reset.resend')}
              </Button>
            }
          />
        )}
      </form.Field>
      <form.Field name="newPassword">
        {(field) => (
          <FormField
            field={field}
            label={t('profile.password.new')}
            type="password"
            autoComplete="new-password"
            placeholder={t('fields.passwordPlaceholder')}
          />
        )}
      </form.Field>
      <form.Field name="confirmPassword">
        {(field) => (
          <FormField
            field={field}
            label={t('profile.password.confirm')}
            type="password"
            autoComplete="new-password"
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
              ? t('forgot.reset.submitting')
              : t('forgot.reset.submit')}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
