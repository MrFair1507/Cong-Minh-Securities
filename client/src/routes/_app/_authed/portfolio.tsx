import { createFileRoute } from '@tanstack/react-router'
import { profileQueryOptions } from '@/features/auth/api/profile'
import { stocksQueryOptions } from '@/features/market/api/stocks'
import { holdingsQueryOptions } from '@/features/portfolio/api/holdings'
import { PortfolioPage } from '@/features/portfolio/pages/PortfolioPage'

// Danh mục: dùng lại danh sách mã của bảng giá (đã có Realtime) để lấy giá hiện tại.
// Danh mục và tiền mặt không để 'static': mua/bán ở trang khác xong, quay lại phải lấy mới.
export const Route = createFileRoute('/_app/_authed/portfolio')({
  loader: ({ context }) => {
    const userId = context.session.user.id
    return Promise.all([
      context.queryClient.query({
        ...stocksQueryOptions(),
        staleTime: 'static',
      }),
      context.queryClient.query(holdingsQueryOptions(userId)),
      context.queryClient.query(profileQueryOptions(userId)),
    ])
  },
  component: PortfolioPage,
})
