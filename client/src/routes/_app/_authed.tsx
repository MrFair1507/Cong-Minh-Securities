import { createFileRoute, redirect } from '@tanstack/react-router'

// Chưa đăng nhập thì chuyển sang /login, kèm trang đang mở để đăng nhập xong quay lại
export const Route = createFileRoute('/_app/_authed')({
  beforeLoad: ({ context, location }) => {
    if (!context.session) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
})
