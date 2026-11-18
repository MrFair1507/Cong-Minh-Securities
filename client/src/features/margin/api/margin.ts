import type { QueryData } from '@supabase/supabase-js'
import { queryOptions } from '@tanstack/react-query'
import type { Tables } from '@/shared/api/database.types'
import { supabase } from '@/shared/api/supabase'
import { isPackageCode, type MarginPackage } from '../lib/packages'

const accountQuery = (userId: string) =>
  supabase
    .from('margin_accounts')
    .select(
      'id, initial_rate, call_rate, maintenance_rate, package_code, auto_repay, auto_renew, created_at',
    )
    .eq('user_id', userId)
    .maybeSingle()

export type MarginAccount = NonNullable<
  QueryData<ReturnType<typeof accountQuery>>
>

export const marginAccountQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['margin', userId, 'account'],
    queryFn: async () => {
      const { data, error } = await accountQuery(userId)
      if (error) throw error
      return data
    },
  })

type LoanView = Tables<'margin_loan_balances'>
export type MarginLoan = {
  [K in Exclude<keyof LoanView, 'interest_rate'>]: NonNullable<LoanView[K]>
} & { interest_rate: number | null; status: 'ACTIVE' | 'OVERDUE' | 'PAID' }

export const marginLoansQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['margin', userId, 'loans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('margin_loan_balances')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: false })
      if (error) throw error
      return data as MarginLoan[]
    },
  })

const callsQuery = (userId: string) =>
  supabase
    .from('margin_calls')
    .select('id, ratio_at_call, status, created_at, resolved_at')
    .eq('user_id', userId)
    .order('id', { ascending: false })

export type MarginCall = QueryData<ReturnType<typeof callsQuery>>[number]

export const marginCallsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['margin', userId, 'calls'],
    queryFn: async () => {
      const { data, error } = await callsQuery(userId)
      if (error) throw error
      return data
    },
  })

const eventsQuery = (userId: string) =>
  supabase
    .from('margin_service_events')
    .select(
      'id, type, package_code, margin_loan_id, auto_repay, auto_renew, due_date, created_at',
    )
    .eq('user_id', userId)
    .order('id', { ascending: false })

export type MarginEvent = QueryData<ReturnType<typeof eventsQuery>>[number]

export const marginEventsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['margin', userId, 'events'],
    queryFn: async () => {
      const { data, error } = await eventsQuery(userId)
      if (error) throw error
      return data
    },
  })

export const marginPackagesQueryOptions = () =>
  queryOptions({
    queryKey: ['margin-packages'],
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async (): Promise<MarginPackage[]> => {
      const [packages, tiers, stocks] = await Promise.all([
        supabase
          .from('margin_packages')
          .select('code, interest_rate, term_days, exclusive, sort_order')
          .order('sort_order'),
        supabase
          .from('margin_package_tiers')
          .select('package_code, from_day, to_day, annual_rate')
          .order('from_day'),
        supabase.from('margin_package_stocks').select('package_code, stock_id'),
      ])
      if (packages.error) throw packages.error
      if (tiers.error) throw tiers.error
      if (stocks.error) throw stocks.error

      return packages.data.flatMap((pkg) => {
        if (!isPackageCode(pkg.code)) return []
        const basket = stocks.data
          .filter((row) => row.package_code === pkg.code)
          .map((row) => row.stock_id)
        return [
          {
            code: pkg.code,
            rate: pkg.interest_rate,
            termDays: pkg.term_days,
            exclusive: pkg.exclusive,
            plan: {
              rate: pkg.interest_rate,
              tiers: tiers.data
                .filter((tier) => tier.package_code === pkg.code)
                .map((tier) => ({
                  fromDay: tier.from_day,
                  toDay: tier.to_day,
                  annualRate: tier.annual_rate,
                })),
            },
            stockIds: basket.length > 0 ? basket : null,
          },
        ]
      })
    },
  })
