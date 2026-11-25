import { useTranslation } from 'react-i18next'
import { formatMoneyInput, parseMoney } from '@/shared/lib/money'
import { moneyToWords } from '@/shared/lib/numberWords'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'


export function AmountField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  quick,
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  quick?: { label: string; amount: number; ariaLabel: string }[]
  placeholder?: string
}) {
  const { t, i18n } = useTranslation()
  const amount = parseMoney(value)
  const describedBy = [
    amount > 0 ? `${id}-words` : undefined,
    error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="leading-5">
        {label}
      </Label>
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder ?? t('amountPlaceholder')}
        value={value}
        onChange={(e) => onChange(formatMoneyInput(e.target.value))}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className="h-9 px-3 text-right tabular-nums"
      />
      {amount > 0 && (
        <p
          id={`${id}-words`}
          className="text-right text-xs text-muted-foreground italic"
        >
          {moneyToWords(amount, i18n.language)}
        </p>
      )}
      {quick && (
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${quick.length}, 1fr)` }}
        >
          {quick.map((item) => (
            <Button
              key={item.label}
              type="button"
              variant={amount === item.amount ? 'secondary' : 'outline'}
              size="sm"
              disabled={item.amount <= 0}
              aria-label={item.ariaLabel}
              onClick={() => onChange(formatMoneyInput(String(item.amount)))}
            >
              {item.label}
            </Button>
          ))}
        </div>
      )}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
