import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

// Chỉ dành cho khách: đã đăng nhập thì về bảng giá
export const Route = createFileRoute('/_guest')({
  beforeLoad: ({ context }) => {
    if (context.session) throw redirect({ to: '/market' })
  },
  component: GuestLayout,
})

function GuestLayout() {
  return (
    <div className="grid min-h-dvh place-items-center bg-muted/40 px-6">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}
