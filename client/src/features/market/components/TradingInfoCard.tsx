import { useTranslation } from 'react-i18next'
import { LOT_SIZE, TICK_SIZE } from '@/shared/constants/market'
import { formatPrice, formatVolume } from '@/shared/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import type { BoardStock } from '../api/stocks'
import { toneClass } from '../lib/board'

type TradingInfoCardProps = {
  stock: BoardStock
  open: number | undefined // giá mở cửa = open của nến phiên đang chạy
}

type InfoRow = {
  key:
    | 'ref'
    | 'ceiling'
    | 'floor'
    | 'open'
    | 'high'
    | 'low'
    | 'totalVolume'
    | 'tickLot'
  value: string
  className?: string
}

export function TradingInfoCard({ stock, open }: TradingInfoCardProps) {
  const { t } = useTranslation('market')
  const price = (value: number | null | undefined) =>
    value == null ? '–' : formatPrice(value)

  const rows: InfoRow[] = [
    {
      key: 'ref',
      value: price(stock.ref_price),
      className: 'text-price-ref',
    },
    {
      key: 'ceiling',
      value: price(stock.ceiling_price),
      className: 'text-price-ceil',
    },
    {
      key: 'floor',
      value: price(stock.floor_price),
      className: 'text-price-floor',
    },
    { key: 'open', value: price(open), className: toneClass(open, stock) },
    {
      key: 'high',
      value: price(stock.high_price),
      className: toneClass(stock.high_price ?? undefined, stock),
    },
    {
      key: 'low',
      value: price(stock.low_price),
      className: toneClass(stock.low_price ?? undefined, stock),
    },
    { key: 'totalVolume', value: formatVolume(stock.volume) },
    {
      key: 'tickLot',
      value: t('stock.info.tickLotValue', {
        tick: formatPrice(TICK_SIZE),
        lot: LOT_SIZE,
      }),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold">{t('stock.info.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-2 tabular-nums">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center justify-between">
              <dt className="text-muted-foreground">
                {t(`stock.info.${row.key}`)}
              </dt>
              <dd className={row.className}>{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
