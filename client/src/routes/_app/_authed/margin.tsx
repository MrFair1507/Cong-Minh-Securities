import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { profileQueryOptions } from '@/features/auth/api/profile'
import {
  marginAccountQueryOptions,
  marginLoansQueryOptions,
  marginPackagesQueryOptions,
} from '@/features/margin/api/margin'
import { MARGIN_TABS } from '@/features/margin/lib/tabs'
import { MarginPage } from '@/features/margin/pages/MarginPage'
import { stocksQueryOptions } from '@/features/market/api/stocks'
import { holdingsQueryOptions } from '@/features/portfolio/api/holdings'

// /margin?tab=packages · ?repay=true mở hộp thoại trả nợ (nút "Trả nợ ngay" của popup cảnh báo)
const marginSearchSchema = z.object({
  tab: z.enum(MARGIN_TABS).optional().catch(undefined),
  repay: z.boolean().optional().catch(undefined),
})

export const Route = createFileRoute('/_app/_authed/margin')({
  validateSearch: marginSearchSchema,
  // Khoản vay, tiền mặt đổi theo đặt lệnh/trả nợ: không để 'static'
  loader: ({ context }) => {
    const userId = context.session.user.id
    return Promise.all([
      context.queryClient.query({
        ...stocksQueryOptions(),
        staleTime: 'static',
      }),
      context.queryClient.query(marginAccountQueryOptions(userId)),
      context.queryClient.query(marginLoansQueryOptions(userId)),
      context.queryClient.query(marginPackagesQueryOptions()),
      context.queryClient.query(holdingsQueryOptions(userId)),
      context.queryClient.query(profileQueryOptions(userId)),
    ])
  },
  component: MarginPage,
})
