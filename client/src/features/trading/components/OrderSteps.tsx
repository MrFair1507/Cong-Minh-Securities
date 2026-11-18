import type { OrderSide } from '@cms/shared/trading'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { profileQueryOptions } from '@/features/auth/api/profile'
import { marginPackagesQueryOptions } from '@/features/margin/api/margin'
import { useMarginSummary } from '@/features/margin/hooks/useMarginSummary'
import { appliedPackage } from '@/features/margin/lib/packages'
import type { BoardStock } from '@/features/market/api/stocks'
import { holdingQueryOptions } from '@/features/portfolio/api/holdings'
import type { OrderMargin } from './MarginOrder'
import { OrderConfirm } from './OrderConfirm'
import { OrderForm } from './OrderForm'
import { type OrderSurface, OrderSurfaceProvider } from './OrderSurface'

type OrderStepsProps = {
  stock: BoardStock // lấy từ cache ['stocks'] nên giá tự nhảy theo Realtime
  userId: string
  initialSide: OrderSide
  side?: OrderSide // panel: chiều lệnh do URL quyết định (bấm ô giá khác thì đổi theo)
  surface: OrderSurface
  onCancel: () => void
  onDone: () => void // đặt lệnh thành công
  onSideChange?: (side: OrderSide) => void // panel ghi chiều lệnh lên URL
}

// Đặt lệnh → Xác nhận lệnh. Muốn bắt đầu lại từ đầu thì đổi key của component.
export function OrderSteps({
  stock,
  userId,
  initialSide,
  side: controlledSide,
  surface,
  onCancel,
  onDone,
  onSideChange,
}: OrderStepsProps) {
  const [localSide, setLocalSide] = useState(initialSide)
  const side = controlledSide ?? localSide
  const [quantity, setQuantity] = useState(0)
  const [step, setStep] = useState<'form' | 'confirm'>('form')

  // Chiều lệnh đổi từ bên ngoài khi đang ở bước xác nhận: quay về bước nhập để không gửi nhầm chiều
  const [shownSide, setShownSide] = useState(side)
  if (shownSide !== side) {
    setShownSide(side)
    setStep('form')
  }
  const { data: profile } = useQuery(profileQueryOptions(userId))
  const { data: holding } = useQuery(holdingQueryOptions(userId, stock.id))
  const avgCost = holding?.avg_cost

  // Vay ký quỹ: giữ lựa chọn khi chuyển qua lại giữa 2 bước
  const [useMargin, setUseMargin] = useState(false)
  const summary = useMarginSummary(userId)
  const { data: packages = [] } = useQuery(marginPackagesQueryOptions())
  const margin: OrderMargin = {
    hasAccount: summary.account !== null,
    position: summary.position,
    initialRate: summary.rates.initialRate,
    pkg: appliedPackage(packages, summary.packageCode, stock.id),
  }
  const borrowing =
    side === 'BUY' && margin.hasAccount && stock.loan_rate > 0 && useMargin

  return (
    <OrderSurfaceProvider value={surface}>
      {step === 'confirm' ? (
        <OrderConfirm
          stock={stock}
          side={side}
          quantity={quantity}
          avgCost={avgCost}
          margin={borrowing ? margin : undefined}
          onBack={() => setStep('form')}
          onDone={onDone}
        />
      ) : (
        <OrderForm
          stock={stock}
          side={side}
          onSideChange={(next) => {
            setLocalSide(next)
            onSideChange?.(next)
          }}
          defaultQuantity={quantity}
          cash={profile?.cash_balance ?? 0}
          held={holding?.quantity ?? 0}
          avgCost={avgCost}
          margin={margin}
          useMargin={borrowing}
          onUseMarginChange={setUseMargin}
          onCancel={onCancel}
          onContinue={(value) => {
            setQuantity(value)
            setStep('confirm')
          }}
        />
      )}
    </OrderSurfaceProvider>
  )
}
