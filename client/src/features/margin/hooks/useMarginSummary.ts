import {
  DEFAULT_RATES,
  type MarginPosition,
  type MarginRates,
  marginBuyingPower,
  marginRatio,
  marginStatus,
} from '@cms/shared/margin'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { profileQueryOptions } from '@/features/auth/api/profile'
import { stocksQueryOptions } from '@/features/market/api/stocks'
import { holdingsQueryOptions } from '@/features/portfolio/api/holdings'
import {
  marginAccountQueryOptions,
  marginLoansQueryOptions,
} from '../api/margin'
import { isPackageCode, type PackageCode } from '../lib/packages'


export function useMarginSummary(userId: string) {
  const { data: account, isPending: accountPending } = useQuery(
    marginAccountQueryOptions(userId),
  )
  const { data: loans = [] } = useQuery(marginLoansQueryOptions(userId))
  const { data: profile } = useQuery(profileQueryOptions(userId))
  const { data: holdings = [] } = useQuery(holdingsQueryOptions(userId))
  const { data: stocks = [] } = useQuery(stocksQueryOptions())

  return useMemo(() => {
    const prices = new Map(stocks.map((stock) => [stock.id, stock.price]))
    const stockValue = holdings.reduce(
      (sum, holding) =>
        sum + holding.quantity * (prices.get(holding.stock_id) ?? 0),
      0,
    )
    const activeLoans = loans.filter((loan) => loan.status !== 'PAID')
    const debt = activeLoans.reduce((sum, loan) => sum + loan.debt, 0)
    const principal = activeLoans.reduce(
      (sum, loan) => sum + loan.outstanding,
      0,
    )
    const position: MarginPosition = {
      cash: profile?.cash_balance ?? 0,
      stockValue,
      debt,
    }
    const rates: MarginRates = account
      ? {
          initialRate: account.initial_rate,
          callRate: account.call_rate,
          maintenanceRate: account.maintenance_rate,
        }
      : DEFAULT_RATES
    const totalAssets = position.cash + stockValue
    const packageCode: PackageCode = isPackageCode(account?.package_code)
      ? account.package_code
      : 'BASIC'

    return {
      account: account ?? null,
      accountPending,
      loans,
      activeLoans,
      position,
      rates,
      totalAssets,
      debt,
      principal,
      interest: debt - principal,
      netAssets: totalAssets - debt,
      ratio: marginRatio(totalAssets, debt),
      status: marginStatus(totalAssets, debt, rates),
      buyingPower: account
        ? marginBuyingPower(position, rates.initialRate)
        : position.cash,
      packageCode,
    }
  }, [account, accountPending, loans, profile, holdings, stocks])
}

export type MarginSummary = ReturnType<typeof useMarginSummary>
