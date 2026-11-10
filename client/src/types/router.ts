import type { QueryClient } from '@tanstack/react-query'

// Context truyền vào createRouter. session được __root thêm vào ở beforeLoad.
export type RouterContext = {
  queryClient: QueryClient
}
