import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'

// completed: bật ngay trước khi signUp để guard không đá sang /market,
// nhờ vậy người dùng kịp xem bước 4 (số tài khoản)
const registerSearchSchema = z.object({
  completed: z.boolean().optional().catch(undefined),
})

export const Route = createFileRoute('/_guest/register')({
  validateSearch: registerSearchSchema,
  beforeLoad: ({ context, search }) => {
    if (context.session && !search.completed) throw redirect({ to: '/market' })
  },
  component: RegisterPage,
})
