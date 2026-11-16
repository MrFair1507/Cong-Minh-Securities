import type { OrderSide } from '@cms/shared/trading'
import { Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { BoardStock } from '@/features/market/api/stocks'
import { formatPrice, formatVolume } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { placeOrderErrorCode, usePlaceOrder } from '../api/placeOrder'
import {
  OrderCostRows,
  SIDE_STYLE,
  SummaryBox,
  SummaryRow,
} from './OrderSummary'
import { StepFooter, StepHeader } from './OrderSurface'

type OrderConfirmProps = {
  stock: BoardStock
  side: OrderSide
  quantity: number
  avgCost?: number
  onBack: () => void
  onDone: () => void
}

// Bước 2 (frame 11): tóm tắt lệnh, bấm xác nhận mới gọi RPC place_order
export function OrderConfirm({
  stock,
  side,
  quantity,
  avgCost,
  onBack,
  onDone,
}: OrderConfirmProps) {
  const { t } = useTranslation('trading')
  const placeOrder = usePlaceOrder()
  const sideText = t(`side.${side}`)

  function submit() {
    placeOrder.mutate(
      { symbol: stock.symbol, side, quantity },
      {
        onSuccess: () => {
          toast.success(
            t('success', {
              side: sideText,
              quantity: formatVolume(quantity),
              symbol: stock.symbol,
            }),
          )
          onDone()
        },
        onError: (error) =>
          toast.error(t(`errors.${placeOrderErrorCode(error)}`)),
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <StepHeader
        title={t(`confirm.title${side}`)}
        description={t('confirm.description')}
      />

      <SummaryBox>
        <SummaryRow
          label={t('confirm.symbol')}
          value={`${stock.symbol} · ${stock.exchanges.code}`}
          strong
        />
        <SummaryRow
          label={t('confirm.order')}
          value={t('confirm.orderValue', { side: sideText })}
          strong
          className={SIDE_STYLE[side].text}
        />
        <SummaryRow
          label={t('confirm.quantity')}
          value={t('confirm.quantityValue', {
            quantity: formatVolume(quantity),
          })}
        />
        <SummaryRow
          label={t('confirm.price')}
          value={formatPrice(stock.price)}
        />
        <div className="my-1 border-t" />
        <OrderCostRows
          side={side}
          price={stock.price}
          quantity={quantity}
          avgCost={avgCost}
        />
      </SummaryBox>

      <p className="flex gap-2 rounded-lg bg-warning-bg p-3 text-xs leading-5 text-warning">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t('confirm.note')}
      </p>

      <StepFooter>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
          disabled={placeOrder.isPending}
        >
          {t('confirm.back')}
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={submit}
          disabled={placeOrder.isPending}
          className={SIDE_STYLE[side].solid}
        >
          {placeOrder.isPending
            ? t('confirm.submitting')
            : t(`confirm.submit${side}`)}
        </Button>
      </StepFooter>
    </div>
  )
}
