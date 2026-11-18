import { useForm } from '@tanstack/react-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FormField } from '@/shared/components/FormField'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { changePassword } from '../../api/account'
import { passwordSchema } from '../../schemas'

type ChangePasswordDialogProps = {
  email: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Form nằm trong DialogContent: đóng hộp thoại là form bị gỡ, mở lại ô trống, không cần reset tay
export function ChangePasswordDialog({
  email,
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const { t } = useTranslation('auth')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {t('profile.password.title')}
          </DialogTitle>
          <DialogDescription>
            {t('profile.password.description')}
          </DialogDescription>
        </DialogHeader>
        <ChangePasswordForm email={email} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function ChangePasswordForm({
  email,
  onDone,
}: {
  email: string
  onDone: () => void
}) {
  const { t } = useTranslation('auth')
  const schema = passwordSchema(t)

  const form = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    // onChange, không dùng onBlur: tránh lỗi cũ biến mất làm nút nhảy, cú bấm trượt
    validators: { onChange: schema, onSubmit: schema },
    onSubmit: async ({ value }) => {
      const errorKey = await changePassword({ email, ...value })
      if (errorKey) {
        toast.error(t(errorKey))
        return
      }
      toast.success(t('profile.password.success'))
      onDone()
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
      {/* Trình quản lý mật khẩu cần biết mật khẩu này của tài khoản nào */}
      <input
        type="email"
        name="username"
        autoComplete="username"
        value={email}
        readOnly
        hidden
      />
      <form.Field name="currentPassword">
        {(field) => (
          <FormField
            field={field}
            label={t('profile.password.current')}
            type="password"
            autoComplete="current-password"
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
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onDone}
              disabled={isSubmitting}
            >
              {t('profile.password.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t('profile.password.submitting')
                : t('profile.password.submit')}
            </Button>
          </DialogFooter>
        )}
      </form.Subscribe>
    </form>
  )
}
