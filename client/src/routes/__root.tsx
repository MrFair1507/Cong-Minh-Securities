import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { supabase } from '@/shared/api/supabase'
import { Toaster } from '@/shared/ui/sonner'
import type { RouterContext } from '@/types/router'

export const Route = createRootRouteWithContext<RouterContext>()({
  // Đọc phiên đăng nhập (từ localStorage, không gọi mạng) và đưa vào context cho mọi route con
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession()
    return { session: data.session }
  },
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster position="top-right" />
    </>
  )
}
