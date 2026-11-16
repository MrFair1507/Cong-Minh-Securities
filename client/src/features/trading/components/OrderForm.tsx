import { maxBuyQuantity, type OrderSide } from '@cms/shared/trading'
import { useForm, useStore } from '@tanstack/react-form'
import { cn } from 'cn'
import { Minus, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { BoardStock } from '@/features/market/api/stocks'
import { BoardValue } from '@/features/market/components/BoardValue'
import { toneClass } from '@/features/market/lib/board'
import { FormField } from '@/shared/components/FormField'
import { LOT_SIZE } from '@/shared/constants/market'
import { formatMoney, formatPrice, formatVolume } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  isLotQuantity,
  parseQuantity,
  quickQuantity,
  stepQuantity,
} from '../lib/order'
import { ORDER_SIDES, orderFormSchema } from '../schemas'
import { OrderCostRows, SIDE_STYLE, SummaryBox } from './OrderSummary'
import { StepFooter, StepHeader, useOrderSurface } from './OrderSurface'

// Nút đặt nhanh theo tỷ lệ của khối lượng tối đa
const QUICK_RATIOS = [0.25, 0.5, 0.75, 1] as const

type OrderFormProps = {
  stock: BoardStock
  side: OrderSide
  onSideChange: (side: OrderSide) => void
  defaultQuantity: number
  cash: number // tiền mặt hiện có
  held: number // số cổ phiếu đang giữ của mã này
  avgCost?: number // giá vốn của mã này, để tính lãi/lỗ khi bán
  onCancel: () => void
  onContinue: (quantity: number) => void
}

// Bước 1 (frame 10): chọn chiều lệnh, nhập khối lượng, xem trước số tiền
export function OrderForm({
  stock,
  side,
  onSideChange,
  defaultQuantity,
  cash,
  held,
  avgCost,
  onCancel,
  onContinue,
}: OrderFormProps) {
  const { t } = useTranslation('trading')
  const surface = useOrderSurface()
  const schema = orderFormSchema(t)

  const form = useForm({
    defaultValues: {
      quantity: defaultQuantity > 0 ? String(defaultQuantity) : '',
    },
    validators: { onChange: schema, onSubmit: schema },
    onSubmit: ({ value }) => onContinue(parseQuantity(value.quantity)),
  })

  // Giá nhảy liên tục nên giới hạn tối đa tính lại mỗi lần render, không để trong schema
  const quantity = parseQuantity(
    useStore(form.store, (state) => state.values.quantity),
  )
  const max =
    side === 'BUY' ? maxBuyQuantity(cash, stock.price, LOT_SIZE) : held
  const exceeds = quantity > max
  const canContinue = isLotQuantity(quantity) && !exceeds
  const tone = toneClass(stock.price, stock)

  function setQuantity(value: number) {
    form.setFieldValue('quantity', value > 0 ? String(value) : '')
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (canContinue) form.handleSubmit()
      }}
      className="flex flex-col gap-4"
    >
      <StepHeader
        title={t('dialog.title')}
        description={t('dialog.description')}
        hideInPanel
      />

      <fieldset className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        <legend className="sr-only">{t('dialog.sideLabel')}</legend>
        {ORDER_SIDES.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === side}
            onClick={() => onSideChange(option)}
            className={cn(
              'h-8 rounded-md text-sm font-semibold transition-colors',
              option === side
                ? SIDE_STYLE[option].solid
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`side.${option}`)}
          </button>
        ))}
      </fieldset>

      <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={cn('text-base font-semibold', tone)}>
              {stock.symbol}
            </span>
            <Badge variant="outline">{stock.exchanges.code}</Badge>
          </div>
          <span className="truncate text-xs text-muted-foreground">
            {stock.name}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 tabular-nums">
          <BoardValue
            value={stock.price}
            text={formatPrice(stock.price)}
            className={cn('rounded px-1 py-0 text-xl font-semibold', tone)}
          />
          <span className="flex gap-2 text-xs">
            <span className="text-price-ceil">
              {t('dialog.ceiling', { value: formatPrice(stock.ceiling_price) })}
            </span>
            <span className="text-price-ref">
              {t('dialog.ref', { value: formatPrice(stock.ref_price) })}
            </span>
            <span className="text-price-floor">
              {t('dialog.floor', { value: formatPrice(stock.floor_price) })}
            </span>
          </span>
        </div>
      </div>

      {/* Panel hẹp (360px) nên xếp dọc, hộp thoại đủ rộng để chia 2 cột */}
      <div
        className={cn(
          'grid items-start gap-3',
          surface === 'panel' ? 'grid-cols-1' : 'grid-cols-[2fr_3fr]',
        )}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="orderType" className="leading-5">
            {t('dialog.orderType')}
          </Label>
          <Input
            id="orderType"
            value={t('dialog.marketOrder')}
            readOnly
            disabled
            className="h-9 px-3"
          />
        </div>
        <div className="flex flex-col gap-2">
          <form.Field name="quantity">
            {(field) => (
              <FormField
                field={field}
                label={t('dialog.quantity')}
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                placeholder={t('dialog.quantityPlaceholder')}
                className="h-9 px-3 text-right tabular-nums"
                error={
                  exceeds
                    ? t('errors.quantityMax', { max: formatVolume(max) })
                    : undefined
                }
                hint={t('dialog.quantityHint', { lot: LOT_SIZE })}
                before={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    aria-label={t('dialog.stepDown', { lot: LOT_SIZE })}
                    disabled={quantity <= LOT_SIZE}
                    onClick={() => setQuantity(stepQuantity(quantity, -1, max))}
                  >
                    <Minus aria-hidden />
                  </Button>
                }
                after={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    aria-label={t('dialog.stepUp', { lot: LOT_SIZE })}
                    disabled={quantity >= max}
                    onClick={() => setQuantity(stepQuantity(quantity, 1, max))}
                  >
                    <Plus aria-hidden />
                  </Button>
                }
              />
            )}
          </form.Field>
          <div className="grid grid-cols-4 gap-1.5">
            {QUICK_RATIOS.map((ratio) => {
              const value = quickQuantity(max, ratio, LOT_SIZE)
              const percent = `${ratio * 100}%`
              return (
                <Button
                  key={ratio}
                  type="button"
                  variant={
                    value > 0 && value === quantity ? 'secondary' : 'outline'
                  }
                  size="sm"
                  disabled={value === 0}
                  aria-label={t('dialog.quickRatio', { percent })}
                  onClick={() => setQuantity(value)}
                >
                  {percent}
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      <dl className="flex flex-col gap-1.5 rounded-lg bg-muted/60 px-4 py-3 text-sm tabular-nums">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">
            {side === 'BUY' ? t('dialog.buyingPower') : t('dialog.sellable')}
          </dt>
          <dd className="font-semibold">
            {side === 'BUY'
              ? formatMoney(cash)
              : t('dialog.sellableValue', { quantity: formatVolume(held) })}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">{t('dialog.maxQuantity')}</dt>
          <dd className="font-semibold">
            {t('dialog.sellableValue', { quantity: formatVolume(max) })}
          </dd>
        </div>
      </dl>

      <SummaryBox>
        <OrderCostRows
          side={side}
          price={stock.price}
          quantity={quantity}
          avgCost={avgCost}
        />
      </SummaryBox>

      <StepFooter>
        <Button type="button" variant="outline" size="lg" onClick={onCancel}>
          {t('dialog.cancel')}
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={!canContinue}
          className={SIDE_STYLE[side].solid}
        >
          {canContinue
            ? t('dialog.continueWith', {
                side: t(`side.${side}`),
                quantity: formatVolume(quantity),
                symbol: stock.symbol,
              })
            : t('dialog.continue')}
        </Button>
      </StepFooter>
    </form>
  )
}
