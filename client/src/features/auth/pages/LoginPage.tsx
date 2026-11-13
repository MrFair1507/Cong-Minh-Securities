import { useForm } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FormField } from '@/shared/components/FormField'
import { Button } from '@/shared/ui/button'
import { authErrorKey, signIn } from '../api/auth'
import { loginSchema } from '../schemas'

export function LoginPage() {
  const { t } = useTranslation('auth')
  const schema = loginSchema(t)

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onBlur: schema, onSubmit: schema },
    onSubmit: async ({ value }) => {
      const error = await signIn(value)
      if (error) toast.error(t(authErrorKey(error)))
    },
  })

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="flex w-[380px] flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl leading-8 font-semibold">{t('login.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('login.description')}
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
      <form.Field name="password">
        {(field) => (
          <FormField
            field={field}
            label={t('fields.password')}
            type="password"
            autoComplete="current-password"
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
            {isSubmitting ? t('login.submitting') : t('login.submit')}
          </Button>
        )}
      </form.Subscribe>

      <p className="flex justify-center gap-1 text-sm">
        <span className="text-muted-foreground">{t('login.noAccount')}</span>
        <Link to="/register" className="font-medium underline">
          {t('login.registerLink')}
        </Link>
      </p>

      <div className="border-t pt-4 text-center">
        <Link
          to="/market"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {t('login.guestLink')}
        </Link>
      </div>
    </form>
  )
}
