import type { OrderSide } from '@cms/shared/trading'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
  Link,
  notFound,
  useParams,
  useRouteContext,
} from '@tanstack/react-router'
import { cn } from 'cn'
import { ArrowLeft } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { OrderDialog } from '@/features/trading/components/OrderDialog'
import { SIDE_STYLE } from '@/features/trading/components/OrderSummary'
import {
  formatPercent,
  formatPrice,
  formatPriceChange,
} from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardAction, CardHeader, CardTitle } from '@/shared/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { priceHistoryQueryOptions } from '../api/priceHistory'
import { stocksQueryOptions } from '../api/stocks'
import { BoardValue } from '../components/BoardValue'
import { CandleChart } from '../components/CandleChart'
import { HoldingCard } from '../components/HoldingCard'
import { OrderBookCard } from '../components/OrderBookCard'
import { RecentTradesCard } from '../components/RecentTradesCard'
import { TradingInfoCard } from '../components/TradingInfoCard'
import { useStocksRealtime } from '../hooks/useStocksRealtime'
import { toneClass } from '../lib/board'
import {
  CHART_RANGES,
  type ChartRange,
  filterRange,
  toCandle,
  withLiveCandle,
} from '../lib/candles'

const ROUTE_ID = '/_app/_authed/stocks/$symbol'

export function StockPage() {
  const { t } = useTranslation('market')
  const { symbol } = useParams({ from: ROUTE_ID })
  const { session } = useRouteContext({ from: ROUTE_ID })
  // Dùng chung cache với bảng giá: Realtime cập nhật một chỗ, cả hai trang cùng nhảy
  const { data: stocks } = useSuspenseQuery(stocksQueryOptions())
  useStocksRealtime()

  const stock = stocks.find((s) => s.symbol === symbol)
  if (!stock) throw notFound()

  const { data: history } = useSuspenseQuery(priceHistoryQueryOptions(stock.id))
  const [range, setRange] = useState<ChartRange>('3M')
  const [orderOpen, setOrderOpen] = useState(false)
  const [orderSide, setOrderSide] = useState<OrderSide>('BUY')

  function openOrder(side: OrderSide) {
    setOrderSide(side)
    setOrderOpen(true)
  }

  const allCandles = useMemo(
    () => withLiveCandle(history.map(toCandle), stock),
    [history, stock],
  )
  const candles = useMemo(
    () => filterRange(allCandles, range),
    [allCandles, range],
  )

  const change = stock.price - stock.ref_price
  const tone = toneClass(stock.price, stock)

  return (
    <div className="flex flex-col gap-5">
      <Link
        to="/market"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t('stock.back')}
      </Link>

      <div className="flex items-end justify-between gap-4">
        <div className="flex items-end gap-10">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className={cn('text-2xl leading-8 font-semibold', tone)}>
                {stock.symbol}
              </h1>
              <Badge variant="outline">{stock.exchanges.code}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{stock.name}</p>
          </div>
          <div className={cn('flex flex-col tabular-nums', tone)}>
            <BoardValue
              value={stock.price}
              text={formatPrice(stock.price)}
              className="rounded-md px-0 py-0 text-left text-4xl leading-10 font-semibold"
            />
            <span className="text-sm font-medium">
              {formatPriceChange(change)} (
              {formatPercent(change / stock.ref_price)})
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="lg"
            onClick={() => openOrder('SELL')}
            className={cn('px-5', SIDE_STYLE.SELL.solid)}
          >
            {t('stock.sell')}
          </Button>
          <Button
            size="lg"
            onClick={() => openOrder('BUY')}
            className={cn('px-5', SIDE_STYLE.BUY.solid)}
          >
            {t('stock.buy')}
          </Button>
        </div>
      </div>

      {session && (
        <OrderDialog
          stock={stock}
          userId={session.user.id}
          side={orderSide}
          open={orderOpen}
          onOpenChange={setOrderOpen}
        />
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-4">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-semibold">
                {t('stock.chartTitle')}
              </CardTitle>
              <CardAction>
                <Tabs
                  value={range}
                  onValueChange={(value) => setRange(value as ChartRange)}
                >
                  <TabsList aria-label={t('stock.rangeLabel')}>
                    {CHART_RANGES.map((r) => (
                      <TabsTrigger key={r} value={r}>
                        {t(`stock.ranges.${r}`)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </CardAction>
            </CardHeader>
            <div className="px-2">
              <CandleChart candles={candles} fitKey={range} />
            </div>
          </Card>
          {/* Dưới biểu đồ: sổ lệnh và khớp lệnh cạnh nhau, cột phải giữ thông tin giao dịch */}
          <div className="grid grid-cols-2 items-start gap-4">
            <OrderBookCard stock={stock} />
            <RecentTradesCard stock={stock} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <TradingInfoCard stock={stock} open={allCandles.at(-1)?.open} />
          {session && (
            <HoldingCard
              userId={session.user.id}
              stockId={stock.id}
              price={stock.price}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export function StockNotFound() {
  const { t } = useTranslation('market')
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
      <p className="text-base font-semibold">{t('stock.notFound.title')}</p>
      <p className="text-sm text-muted-foreground">
        {t('stock.notFound.description')}
      </p>
      <Button asChild variant="outline">
        <Link to="/market">{t('stock.notFound.back')}</Link>
      </Button>
    </div>
  )
}
