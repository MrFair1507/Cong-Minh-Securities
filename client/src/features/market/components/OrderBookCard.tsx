import { cn } from 'cn'
import { useTranslation } from 'react-i18next'
import { formatPrice, formatRatio, formatVolume } from '@/shared/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import type { BoardStock } from '../api/stocks'
import { bookSummary, toneClass } from '../lib/board'
import { BoardValue } from './BoardValue'

type OrderBookProps = {
  stock: BoardStock
}

// Dư mua – dư bán 3 bước giá (simulator dựng quanh giá khớp, chỉ để tham khảo)
export function OrderBook({ stock }: OrderBookProps) {
  const { t } = useTranslation('market')
  const book = bookSummary(stock)
  const barWidth = (volume: number | undefined) =>
    `${book.maxVolume > 0 && volume ? (volume / book.maxVolume) * 100 : 0}%`

  return (
    <div className="flex flex-col gap-3 text-xs tabular-nums">
      <div className="flex flex-col gap-1">
        <div
          className="flex h-2 overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label={t('stock.book.ratioLabel', {
            bid: formatRatio(book.bidRatio),
            ask: formatRatio(1 - book.bidRatio),
          })}
        >
          <span
            className="bg-price-up transition-[width] duration-500"
            style={{ width: `${book.bidRatio * 100}%` }}
          />
          <span className="flex-1 bg-price-down" />
        </div>
        <div className="flex justify-between">
          <span className="text-price-up">
            {t('stock.book.bidTotal', {
              volume: formatVolume(book.bidTotal),
              percent: formatRatio(book.bidRatio),
            })}
          </span>
          <span className="text-price-down">
            {t('stock.book.askTotal', {
              volume: formatVolume(book.askTotal),
              percent: formatRatio(1 - book.bidRatio),
            })}
          </span>
        </div>
      </div>

      <table className="w-full table-fixed border-collapse">
        <thead className="text-muted-foreground">
          <tr>
            <th className="py-1 text-left font-medium">
              {t('stock.book.bidVolume')}
            </th>
            <th className="py-1 text-right font-medium">
              {t('stock.book.bidPrice')}
            </th>
            <th className="py-1 text-left font-medium">
              <span className="pl-1.5">{t('stock.book.askPrice')}</span>
            </th>
            <th className="py-1 text-right font-medium">
              {t('stock.book.askVolume')}
            </th>
          </tr>
        </thead>
        <tbody>
          {book.levels.map((level, i) => (
            // Thứ tự bước giá cố định 1–3 nên dùng chỉ số làm key
            // biome-ignore lint/suspicious/noArrayIndexKey: bước giá cố định
            <tr key={i}>
              <td colSpan={2} className="p-0">
                <div className="relative flex items-center justify-between">
                  <span
                    aria-hidden
                    className="absolute inset-y-0.5 right-0 rounded-sm bg-price-up/10"
                    style={{ width: barWidth(level.bidVolume) }}
                  />
                  <BoardValue
                    value={level.bidVolume}
                    text={
                      level.bidVolume === undefined
                        ? '–'
                        : formatVolume(level.bidVolume)
                    }
                    className="relative px-0 text-left"
                  />
                  <BoardValue
                    value={level.bidPrice}
                    text={
                      level.bidPrice === undefined
                        ? ''
                        : formatPrice(level.bidPrice)
                    }
                    className={cn(
                      'relative font-medium',
                      toneClass(level.bidPrice, stock),
                    )}
                  />
                </div>
              </td>
              <td colSpan={2} className="border-l p-0">
                <div className="relative flex items-center justify-between">
                  <span
                    aria-hidden
                    className="absolute inset-y-0.5 left-0 rounded-sm bg-price-down/10"
                    style={{ width: barWidth(level.askVolume) }}
                  />
                  <BoardValue
                    value={level.askPrice}
                    text={
                      level.askPrice === undefined
                        ? ''
                        : formatPrice(level.askPrice)
                    }
                    className={cn(
                      'relative text-left font-medium',
                      toneClass(level.askPrice, stock),
                    )}
                  />
                  <BoardValue
                    value={level.askVolume}
                    text={
                      level.askVolume === undefined
                        ? '–'
                        : formatVolume(level.askVolume)
                    }
                    className="relative px-0"
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function OrderBookCard({ stock }: OrderBookProps) {
  const { t } = useTranslation('market')
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold">{t('stock.book.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <OrderBook stock={stock} />
      </CardContent>
    </Card>
  )
}
