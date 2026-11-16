import { createFileRoute, notFound } from '@tanstack/react-router'
import { priceHistoryQueryOptions } from '@/features/market/api/priceHistory'
import { stocksQueryOptions } from '@/features/market/api/stocks'
import { tradesQueryOptions } from '@/features/market/api/trades'
import { StockNotFound, StockPage } from '@/features/market/pages/StockPage'

// Chi tiết mã: dùng lại danh sách mã của bảng giá (đã có Realtime), nạp thêm nến ngày
export const Route = createFileRoute('/_app/_authed/stocks/$symbol')({
  loader: async ({ context, params }) => {
    const stocks = await context.queryClient.query({
      ...stocksQueryOptions(),
      staleTime: 'static',
    })
    const stock = stocks.find((s) => s.symbol === params.symbol)
    if (!stock) throw notFound()
    // Khớp lệnh không để 'static': rời trang thì Realtime ngắt, quay lại phải lấy lại
    await Promise.all([
      context.queryClient.query({
        ...priceHistoryQueryOptions(stock.id),
        staleTime: 'static',
      }),
      context.queryClient.query(tradesQueryOptions(stock.id)),
    ])
  },

  component: StockPage,
  notFoundComponent: StockNotFound,
})
