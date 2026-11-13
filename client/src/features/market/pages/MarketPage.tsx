import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type { SortingState, Updater } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
  const navigate = useNavigate({ from: '/market' })
  // Loader của route đã nạp sẵn dữ liệu, Realtime cập nhật tiếp vào cache
  const { data: stocks } = useSuspenseQuery(stocksQueryOptions())
  useStocksRealtime()

  const rows = useMemo(
    () => filterStocks(stocks, search.exchange, search.q),
    [stocks, search.exchange, search.q],
  )
  const sorting = useMemo(() => sortParamToState(search.sort), [search.sort])

  // Mọi bộ lọc ghi lên URL (replace: không làm dày lịch sử trình duyệt)
  function updateSearch(patch: Partial<MarketSearch>) {
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })
  }

  function handleSortingChange(updater: Updater<SortingState>) {
    const next = typeof updater === 'function' ? updater(sorting) : updater
    updateSearch({ sort: sortStateToParam(next) })
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="sr-only">{t('title')}</h1>
      <BoardToolbar
        exchange={search.exchange}
        q={search.q}
        onChange={updateSearch}
      />
      <PriceBoard
        data={rows}
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />
    </div>
  )
}
