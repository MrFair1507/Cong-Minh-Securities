import { createFileRoute, Outlet, useMatchRoute } from '@tanstack/react-router'
import { cn } from 'cn'
import { AppHeader } from '@/shared/components/AppHeader'

// Khung app: header + nội dung. Không chặn, khách vẫn xem được bảng giá.
export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  const { session } = Route.useRouteContext()
  const matchRoute = useMatchRoute()
  // Bảng giá 25 cột cần cả chiều ngang màn hình; các trang khác giữ khung 1200px
  const fullWidth = Boolean(matchRoute({ to: '/market' }))

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader session={session} />
      <main
        className={cn(
          'mx-auto w-full',
          fullWidth ? 'px-4 py-4' : 'max-w-[1200px] px-6 py-6',
        )}
      >
        <Outlet />
      </main>
    </div>
  )
}
