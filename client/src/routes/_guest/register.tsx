import { createFileRoute } from '@tanstack/react-router'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'

export const Route = createFileRoute('/_guest/register')({
  component: () => <PlaceholderPage page="register" />,
})
