import { type OrderSide, orderCost, sellProfit } from '@cms/shared/trading'
import { cn } from 'cn'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { formatMoney, formatPercent, formatVolume } from '@/shared/lib/format'

// Màu theo chiều lệnh: mua xanh, bán đỏ (cùng token màu giá)
export const SIDE_STYLE = {
  BUY: {
    solid: 'bg-price-up text-white hover:bg-price-up/90',
    text: 'text-price-up',
  },
  SELL: {
    solid: 'bg-price-down text-white hover:bg-price-down/90',
    text: 'text-price-down',
  },
} as const satisfies Record<OrderSide, { solid: string; text: string }>

export function SummaryBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-muted/60 p-4 text-sm">
      {children}
    </div>
  )
}

type SummaryRowProps = {
  label: string
  value: ReactNode
  strong?: boolean
  className?: string // màu của giá trị
}

export function SummaryRow({
  label,
  value,
  strong,
  className,
}: SummaryRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          'text-right tabular-nums',
          strong ? 'font-semibold' : 'font-medium',
          className,
        )}
      >
        {value}
      </span>
    </div>
  )
}

type OrderCostRowsProps = {
  side: OrderSide
  price: number
  quantity: number
  avgCost?: number // giá vốn, có thì hiện lãi/lỗ tạm tính khi bán
}

// Màu lãi/lỗ theo quy ước giá: lãi xanh, lỗ đỏ, hòa vàng
export function profitClass(value: number): string {
  if (value > 0) return 'text-price-up'
  if (value < 0) return 'text-price-down'
  return 'text-price-ref'
}

// Giá trị lệnh, phí, thuế (chỉ khi bán), tổng tiền. Số thật do RPC tính lúc khớp.
export function OrderCostRows({
  side,
  price,
  quantity,
  avgCost,
}: OrderCostRowsProps) {
  const { t } = useTranslation('trading')
  const cost = orderCost(side, price, quantity)
  const profit =
    side === 'SELL' && avgCost && quantity > 0
      ? sellProfit(avgCost, price, quantity)
      : undefined

  return (
    <>
      <SummaryRow
        label={t('dialog.value', {
          quantity: formatVolume(quantity),
          price: formatVolume(price),
        })}
        value={formatMoney(cost.value)}
      />
      <SummaryRow label={t('dialog.fee')} value={formatMoney(cost.fee)} />
      {side === 'SELL' && (
        <SummaryRow label={t('dialog.tax')} value={formatMoney(cost.tax)} />
      )}
      <div className="my-1 border-t" />
      <SummaryRow
        label={t(`dialog.total${side}`)}
        value={formatMoney(cost.total)}
        strong
      />
      {profit && (
        <SummaryRow
          label={t('dialog.profit')}
          value={`${profit.profit > 0 ? '+' : ''}${formatMoney(profit.profit)} (${formatPercent(profit.ratio)})`}
          className={profitClass(profit.profit)}
        />
      )}
    </>
  )
}
