import {
  createColumnHelper,
  createPaginatedRowModel,
  flexRender,
  rowPaginationFeature,
  type TableOptions,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { cn } from 'cn'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'

// Bảng dùng chung cho Lịch sử lệnh, Danh mục, Dòng tiền, Khoản vay.
// Chỉ phân trang phía client (dữ liệu mỗi người dùng ít). Lọc làm ở trang, trước khi đưa data vào.
export const dataTableFeatures = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  // className áp cho cả ô tiêu đề và ô dữ liệu của cột (vd. căn phải cột số)
  columnMeta: {} as { className?: string },
})

export type DataTableFeatures = typeof dataTableFeatures

export function createDataColumnHelper<TData extends object>() {
  return createColumnHelper<DataTableFeatures, TData>()
}

type DataTableProps<TData extends object> = {
  columns: TableOptions<DataTableFeatures, TData>['columns']
  data: TData[]
  getRowId: (row: TData) => string
  empty: ReactNode // nội dung khi không có dòng nào
  pageSize?: number
}

export function DataTable<TData extends object>({
  columns,
  data,
  getRowId,
  empty,
  pageSize = 20,
}: DataTableProps<TData>) {
  const { t } = useTranslation()
  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    getRowId,
    initialState: { pagination: { pageIndex: 0, pageSize } },
  })

  const rows = table.getRowModel().rows
  const total = table.getRowCount()
  const { pageIndex } = table.state.pagination
  const from = total === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min(total, (pageIndex + 1) * pageSize)

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'px-3 text-xs text-muted-foreground',
                      header.column.columnDef.meta?.className,
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      'px-3 py-2.5 tabular-nums',
                      cell.column.columnDef.meta?.className,
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={table.getAllLeafColumns().length}
                  className="py-12 text-center text-sm whitespace-normal text-muted-foreground"
                >
                  {empty}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t('table.showing', { from, to, total })}</span>
          {table.getPageCount() > 1 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft aria-hidden />
                {t('table.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                {t('table.next')}
                <ChevronRight aria-hidden />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
