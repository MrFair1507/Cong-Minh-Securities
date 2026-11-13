import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AuthBrandPanel } from '@/features/auth/components/AuthBrandPanel'
import { PreferenceMenu } from '@/shared/components/PreferenceMenu'

// Khung trang khách: cột thương hiệu bên trái, form bên phải.
// Việc chặn người đã đăng nhập nằm ở từng route con, vì login cần đọc ?redirect=.
export const Route = createFileRoute('/_guest')({
  component: GuestLayout,
})

function GuestLayout() {
  return (
    <div className="flex min-h-dvh bg-background">
      <AuthBrandPanel />
      <main className="relative grid flex-1 place-items-center p-6">
        <div className="absolute top-6 right-6">
          <PreferenceMenu />
        </div>
        <Outlet />
      </main>
    </div>
  )
}
