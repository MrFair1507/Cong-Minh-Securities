import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/market')({
  component: MarketPage,
})

function MarketPage() {
  return <h1 className="p-6 text-2xl font-semibold">Bảng giá</h1>
}
