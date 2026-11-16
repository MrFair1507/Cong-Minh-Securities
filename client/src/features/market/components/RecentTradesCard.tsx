import { useQuery } from '@tanstack/react-query'
import { cn } from 'cn'
import { useTranslation } from 'react-i18next'
import {
  formatClock,
  formatPrice,
  formatPriceChange,
  formatVolume,
} from '@/shared/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import type { BoardStock } from '../api/stocks'
import { tradesQueryOptions } from '../api/trades'
import { useTradesRealtime } from '../hooks/useTradesRealtime'
import { sideTotals, toneClass } from '../lib/board'

const SIDE_CLASS = { BUY: 'text-price-up', SELL: 'text-price-down' } as const

// Khớp lệnh gần nhất của mã (simulator ghi vào bảng trades, Realtime đẩy dòng mới)
export function RecentTradesCard({ stock }: { stock: BoardStock }) {
  const { t } = useTranslation('market')
  const { data: trades = [] } = useQuery(tradesQueryOptions(stock.id))
  useTradesRealtime(stock.id)
  const totals = sideTotals(trades)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold">
          {t('stock.trades.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-xs tabular-nums">
        {trades.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground">
            {t('stock.trades.empty')}
          </p>
        ) : (
          <>
            <p className="text-muted-foreground">
              {t('stock.trades.totals', {
                buy: formatVolume(totals.BUY),
                sell: formatVolume(totals.SELL),
              })}
            </p>
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-card text-muted-foreground">
                  <tr>
                    <th className="py-1 text-left font-medium">
                      {t('stock.trades.time')}
                    </th>
                    <th className="py-1 text-right font-medium">
                      {t('stock.trades.price')}
                    </th>
                    <th className="py-1 text-right font-medium">
                      {t('stock.trades.change')}
                    </th>
                    <th className="py-1 text-right font-medium">
                      {t('stock.trades.volume')}
                    </th>
                    <th className="py-1 text-right font-medium">
                      {t('stock.trades.side')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => {
                    const tone = toneClass(trade.price, stock)
                    return (
                      <tr key={trade.id} className="border-t">
                        <td className="py-1 text-muted-foreground">
                          {formatClock(trade.created_at)}
                        </td>
                        <td className={cn('py-1 text-right font-medium', tone)}>
                          {formatPrice(trade.price)}
                        </td>
                        <td className={cn('py-1 text-right', tone)}>
                          {formatPriceChange(trade.price - stock.ref_price)}
                        </td>
                        <td className="py-1 text-right">
                          {formatVolume(trade.volume)}
                        </td>
                        <td
                          className={cn(
                            'py-1 text-right font-semibold',
                            SIDE_CLASS[trade.side],
                          )}
                        >
                          <abbr
                            title={t(`stock.trades.side${trade.side}`)}
                            className="no-underline"
                          >
                            {t(`stock.trades.${trade.side}`)}
                          </abbr>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
