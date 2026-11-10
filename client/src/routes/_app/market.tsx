import { createFileRoute } from '@tanstack/react-router'
import { MarketPage } from '@/features/market/pages/MarketPage'

export const Route = createFileRoute('/_app/market')({
  component: MarketPage,
})
