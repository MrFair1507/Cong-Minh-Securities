import type { OrderSide } from '@cms/shared/trading'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate, useRouteContext, useSearch } from '@tanstack/react-router'
import type { SortingState, Updater } from '@tanstack/react-table'
import { cn } from 'cn'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TradePanel } from '@/features/trading/components/TradePanel'
import { stocksQueryOptions } from '../api/stocks'
import { BoardToolbar } from '../components/BoardToolbar'
import { PriceBoard } from '../components/PriceBoard'
import { useStocksRealtime } from '../hooks/useStocksRealtime'
import { filterStocks } from '../lib/board'
import {
  type MarketSearch,
  sortParamToState,
  sortStateToParam,
} from '../schemas'

export function MarketPage() {
  const { t } = useTranslation('market')
  const search = useSearch({ from: '/_app/market' })
  const { session } = useRouteContext({ from: '/_app/market' })
  const navigate = useNavigate({ from: '/market' })
  // Loader của route đã nạp sẵn dữ liệu, Realtime cập nhật tiếp vào cache
  const { data: stocks } = useSuspenseQuery(stocksQueryOptions())
  useStocksRealtime()

  const rows = useMemo(
    () => filterStocks(stocks, search.exchange, search.q),
    [stocks, search.exchange, search.q],
  )
  const sorting = useMemo(() => sortParamToState(search.sort), [search.sort])
  // Mã trên URL không có trong danh sách thì coi như panel đóng
  const tradeStock = stocks.find((s) => s.symbol === search.trade)

  // Mọi bộ lọc ghi lên URL (replace: không làm dày lịch sử trình duyệt)
  const updateSearch = useCallback(
    (patch: Partial<MarketSearch>) => {
      navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })
    },
    [navigate],
  )

  function handleSortingChange(updater: Updater<SortingState>) {
    const next = typeof updater === 'function' ? updater(sorting) : updater
    updateSearch({ sort: sortStateToParam(next) })
  }

  const openTrade = useCallback(
    (symbol: string, side: OrderSide) => updateSearch({ trade: symbol, side }),
    [updateSearch],
  )

  return (
    <div className="flex flex-col gap-3">
      <h1 className="sr-only">{t('title')}</h1>
      <BoardToolbar
        exchange={search.exchange}
        q={search.q}
        onChange={updateSearch}
      />
      {/* Panel mở thì bảng giá nhường 360px bên phải, bảng tự cuộn ngang trong cột trái */}
      <div
        className={cn(
          'grid items-start gap-4',
          tradeStock && 'grid-cols-[minmax(0,1fr)_360px]',
        )}
      >
        {/* Không bọc overflow-x-auto: khung cuộn làm mất header dính của bảng giá */}
        <div className="min-w-0">
          <PriceBoard
            data={rows}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            onTrade={openTrade}
            activeSymbol={tradeStock?.symbol}
            compact={Boolean(tradeStock)}
          />
        </div>
        {tradeStock && (
          <TradePanel
            stocks={stocks}
            stock={tradeStock}
            side={search.side ?? 'BUY'}
            session={session}
            onClose={() => updateSearch({ trade: undefined, side: undefined })}
            onSymbolChange={(symbol) => updateSearch({ trade: symbol })}
            onSideChange={(side) => updateSearch({ side })}
          />
        )}
      </div>
    </div>
  )
}
