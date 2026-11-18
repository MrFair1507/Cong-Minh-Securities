import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'

// email: điền sẵn từ ô email ở màn đăng nhập (nếu đã gõ)
const forgotSearchSchema = z.object({
  email: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/_guest/forgot-password')({
  validateSearch: forgotSearchSchema,
  beforeLoad: ({ context }) => {
    if (context.session) throw redirect({ to: '/market' })
  },
  component: ForgotPasswordPage,
})
