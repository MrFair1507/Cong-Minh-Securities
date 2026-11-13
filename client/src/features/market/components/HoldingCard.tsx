import { useQuery } from '@tanstack/react-query'
import { cn } from 'cn'
import { useTranslation } from 'react-i18next'
import { holdingQueryOptions } from '@/features/portfolio/api/holdings'
import {
  formatMoney,
  formatPercent,
  formatPrice,
  formatVolume,
} from '@/shared/lib/format'

type HoldingCardProps = {
  userId: string
  stockId: number
  price: number // giá hiện tại, dùng tính lãi/lỗ tạm tính
}

// Chỉ hiện khi đang giữ mã này
export function HoldingCard({ userId, stockId, price }: HoldingCardProps) {
  const { t } = useTranslation('market')
  const { data: holding } = useQuery(holdingQueryOptions(userId, stockId))
  if (!holding) return null

  const profit = (price - holding.avg_cost) * holding.quantity
  const ratio = (price - holding.avg_cost) / holding.avg_cost

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-muted p-4 text-sm">
      <p className="text-muted-foreground">{t('stock.holding.title')}</p>
      <p className="text-base font-semibold tabular-nums">
        {t('stock.holding.summary', {
          quantity: formatVolume(holding.quantity),
          cost: formatPrice(holding.avg_cost),
        })}
      </p>
      <p
        className={cn(
          'tabular-nums',
          profit > 0 && 'text-price-up',
          profit < 0 && 'text-price-down',
        )}
      >
        {t('stock.holding.profit', {
          amount: `${profit > 0 ? '+' : ''}${formatMoney(profit)}`,
          percent: formatPercent(ratio),
        })}
      </p>
    </div>
  )
}
