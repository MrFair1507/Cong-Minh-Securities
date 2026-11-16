import { createFileRoute } from '@tanstack/react-router'
import { ordersQueryOptions } from '@/features/trading/api/orders'
import { OrdersPage } from '@/features/trading/pages/OrdersPage'
import { ordersSearchSchema } from '@/features/trading/schemas'

// Bộ lọc nằm trên URL: /orders?side=BUY&symbol=FPT
export const Route = createFileRoute('/_app/_authed/orders')({
  validateSearch: ordersSearchSchema,
  loader: ({ context }) =>
    context.queryClient.query({
      ...ordersQueryOptions(context.session.user.id),
      staleTime: 'static',
    }),
  component: OrdersPage,
})
