import type { AnyFieldApi } from '@tanstack/react-form'
import type { ComponentProps, ReactNode } from 'react'
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
  hint?: string // chữ gợi ý dưới ô, ẩn khi đang có lỗi
  before?: ReactNode // nút đặt sát bên trái ô (vd. nút −)
  after?: ReactNode // nút đặt sát bên phải ô (vd. nút +)
} & Omit<
  ComponentProps<'input'>,
  'id' | 'name' | 'value' | 'onChange' | 'onBlur'
>

export function FormField({
  field,
  label,
  error: externalError,
  hint,
  before,
  after,
  ...inputProps
}: FormFieldProps) {
  const error = externalError ?? fieldError(field)
  const errorId = `${field.name}-error`
  const hintId = `${field.name}-hint`

  const input = (
    <Input
      id={field.name}
      name={field.name}
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.value)}
      onBlur={field.handleBlur}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : hint ? hintId : undefined}
      className="h-9 px-3"
      {...inputProps}
    />
  )

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={field.name} className="leading-5">
        {label}
      </Label>
      {before || after ? (
        <div className="flex items-center gap-1.5">
          {before}
          {input}
          {after}
        </div>
      ) : (
        input
      )}
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
