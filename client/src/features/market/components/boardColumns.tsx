import type { OrderSide } from '@cms/shared/trading'
import { Link } from '@tanstack/react-router'
import {
  columnVisibilityFeature,
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
} from '@tanstack/react-table'
import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import {
  formatBoardVolume,
  formatPrice,
  formatPriceChange,
  formatRatio,
} from '@/shared/lib/format'
import type { BoardStock } from '../api/stocks'
import { averagePrice, toneClass } from '../lib/board'
import { BoardValue } from './BoardValue'

export const boardFeatures = tableFeatures({
  columnVisibilityFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
  columnMeta: {} as { className?: string },
})

// Panel đặt lệnh mở thì bảng còn khoảng 1.000px: ẩn bước giá 3 (panel đã có sổ lệnh), TB, Cao, Thấp, NĐTNN
export const COMPACT_HIDDEN_COLUMNS = Object.fromEntries(
  [
    'bid3',
    'bid3Volume',
    'ask3',
    'ask3Volume',
    'average',
    'high',
    'low',
    'foreign_room',
    'foreignRatio',
  ].map((id) => [id, false]),
)

const column = createColumnHelper<typeof boardFeatures, BoardStock>()

const HIGHLIGHT = { className: 'bg-muted/60' }

// Bấm vào ô giá để mở panel đặt lệnh (giá bán → mua, giá mua → bán, giá khớp → mua)
export type OnTrade = (symbol: string, side: OrderSide) => void

type TradeTarget = { side: OrderSide; onTrade: OnTrade; t: TFunction<'market'> }

function TradeButton({
  stock,
  price,
  target,
  children,
}: {
  stock: BoardStock
  price: number | undefined
  target: TradeTarget
  children: ReactNode
}) {
  if (price === undefined) return children
  const { side, onTrade, t } = target
  return (
    <button
      type="button"
      onClick={() => onTrade(stock.symbol, side)}
      aria-label={t('columns.tradeLabel', {
        side: t(side === 'BUY' ? 'stock.buy' : 'stock.sell'),
        symbol: stock.symbol,
        price: formatPrice(price),
      })}
      className="block w-full cursor-pointer hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      {children}
    </button>
  )
}

const priceText = (price: number | undefined) =>
  price === undefined ? '' : formatPrice(price)
const volumeText = (volume: number | undefined) =>
  volume === undefined ? '' : formatBoardVolume(volume)

function priceColumn(
  id: string,
  header: string,
  getPrice: (s: BoardStock) => number | undefined,
  target?: TradeTarget,
) {
  return column.accessor(getPrice, {
    id,
    header,
    enableSorting: false,
    cell: ({ getValue, row }) => {
      const price = getValue()
      const value = (
        <BoardValue
          value={price}
          text={priceText(price)}
          className={toneClass(price, row.original)}
        />
      )
      return target ? (
        <TradeButton stock={row.original} price={price} target={target}>
          {value}
        </TradeButton>
      ) : (
        value
      )
    },
  })
}

function volumeColumn(
  id: string,
  header: string,
  getVolume: (s: BoardStock) => number | undefined,
  getPrice: (s: BoardStock) => number | undefined,
) {
  return column.accessor(getVolume, {
    id,
    header,
    enableSorting: false,
    cell: ({ getValue, row }) => {
      const volume = getValue()
      return (
        <BoardValue
          value={volume}
          text={volumeText(volume)}
          className={toneClass(getPrice(row.original), row.original)}
        />
      )
    },
  })
}

function limitColumn(
  id: string,
  header: string,
  getPrice: (s: BoardStock) => number,
  className: string,
) {
  return column.accessor(getPrice, {
    id,
    header,
    enableSorting: false,
    cell: ({ getValue }) => (
      <BoardValue
        value={getValue()}
        text={formatPrice(getValue())}
        className={className}
      />
    ),
  })
}

function bookColumns(
  side: 'bid' | 'ask',
  t: TFunction<'market'>,
  levels: readonly (1 | 2 | 3)[],
  onTrade: OnTrade,
) {
  // Bấm giá bên bán là muốn mua, bấm giá bên mua là muốn bán
  const target: TradeTarget = {
    side: side === 'ask' ? 'BUY' : 'SELL',
    onTrade,
    t,
  }
  const prices = (s: BoardStock) =>
    side === 'bid' ? s.bid_prices : s.ask_prices
  const volumes = (s: BoardStock) =>
    side === 'bid' ? s.bid_volumes : s.ask_volumes
  const list = levels.flatMap((n) => {
    const getPrice = (s: BoardStock) => prices(s)[n - 1]
    return [
      priceColumn(`${side}${n}`, t(`columns.price${n}`), getPrice, target),
      volumeColumn(
        `${side}${n}Volume`,
        t(`columns.volume${n}`),
        (s) => volumes(s)[n - 1],
        getPrice,
      ),
    ]
  })
  return column.columns(list)
}

export function boardColumns(t: TFunction<'market'>, onTrade: OnTrade) {
  return column.columns([
    limitColumn('ref', t('columns.ref'), (s) => s.ref_price, 'text-price-ref'),
    limitColumn(
      'ceiling',
      t('columns.ceiling'),
      (s) => s.ceiling_price,
      'text-price-ceil',
    ),
    limitColumn(
      'floor',
      t('columns.floor'),
      (s) => s.floor_price,
      'text-price-floor',
    ),
    column.group({
      id: 'bid',
      header: t('groups.bid'),
      columns: bookColumns('bid', t, [3, 2, 1], onTrade),
    }),
    column.accessor('symbol', {
      header: t('columns.symbol'),
      sortFn: 'alphanumeric',
      meta: HIGHLIGHT,
      cell: ({ row }) => (
        <Link
          to="/stocks/$symbol"
          params={{ symbol: row.original.symbol }}
          title={row.original.name}
          className={`block px-1.5 py-1 text-left font-semibold hover:underline ${toneClass(row.original.price, row.original)}`}
        >
          {row.original.symbol}
        </Link>
      ),
    }),
    column.group({
      id: 'match',
      header: t('groups.match'),
      columns: column.columns([
        column.accessor('price', {
          header: t('columns.price'),
          sortFn: 'basic',
          sortDescFirst: true,
          meta: HIGHLIGHT,
          cell: ({ getValue, row }) => (
            <TradeButton
              stock={row.original}
              price={getValue()}
              target={{ side: 'BUY', onTrade, t }}
            >
              <BoardValue
                value={getValue()}
                text={formatPrice(getValue())}
                className={`font-semibold ${toneClass(getValue(), row.original)}`}
              />
            </TradeButton>
          ),
        }),
        column.accessor('last_volume', {
          header: t('columns.volume'),
          enableSorting: false,
          meta: HIGHLIGHT,
          cell: ({ getValue, row }) => (
            <BoardValue
              value={getValue()}
              text={formatBoardVolume(getValue())}
              className={toneClass(row.original.price, row.original)}
            />
          ),
        }),
        column.accessor((s) => s.price - s.ref_price, {
          id: 'change',
          header: t('columns.change'),
          sortFn: 'basic',
          sortDescFirst: true,
          meta: HIGHLIGHT,
          cell: ({ getValue, row }) => (
            <BoardValue
              value={getValue()}
              text={formatPriceChange(getValue())}
              className={toneClass(row.original.price, row.original)}
            />
          ),
        }),
      ]),
    }),
    column.accessor('volume', {
      header: t('columns.totalVolume'),
      sortFn: 'basic',
      sortDescFirst: true,
      cell: ({ getValue }) => (
        <BoardValue value={getValue()} text={formatBoardVolume(getValue())} />
      ),
    }),
    column.group({
      id: 'ask',
      header: t('groups.ask'),
      columns: bookColumns('ask', t, [1, 2, 3], onTrade),
    }),
    priceColumn('average', t('columns.average'), averagePrice),
    priceColumn('high', t('columns.high'), (s) => s.high_price ?? undefined),
    priceColumn('low', t('columns.low'), (s) => s.low_price ?? undefined),
    column.group({
      id: 'foreign',
      header: t('groups.foreign'),
      columns: column.columns([
        column.accessor('foreign_room', {
          header: t('columns.room'),
          enableSorting: false,
          cell: ({ getValue }) => (
            <BoardValue
              value={getValue()}
              text={formatBoardVolume(getValue())}
            />
          ),
        }),
        column.accessor(
          (s) =>
            s.foreign_limit > 0 ? s.foreign_room / s.foreign_limit : undefined,
          {
            id: 'foreignRatio',
            header: t('columns.foreignRatio'),
            enableSorting: false,
            cell: ({ getValue }) => {
              const ratio = getValue()
              return (
                <BoardValue
                  value={ratio}
                  text={ratio === undefined ? '' : formatRatio(ratio)}
                />
              )
            },
          },
        ),
      ]),
    }),
  ])
}
