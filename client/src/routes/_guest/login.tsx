import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'

// redirect: trang cần quay lại sau khi đăng nhập (do _authed gắn vào)
const loginSearchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/_guest/login')({
  validateSearch: loginSearchSchema,
  component: () => <PlaceholderPage page="login" />,
})
