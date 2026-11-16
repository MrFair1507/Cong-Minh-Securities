import { createFileRoute } from '@tanstack/react-router'
import { profileQueryOptions } from '@/features/auth/api/profile'
import { ProfilePage } from '@/features/auth/pages/Profiles'

export const Route = createFileRoute('/_app/_authed/profile')({
  loader: ({ context }) =>
    context.queryClient.query({
      ...profileQueryOptions(context.session.user.id),
      staleTime: 'static',
    }),
  component: ProfilePage,
})
