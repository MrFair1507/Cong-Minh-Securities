import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { LoginPage } from '@/features/auth/pages/LoginPage'

// redirect: trang cần quay lại sau khi đăng nhập (do _authed gắn vào).
// Chỉ nhận đường dẫn nội bộ "/..." (chặn "//site-khac.com"), sai thì bỏ qua.
const loginSearchSchema = z.object({
  redirect: z
    .string()
    .regex(/^\/(?!\/)/)
    .optional()
    .catch(undefined),
})

export const Route = createFileRoute('/_guest/login')({
  validateSearch: loginSearchSchema,
  beforeLoad: ({ context, search }) => {
    if (context.session) throw redirect({ href: search.redirect ?? '/market' })
  },
  component: LoginPage,
})
