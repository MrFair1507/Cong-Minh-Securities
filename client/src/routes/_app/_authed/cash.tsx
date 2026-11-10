import { createFileRoute } from '@tanstack/react-router'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'

export const Route = createFileRoute('/_app/_authed/cash')({
  component: () => <PlaceholderPage page="cash" />,
})
