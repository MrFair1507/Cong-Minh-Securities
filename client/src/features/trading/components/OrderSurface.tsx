import { cn } from 'cn'
import { createContext, type ReactNode, useContext } from 'react'
import {
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'

// Form đặt lệnh dùng ở hai nơi: hộp thoại (trang chi tiết mã) và panel cạnh bảng giá.
// Hộp thoại cần DialogTitle cho trình đọc màn hình, panel dùng thẻ tiêu đề thường.
export type OrderSurface = 'dialog' | 'panel'

const SurfaceContext = createContext<OrderSurface>('dialog')

export const OrderSurfaceProvider = SurfaceContext.Provider

export function useOrderSurface(): OrderSurface {
  return useContext(SurfaceContext)
}

type StepHeaderProps = {
  title: string
  description: string
  hideInPanel?: boolean // panel đã có tiêu đề "Đặt lệnh" ở đầu
}

export function StepHeader({
  title,
  description,
  hideInPanel,
}: StepHeaderProps) {
  const surface = useOrderSurface()
  if (surface === 'dialog') {
    return (
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
    )
  }
  if (hideInPanel) return null
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

// Khung ngoài mỗi bước. Trong hộp thoại phải co được (min-h-0) thì StepBody mới cuộn.
// Panel tự cuộn cả khối, thêm min-h-0 thì form bị ép đè lên sổ lệnh bên dưới.
export function stepClass(surface: OrderSurface) {
  return cn('flex flex-col gap-4', surface === 'dialog' && 'min-h-0')
}

// Phần giữa header và footer: hộp thoại chỉ cuộn phần này, panel để nguyên
export function StepBody({ children }: { children: ReactNode }) {
  const surface = useOrderSurface()
  if (surface === 'dialog') {
    return <DialogBody className="flex flex-col gap-4">{children}</DialogBody>
  }
  return <>{children}</>
}

export function StepFooter({ children }: { children: ReactNode }) {
  const surface = useOrderSurface()
  if (surface === 'dialog') return <DialogFooter>{children}</DialogFooter>
  return <div className="grid grid-cols-[auto_1fr] gap-2">{children}</div>
}
