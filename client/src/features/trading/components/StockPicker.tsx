import { cn } from 'cn'
import { ChevronsUpDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { BoardStock } from '@/features/market/api/stocks'
import { toneClass } from '@/features/market/lib/board'
import { formatPrice } from '@/shared/lib/format'
import { foldText } from '@/shared/lib/text'
import { Button } from '@/shared/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'

type StockPickerProps = {
  stocks: BoardStock[]
  value: string // mã đang chọn
  onChange: (symbol: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Ô chọn mã trong panel đặt lệnh: gõ mã hoặc tên công ty để lọc
export function StockPicker({
  stocks,
  value,
  onChange,
  open,
  onOpenChange,
}: StockPickerProps) {
  const { t } = useTranslation('trading')

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={t('panel.pickStock')}
          className="gap-1 font-semibold"
        >
          {value}
          <ChevronsUpDown className="text-muted-foreground" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" collisionPadding={16} className="w-72 p-0">
        {/* Gõ không dấu vẫn tìm được tên có dấu: "sua" khớp "Sữa" */}
        <Command
          filter={(value, search) =>
            foldText(value).includes(foldText(search.trim())) ? 1 : 0
          }
        >
          <CommandInput placeholder={t('panel.searchStock')} />
          <CommandList>
            <CommandEmpty>{t('panel.noStock')}</CommandEmpty>
            <CommandGroup>
              {stocks.map((stock) => (
                <CommandItem
                  key={stock.symbol}
                  value={`${stock.symbol} ${stock.name}`}
                  data-checked={stock.symbol === value}
                  onSelect={() => {
                    onChange(stock.symbol)
                    onOpenChange(false)
                  }}
                >
                  <span
                    className={cn(
                      'w-10 font-semibold',
                      toneClass(stock.price, stock),
                    )}
                  >
                    {stock.symbol}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                    {stock.name}
                  </span>
                  <span
                    className={cn(
                      'text-xs tabular-nums',
                      toneClass(stock.price, stock),
                    )}
                  >
                    {formatPrice(stock.price)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
