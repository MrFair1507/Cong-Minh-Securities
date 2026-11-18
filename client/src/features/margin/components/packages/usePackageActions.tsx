import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import {
  marginErrorCode,
  useCancelPackage,
  useRegisterPackage,
} from '../../api/marginActions'
import {
  conflictingPackage,
  type MarginPackage,
  type PackageCode,
} from '../../lib/packages'

type PendingAction =
  | { kind: 'register'; pkg: MarginPackage }
  | { kind: 'cancel'; pkg: MarginPackage }
  | { kind: 'conflict'; pkg: MarginPackage; target: MarginPackage }

// Đăng ký / hủy gói, có hộp thoại hỏi lại; đang dùng gói loại trừ thì hỏi hủy gói đó trước.
// Trả về hàm hỏi và hộp thoại để đặt cạnh popup chi tiết gói.
export function usePackageActions(
  packages: MarginPackage[],
  activeCode: PackageCode,
  onDone: () => void,
) {
  const { t } = useTranslation('margin')
  const [pending, setPending] = useState<PendingAction | null>(null)
  const register = useRegisterPackage()
  const cancel = useCancelPackage()
  const name = (pkg: MarginPackage) => t(`packages.${pkg.code}.name`)

  function askRegister(pkg: MarginPackage) {
    const conflict = conflictingPackage(packages, activeCode, pkg.code)
    setPending(
      conflict
        ? { kind: 'conflict', pkg: conflict, target: pkg }
        : { kind: 'register', pkg },
    )
  }

  function askCancel(pkg: MarginPackage) {
    setPending({ kind: 'cancel', pkg })
  }

  function confirm() {
    if (!pending) return
    const onError = (error: unknown) =>
      toast.error(t(`errors.${marginErrorCode(error)}`))
    if (pending.kind === 'register') {
      register.mutate(pending.pkg.code, {
        onSuccess: () => {
          toast.success(t('package.registered', { name: name(pending.pkg) }))
          setPending(null)
          onDone()
        },
        onError,
      })
      return
    }
    // Hủy gói (kể cả khi đang báo xung đột: hủy gói cũ trước, rồi người dùng đăng ký lại)
    cancel.mutate(undefined, {
      onSuccess: () => {
        toast.success(t('package.cancelled', { name: name(pending.pkg) }))
        setPending(null)
        if (pending.kind === 'cancel') onDone()
      },
      onError,
    })
  }

  const text = (() => {
    if (!pending) return { title: '', description: '', confirm: '' }
    if (pending.kind === 'register')
      return {
        title: t('package.registerTitle', { name: name(pending.pkg) }),
        description: t('package.registerDescription'),
        confirm: t('package.confirm'),
      }
    if (pending.kind === 'cancel')
      return {
        title: t('package.cancelTitle', { name: name(pending.pkg) }),
        description: t('package.cancelDescription'),
        confirm: t('package.cancel'),
      }
    return {
      title: t('package.conflictTitle', { name: name(pending.pkg) }),
      description: t('package.conflictDescription', {
        name: name(pending.pkg),
        target: name(pending.target),
      }),
      confirm: t('package.conflictConfirm', { name: name(pending.pkg) }),
    }
  })()

  const dialog = (
    <ConfirmDialog
      open={pending !== null}
      onOpenChange={(open) => !open && setPending(null)}
      title={text.title}
      description={text.description}
      confirmText={text.confirm}
      cancelText={t('package.close')}
      destructive={pending !== null && pending.kind !== 'register'}
      pending={register.isPending || cancel.isPending}
      onConfirm={confirm}
    />
  )

  return { askRegister, askCancel, dialog }
}
