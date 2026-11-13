import type { AnyFieldApi } from '@tanstack/react-form'
import type { ComponentProps } from 'react'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

// Lỗi Zod đầu tiên của ô, chỉ hiện sau khi người dùng đã chạm vào ô
export function fieldError(field: AnyFieldApi): string | undefined {
  const { isTouched, errors } = field.state.meta
  return isTouched ? errors[0]?.message : undefined
}

type FormFieldProps = {
  field: AnyFieldApi
  label: string
  error?: string // lỗi từ ngoài form (vd. Supabase báo email trùng), ưu tiên hơn lỗi Zod
} & Omit<
  ComponentProps<'input'>,
  'id' | 'name' | 'value' | 'onChange' | 'onBlur'
>

export function FormField({
  field,
  label,
  error: externalError,
  ...inputProps
}: FormFieldProps) {
  const error = externalError ?? fieldError(field)
  const errorId = `${field.name}-error`

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={field.name} className="leading-5">
        {label}
      </Label>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="h-9 px-3"
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
