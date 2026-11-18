import { useQuery } from '@tanstack/react-query'
import { useNavigate, useRouteContext, useSearch } from '@tanstack/react-router'
import { Info } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { profileQueryOptions } from '@/features/auth/api/profile'
import { stocksQueryOptions } from '@/features/market/api/stocks'
import { useStocksRealtime } from '@/features/market/hooks/useStocksRealtime'
import { PageHeader } from '@/shared/components/PageHeader'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import {
  type MarginLoan,
  marginCallsQueryOptions,
  marginEventsQueryOptions,
  marginPackagesQueryOptions,
} from '../api/margin'
import { MarginActivationCard } from '../components/activation/MarginActivationCard'
import { OpenMarginDialog } from '../components/activation/OpenMarginDialog'
import { HistoryTab } from '../components/history/HistoryTab'
import { IllustrationTab } from '../components/illustration/IllustrationTab'
import { RenewDialog } from '../components/loans/RenewDialog'
import { RepayDialog } from '../components/loans/RepayDialog'
import { OverviewTab } from '../components/overview/OverviewTab'
import { PackageTiles } from '../components/packages/PackageTiles'
import { MarginStocksTab } from '../components/stocks/MarginStocksTab'
import { useMarginSummary } from '../hooks/useMarginSummary'
import { MARGIN_TABS, type MarginTab } from '../lib/tabs'

const ROUTE_ID = '/_app/_authed/margin'

export function MarginPage() {
  const { t } = useTranslation('margin')
  const { t: tc } = useTranslation()
  const { session } = useRouteContext({ from: ROUTE_ID })
  const userId = session.user.id
  const search = useSearch({ from: ROUTE_ID })
  const navigate = useNavigate({ from: '/margin' })
  useStocksRealtime()

  const summary = useMarginSummary(userId)
  const { data: stocks = [] } = useQuery(stocksQueryOptions())
  const { data: packages = [] } = useQuery(marginPackagesQueryOptions())
  const { data: calls = [] } = useQuery(marginCallsQueryOptions(userId))
  const { data: events = [] } = useQuery(marginEventsQueryOptions(userId))
  const { data: profile } = useQuery(profileQueryOptions(userId))

  const tab = search.tab ?? 'overview'
  const [openDialog, setOpenDialog] = useState(false)
  const [repayLoanId, setRepayLoanId] = useState<number>()
  const [renewLoan, setRenewLoan] = useState<MarginLoan | null>(null)

  const setTab = (next: MarginTab) =>
    navigate({
      search: (prev) => ({
        ...prev,
        tab: next === 'overview' ? undefined : next,
      }),
      resetScroll: false,
    })

  const repayOpen =
    summary.activeLoans.length > 0 &&
    (repayLoanId !== undefined || search.repay === true)
  const closeRepay = () => {
    setRepayLoanId(undefined)
    if (search.repay)
      navigate({
        search: (prev) => ({ ...prev, repay: undefined }),
        resetScroll: false,
      })
  }

  const onRepay = useCallback((loan: MarginLoan) => setRepayLoanId(loan.id), [])
  const onRenew = useCallback((loan: MarginLoan) => setRenewLoan(loan), [])
  const hasAccount = summary.account !== null

  const renderOverview = () => (
    <>
      {hasAccount ? (
        <OverviewTab
          summary={summary}
          onRepay={onRepay}
          onRepayAny={() => setRepayLoanId(summary.activeLoans.at(-1)?.id)}
          onRenew={onRenew}
        />
      ) : (
        <MarginActivationCard
          kycVerified={Boolean(profile?.kyc_verified_at)}
          onOpen={() => setOpenDialog(true)}
          onTryIllustration={() => setTab('illustration')}
        />
      )}
      <PackageTiles
        packages={packages}
        stocks={stocks}
        activeCode={summary.packageCode}
        hasAccount={hasAccount}
      />
      <p className="flex gap-2 text-xs leading-5 text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {t('footnote')}
      </p>
    </>
  )

  const renderTabContent = () => {
    switch (tab) {
      case 'overview':
        return renderOverview()
      case 'stocks':
        return <MarginStocksTab stocks={stocks} packages={packages} />
      case 'illustration':
        return <IllustrationTab stocks={stocks} packages={packages} />
      case 'history':
        return <HistoryTab calls={calls} events={events} />
      default:
        return null
    }
  }

  const termDays =
    packages.find((pkg) => pkg.code === renewLoan?.package_code)?.termDays ?? 90

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <PageHeader
          title={tc('pages.margin.title')}
          description={tc('pages.margin.description')}
        />
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as MarginTab)}
          className="border-b"
        >
          <TabsList variant="line" className="h-10">
            {MARGIN_TABS.map((item) => (
              <TabsTrigger key={item} value={item}>
                {t(`tabs.${item}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {renderTabContent()}

      <OpenMarginDialog open={openDialog} onOpenChange={setOpenDialog} />
      <RepayDialog
        open={repayOpen}
        onOpenChange={(open) => !open && closeRepay()}
        summary={summary}
        loanId={repayLoanId}
      />
      <RenewDialog
        loan={renewLoan}
        termDays={termDays}
        summary={summary}
        onClose={() => setRenewLoan(null)}
      />
    </div>
  )
}
