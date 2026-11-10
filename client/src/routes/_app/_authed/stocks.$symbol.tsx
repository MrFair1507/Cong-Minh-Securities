import { createFileRoute } from '@tanstack/react-router'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'

export const Route = createFileRoute('/_app/_authed/stocks/$symbol')({
  component: StockPage,
})

function StockPage() {
  const { symbol } = Route.useParams()
  return <PlaceholderPage page="stock" title={symbol} />
}
