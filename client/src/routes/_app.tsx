import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppHeader } from '@/shared/components/AppHeader'

// Khung app: header + nội dung. Không chặn, khách vẫn xem được bảng giá.
export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  const { session } = Route.useRouteContext()
  return (
    <div className="min-h-dvh bg-background">
      <AppHeader session={session} />
      <main className="mx-auto w-full max-w-[1200px] px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}
