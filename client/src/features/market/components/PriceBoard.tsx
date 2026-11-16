import {
  flexRender,
  type OnChangeFn,
  type SortingState,
  useTable,
} from '@tanstack/react-table'
import { cn } from 'cn'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { BoardStock } from '../api/stocks'
import {
  boardColumns,
  boardFeatures,
  COMPACT_HIDDEN_COLUMNS,
  type OnTrade,
} from './boardColumns'

type PriceBoardProps = {
  data: BoardStock[]
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  onTrade: OnTrade // bấm ô giá: mở panel đặt lệnh
  activeSymbol?: string // mã đang mở trong panel, tô nền dòng đó
  compact?: boolean // panel đang mở: ẩn bớt cột phụ cho vừa chỗ
}

export function PriceBoard({
  data,
  sorting,
  onSortingChange,
  onTrade,
  activeSymbol,
  compact,
}: PriceBoardProps) {
  const { t } = useTranslation('market')
  const columns = useMemo(() => boardColumns(t, onTrade), [t, onTrade])

  const table = useTable({
    features: boardFeatures,
    columns,
    data,
    state: {
      sorting,
      columnVisibility: compact ? COMPACT_HIDDEN_COLUMNS : {},
    },
    onSortingChange,
    getRowId: (row) => row.symbol,
  })

  const headerGroups = table.getHeaderGroups()
  const rows = table.getRowModel().rows

  return (
    <div className="flex flex-col gap-2">
      <table className="w-full border-collapse text-xs leading-4 tabular-nums">
        {/* Nền tối: --muted trùng --border nên header dùng --card để thấy đường kẻ */}
        <thead className="sticky top-16 z-10 bg-muted dark:bg-card">
          {headerGroups.map((group, rowIndex) => (
            <tr key={group.id}>
              {group.headers.map((header) => {
                if (rowIndex > 0 && header.column.depth === 0) return null
                const sorted = header.column.getIsSorted()
                const label = flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )
                return (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    rowSpan={header.isPlaceholder ? headerGroups.length : 1}
                    aria-sort={
                      sorted === 'asc'
                        ? 'ascending'
                        : sorted === 'desc'
                          ? 'descending'
                          : undefined
                    }
                    className="border border-border px-1.5 py-1 text-center font-medium whitespace-nowrap text-foreground/70"
                  >
                    {header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        title={t('sortHint')}
                        className="inline-flex items-center gap-0.5 hover:text-foreground"
                      >
                        {label}
                        {sorted === 'asc' && (
                          <ArrowUp className="size-3" aria-hidden />
                        )}
                        {sorted === 'desc' && (
                          <ArrowDown className="size-3" aria-hidden />
                        )}
                      </button>
                    ) : (
                      label
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              aria-current={row.id === activeSymbol ? true : undefined}
              className="hover:bg-muted/40 aria-current:bg-primary/10"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={cn(
                    'border border-border p-0 whitespace-nowrap',
                    cell.column.columnDef.meta?.className,
                  )}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={table.getVisibleLeafColumns().length}
                className="border border-border py-8 text-center text-sm text-muted-foreground"
              >
                {t('empty')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="text-center text-xs text-muted-foreground">{t('footer')}</p>
    </div>
  )
}
