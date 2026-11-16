import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate, useRouteContext, useSearch } from '@tanstack/react-router'
import { cn } from 'cn'
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { profileQueryOptions } from '@/features/auth/api/profile'
import { DataTable } from '@/shared/components/DataTable'
import { PageHeader } from '@/shared/components/PageHeader'
import { formatMoney } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { banksQueryOptions } from '../api/banks'
import { cashQueryOptions } from '../api/cash'
import { BankAccounts } from '../components/BankAccounts'
import { cashColumns } from '../components/cashColumns'
import { DepositDialog } from '../components/DepositDialog'
import { LinkBankDialog } from '../components/LinkBankDialog'
import { WithdrawDialog } from '../components/WithdrawDialog'
import { CASH_TYPES, type CashTxType, flowTotals } from '../lib/cash'

const ROUTE_ID = '/_app/_authed/cash'
const ALL = 'ALL'

// Lịch sử dòng tiền (frame 07) + ngân hàng liên kết mô phỏng, nộp/rút tiền
export function CashPage() {
  const { t } = useTranslation('cash')
  const { t: tc } = useTranslation()
  const { session } = useRouteContext({ from: ROUTE_ID })
  const userId = session.user.id
  const search = useSearch({ from: ROUTE_ID })
  const navigate = useNavigate({ from: '/cash' })
  const { data: rows } = useSuspenseQuery(cashQueryOptions(userId))
  const { data: profile } = useQuery(profileQueryOptions(userId))
  const { data: banks } = useQuery(banksQueryOptions())
  const [dialog, setDialog] = useState<'deposit' | 'withdraw' | 'link'>()
  const closeDialog = (open: boolean) => !open && setDialog(undefined)
  const openLink = () => setDialog('link')

  const filtered = useMemo(
    () => (search.type ? rows.filter((row) => row.type === search.type) : rows),
    [rows, search.type],
  )
  const columns = useMemo(() => cashColumns(t, banks), [t, banks])
  const totals = flowTotals(rows, 7)

  const stats = [
    {
      key: 'balance',
      label: t('stats.balance'),
      value: formatMoney(profile?.cash_balance ?? 0),
    },
    {
      key: 'inflow',
      label: t('stats.inflow'),
      value: `+${formatMoney(totals.inflow)}`,
      hint: t('stats.inflowHint'),
      className: 'text-price-up',
    },
    {
      key: 'outflow',
      label: t('stats.outflow'),
      value: `−${formatMoney(Math.abs(totals.outflow))}`,
      hint: t('stats.outflowHint'),
      className: 'text-price-down',
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={tc('pages.cash.title')}
        description={tc('pages.cash.description')}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDialog('withdraw')}>
              <ArrowUpFromLine aria-hidden />
              {t('actions.withdraw')}
            </Button>
            <Button onClick={() => setDialog('deposit')}>
              <ArrowDownToLine aria-hidden />
              {t('actions.deposit')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.key} className="py-5">
            <CardContent className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">
                {stat.label}
              </span>
              <span
                className={cn(
                  'text-xl font-semibold tabular-nums',
                  stat.className,
                )}
              >
                {stat.value}
              </span>
              {stat.hint && (
                <span className="text-xs text-muted-foreground">
                  {stat.hint}
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <BankAccounts userId={userId} onLink={openLink} />

      <Tabs
        value={search.type ?? ALL}
        onValueChange={(value) =>
          navigate({
            search: { type: value === ALL ? undefined : (value as CashTxType) },
            replace: true,
          })
        }
      >
        <TabsList aria-label={t('typeLabel')}>
          <TabsTrigger value={ALL}>{t('types.ALL')}</TabsTrigger>
          {CASH_TYPES.map((type) => (
            <TabsTrigger key={type} value={type}>
              {t(`types.${type}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={filtered}
        getRowId={(row) => String(row.id)}
        empty={rows.length === 0 ? t('empty') : t('emptyFiltered')}
      />

      {dialog === 'deposit' && (
        <DepositDialog
          userId={userId}
          open
          onOpenChange={closeDialog}
          onLink={openLink}
        />
      )}
      {dialog === 'link' && (
        <LinkBankDialog userId={userId} open onOpenChange={closeDialog} />
      )}
      {dialog === 'withdraw' && (
        <WithdrawDialog
          userId={userId}
          open
          onOpenChange={closeDialog}
          onLink={openLink}
        />
      )}
    </div>
  )
}
