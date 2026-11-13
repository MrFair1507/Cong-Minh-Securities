import { useForm } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { FormField } from '@/shared/components/FormField'
import { Button } from '@/shared/ui/button'
import { type AccountValues, accountSchema } from '../../schemas'
import { StepHeading } from './RegisterStepper'

const EMPTY_ACCOUNT: AccountValues = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
}

type AccountStepProps = {
  defaultValues?: AccountValues // quay lại từ bước sau thì giữ dữ liệu đã nhập
  emailError?: string // email trùng: Supabase chỉ báo ở bước 3
  onEmailChange: () => void
  onSubmit: (values: AccountValues) => void
}

export function AccountStep({
  defaultValues = EMPTY_ACCOUNT,
  emailError,
  onEmailChange,
  onSubmit,
}: AccountStepProps) {
  const { t } = useTranslation('auth')
  const schema = accountSchema(t)

  const form = useForm({
    defaultValues,
    validators: { onBlur: schema, onSubmit: schema },
    onSubmit: ({ value }) => onSubmit(value),
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
        title={t('register.title')}
        description={t('register.description')}
      />

      <form.Field name="fullName">
        {(field) => (
          <FormField
            field={field}
            label={t('fields.fullName')}
            autoComplete="name"
            placeholder={t('fields.fullNamePlaceholder')}
          />
        )}
      </form.Field>
      <form.Field name="email" listeners={{ onChange: onEmailChange }}>
        {(field) => (
          <FormField
            field={field}
            label={t('fields.email')}
            type="email"
            autoComplete="email"
            placeholder={t('fields.emailPlaceholder')}
            error={emailError}
          />
        )}
      </form.Field>
      <form.Field name="phone">
        {(field) => (
          <FormField
            field={field}
            label={t('fields.phone')}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder={t('fields.phonePlaceholder')}
          />
        )}
      </form.Field>
      <form.Field name="password">
        {(field) => (
          <FormField
            field={field}
            label={t('fields.password')}
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
            label={t('fields.confirmPassword')}
            type="password"
            autoComplete="new-password"
            placeholder={t('fields.confirmPasswordPlaceholder')}
          />
        )}
      </form.Field>

      <Button type="submit" size="lg" className="w-full">
        {t('register.next')}
      </Button>

      <p className="flex justify-center gap-1 text-sm">
        <span className="text-muted-foreground">
          {t('register.hasAccount')}
        </span>
        <Link to="/login" className="font-medium underline">
          {t('register.loginLink')}
        </Link>
      </p>
    </form>
  )
}
