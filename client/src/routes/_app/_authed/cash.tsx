import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { profileQueryOptions } from '@/features/auth/api/profile'
import {
  bankLinksQueryOptions,
  banksQueryOptions,
} from '@/features/cash/api/banks'
import { cashQueryOptions } from '@/features/cash/api/cash'
import { CASH_TYPES } from '@/features/cash/lib/cash'
import { CashPage } from '@/features/cash/pages/CashPage'

// Lọc theo loại giao dịch trên URL: /cash?type=DEPOSIT
const cashSearchSchema = z.object({
  type: z.enum(CASH_TYPES).optional().catch(undefined),
})

export const Route = createFileRoute('/_app/_authed/cash')({
  validateSearch: cashSearchSchema,
  // Mua/bán/nộp/rút đều đổi dòng tiền: không để 'static', vào trang là lấy mới
  loader: ({ context }) => {
    const userId = context.session.user.id
    return Promise.all([
      context.queryClient.query(cashQueryOptions(userId)),
      context.queryClient.query(bankLinksQueryOptions(userId)),
      context.queryClient.query(banksQueryOptions()),
      context.queryClient.query(profileQueryOptions(userId)),
    ])
  },
  component: CashPage,
})
