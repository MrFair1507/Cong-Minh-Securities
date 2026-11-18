import { useSuspenseQuery } from '@tanstack/react-query'
import {
  Link,
  useNavigate,
  useRouteContext,
  useSearch,
} from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { DataTable } from '@/shared/components/DataTable'
import { PageHeader } from '@/shared/components/PageHeader'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { ordersQueryOptions } from '../api/orders'
import { ordersColumns } from '../components/ordersColumns'
import { filterOrders } from '../lib/order'
import { ORDER_SIDES, type OrdersSearch } from '../schemas'

const ROUTE_ID = '/_app/_authed/orders'
const ALL = 'ALL'

export function OrdersPage() {
  const { t } = useTranslation('trading')
  const { t: tc } = useTranslation()
  const { session } = useRouteContext({ from: ROUTE_ID })
  const search = useSearch({ from: ROUTE_ID })
  const navigate = useNavigate({ from: '/orders' })
  const { data: orders } = useSuspenseQuery(ordersQueryOptions(session.user.id))

  const rows = useMemo(
    () => filterOrders(orders, search.side, search.symbol),
    [orders, search.side, search.symbol],
  )
  const columns = useMemo(() => ordersColumns(t), [t])

  // Bộ lọc nằm trên URL: /orders?side=BUY&symbol=FPT
  function updateSearch(patch: Partial<OrdersSearch>) {
    // resetScroll: false - chỉ đổi bộ lọc, giữ vị trí cuộn (mặc định router cuộn về đầu trang)
    navigate({
      search: (prev) => ({ ...prev, ...patch }),
      replace: true,
      resetScroll: false,
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={tc('pages.orders.title')}
        description={tc('pages.orders.description')}
      />

      <div className="flex items-center gap-3">
        <Tabs
          value={search.side ?? ALL}
          onValueChange={(value) =>
            updateSearch({
              side: value === ALL ? undefined : (value as OrdersSearch['side']),
            })
          }
        >
          <TabsList aria-label={t('orders.sideLabel')}>
            <TabsTrigger value={ALL}>{t('orders.all')}</TabsTrigger>
            {ORDER_SIDES.map((side) => (
              <TabsTrigger key={side} value={side}>
                {t(`side.${side}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search.symbol ?? ''}
            onChange={(e) =>
              updateSearch({ symbol: e.target.value || undefined })
            }
            placeholder={t('orders.search')}
            aria-label={t('orders.searchLabel')}
            autoComplete="off"
            maxLength={20}
            className="h-8 w-48 pl-8 uppercase placeholder:normal-case"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(order) => String(order.id)}
        empty={
          orders.length === 0 ? (
            <div className="flex flex-col items-center gap-3">
              <p>{t('orders.empty')}</p>
              <Button asChild variant="outline" size="sm">
                <Link to="/market">{t('orders.toMarket')}</Link>
              </Button>
            </div>
          ) : (
            t('orders.emptyFiltered')
          )
        }
      />
    </div>
  )
}
