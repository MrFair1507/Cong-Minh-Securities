import { useForm } from '@tanstack/react-form'
import { Lock } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fieldError } from '@/shared/components/FormField'
import { formatDate } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import {
  ageOn,
  GENDERS,
  type Gender,
  generateIssuedOn,
  isValidIssuedOn,
  type MockIdentity,
} from '../../lib/mockIdentity'
import { confirmSchema } from '../../schemas'
import { StepHeading } from './RegisterStepper'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const SELECT_CLASS =
  'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

type ConfirmStepProps = {
  identity: MockIdentity
  onBack: () => void
  onSubmit: (identity: MockIdentity) => Promise<void>
}

export function ConfirmStep({ identity, onBack, onSubmit }: ConfirmStepProps) {
  const { t } = useTranslation('auth')
  const schema = confirmSchema(t)

  const [issuedOn, setIssuedOn] = useState(identity.issuedOn)

  const form = useForm({
    defaultValues: {
      dateOfBirth: identity.dateOfBirth,
      gender: identity.gender,
      accepted: false,
    },
    validators: { onBlur: schema, onSubmit: schema },
    onSubmit: ({ value }) =>
      onSubmit({
        ...identity,
        dateOfBirth: value.dateOfBirth,
        gender: value.gender,
        issuedOn,
      }),
  })

  function handleDateOfBirthChange({ value }: { value: string }) {
    if (
      ISO_DATE.test(value) &&
      ageOn(value) >= 18 &&
      !isValidIssuedOn(value, issuedOn)
    ) {
      setIssuedOn(generateIssuedOn(value))
    }
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
      <StepHeading
        title={t('kyc.confirm.title')}
        description={t('kyc.confirm.description')}
      />

      <dl className="divide-y rounded-lg border text-sm">
        <Row label={t('kyc.confirm.idNumber')}>
          <LockedValue className="font-mono">{identity.idNumber}</LockedValue>
        </Row>
        <Row label={t('kyc.confirm.fullName')}>
          <LockedValue>{identity.fullName}</LockedValue>
        </Row>
        <form.Field
          name="dateOfBirth"
          listeners={{ onChange: handleDateOfBirthChange }}
        >
          {(field) => {
            const error = fieldError(field)
            return (
              <Row label={t('kyc.confirm.dateOfBirth')} htmlFor={field.name}>
                <Input
                  id={field.name}
                  type="date"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={error ? true : undefined}
                  className="h-9 px-3"
                />
                {error && (
                  <p className="mt-1 text-xs text-destructive">{error}</p>
                )}
              </Row>
            )
          }}
        </form.Field>
        <form.Field name="gender">
          {(field) => (
            <Row label={t('kyc.confirm.gender')} htmlFor={field.name}>
              <select
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value as Gender)}
                onBlur={field.handleBlur}
                className={SELECT_CLASS}
              >
                {GENDERS.map((gender) => (
                  <option key={gender} value={gender}>
                    {t(`kyc.gender.${gender}`)}
                  </option>
                ))}
              </select>
            </Row>
          )}
        </form.Field>
        <Row label={t('kyc.confirm.issuedOn')}>
          <LockedValue>{formatDate(issuedOn)}</LockedValue>
        </Row>
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

type RowProps = { label: string; htmlFor?: string; children: ReactNode }

function Row({ label, htmlFor, children }: RowProps) {
  return (
    <div className="grid grid-cols-[128px_1fr] items-center gap-3 px-4 py-2.5">
      <dt className="text-muted-foreground">
        {htmlFor ? <label htmlFor={htmlFor}>{label}</label> : label}
      </dt>
      <dd>{children}</dd>
    </div>
  )
}

function LockedValue({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const { t } = useTranslation('auth')
  return (
    <span className="flex items-center justify-between gap-2 font-medium">
      <span className={className}>{children}</span>
      <Lock
        className="size-3.5 shrink-0 text-muted-foreground"
        aria-label={t('kyc.confirm.locked')}
      />
    </span>
  )
}
