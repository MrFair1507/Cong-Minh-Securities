import { createFileRoute } from '@tanstack/react-router'
import { stocksQueryOptions } from '@/features/market/api/stocks'
import { MarketPage } from '@/features/market/pages/MarketPage'
import { marketSearchSchema } from '@/features/market/schemas'

// Khách xem được. Bộ lọc nằm trên URL: /market?exchange=HOSE&q=FPT&sort=-volume
export const Route = createFileRoute('/_app/market')({
  validateSearch: marketSearchSchema,
  loader: ({ context }) =>
    context.queryClient.query({ ...stocksQueryOptions(), staleTime: 'static' }),
  component: MarketPage,
})
