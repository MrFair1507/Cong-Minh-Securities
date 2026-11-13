import { createFileRoute, notFound } from '@tanstack/react-router'
import { priceHistoryQueryOptions } from '@/features/market/api/priceHistory'
import { stocksQueryOptions } from '@/features/market/api/stocks'
import { StockNotFound, StockPage } from '@/features/market/pages/StockPage'

// Chi tiết mã: dùng lại danh sách mã của bảng giá (đã có Realtime), nạp thêm nến ngày
export const Route = createFileRoute('/_app/_authed/stocks/$symbol')({
  loader: async ({ context, params }) => {
    const stocks = await context.queryClient.ensureQueryData(
      stocksQueryOptions(),
    )
    const stock = stocks.find((s) => s.symbol === params.symbol)
    if (!stock) throw notFound()
    await context.queryClient.ensureQueryData(
      priceHistoryQueryOptions(stock.id),
    )
  },
  component: StockPage,
  notFoundComponent: StockNotFound,
})
