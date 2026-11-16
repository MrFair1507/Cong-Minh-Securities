import type { OrderSide } from '@cms/shared/trading'
import type { BoardStock } from '@/features/market/api/stocks'
import { Dialog, DialogContent } from '@/shared/ui/dialog'
import { OrderSteps } from './OrderSteps'

type OrderDialogProps = {
  stock: BoardStock // lấy từ cache ['stocks'] nên giá tự nhảy theo Realtime
  userId: string
  side: OrderSide // chiều lệnh khi mở (nút Mua hay Bán)
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Hộp thoại Đặt lệnh → Xác nhận lệnh. Đóng lại thì Radix gỡ nội dung, mở lần sau bắt đầu lại từ đầu.
export function OrderDialog({
  stock,
  userId,
  side,
  open,
  onOpenChange,
}: OrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 sm:max-w-[520px]">
        <OrderSteps
          stock={stock}
          userId={userId}
          initialSide={side}
          surface="dialog"
          onCancel={() => onOpenChange(false)}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
