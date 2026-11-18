import {
  createFileRoute,
  Outlet,
  redirect,
  useRouteContext,
} from '@tanstack/react-router'
import { MarginCallWatcher } from '@/features/margin/components/MarginCallWatcher'

export const Route = createFileRoute('/_app/_authed')({
  beforeLoad: ({ context, location }) => {
    if (!context.session) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    return { session: context.session }
  },
  component: AuthedLayout,
})

// Mọi trang cần đăng nhập đều nghe cảnh báo ký quỹ (popup/toast)
function AuthedLayout() {
  const { session } = useRouteContext({ from: '/_app/_authed' })
  return (
    <>
      <Outlet />
      <MarginCallWatcher userId={session.user.id} />
    </>
  )
}
