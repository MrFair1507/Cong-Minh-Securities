import { cn } from 'cn'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const REGISTER_STEPS = [
  'account',
  'document',
  'confirm',
  'complete',
] as const
export type RegisterStep = (typeof REGISTER_STEPS)[number]

export function RegisterStepper({ current }: { current: RegisterStep }) {
  const { t } = useTranslation('auth')
  const currentIndex = REGISTER_STEPS.indexOf(current)

  return (
    <ol className="flex items-center gap-2">
      {REGISTER_STEPS.map((step, index) => {
        const done = index < currentIndex || current === 'complete'
        const active = index === currentIndex && !done
        return (
          <li
            key={step}
            aria-current={index === currentIndex ? 'step' : undefined}
            className="flex flex-1 items-center gap-2 last:flex-none"
          >
            <span
              className={cn(
                'grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold',
                done && 'border-safe bg-safe text-white',
                active && 'border-primary bg-primary text-primary-foreground',
                !done && !active && 'text-muted-foreground',
              )}
            >
              {done ? <Check className="size-3.5" aria-hidden /> : index + 1}
            </span>
            <span
              className={cn(
                'text-xs whitespace-nowrap',
                index === currentIndex
                  ? 'font-medium'
                  : 'text-muted-foreground',
              )}
            >
              {t(`kyc.steps.${step}`)}
            </span>
            {index < REGISTER_STEPS.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  'h-px flex-1',
                  index < currentIndex ? 'bg-safe' : 'bg-border',
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

type StepHeadingProps = {
  title: string
  description: string
  className?: string
}

export function StepHeading({
  title,
  description,
  className,
}: StepHeadingProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <h1 className="text-2xl leading-8 font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
