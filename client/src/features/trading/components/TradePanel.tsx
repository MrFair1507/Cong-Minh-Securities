import type { OrderSide } from '@cms/shared/trading'
import type { Session } from '@supabase/supabase-js'
import { Link, useLocation } from '@tanstack/react-router'
import { ExternalLink, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { BoardStock } from '@/features/market/api/stocks'
import { OrderBook } from '@/features/market/components/OrderBookCard'
import { Button } from '@/shared/ui/button'
import { OrderSteps } from './OrderSteps'
import { StockPicker } from './StockPicker'

type TradePanelProps = {
  stocks: BoardStock[]
  stock: BoardStock
  side: OrderSide
  session: Session | null
  onClose: () => void
  onSymbolChange: (symbol: string) => void
  onSideChange: (side: OrderSide) => void
}

// Panel đặt lệnh cạnh bảng giá: chọn mã, đặt lệnh, xem dư mua – dư bán mà không rời bảng giá
export function TradePanel({
  stocks,
  stock,
  side,
  session,
  onClose,
  onSymbolChange,
  onSideChange,
}: TradePanelProps) {
  const { t } = useTranslation('trading')
  const { t: tm } = useTranslation('market')
  const location = useLocation()
  const [pickerOpen, setPickerOpen] = useState(false)
  // Đặt xong một lệnh thì làm mới form để đặt lệnh tiếp, panel vẫn mở
  const [round, setRound] = useState(0)

  return (
    <aside
      aria-labelledby="trade-panel-title"
      // Esc đóng panel. Ô chọn mã nằm trong Portal (ngoài <aside> trên DOM) nhưng sự kiện React
      // vẫn nổi lên đây, nên bỏ qua phím bấm không xuất phát từ bên trong panel
      onKeyDown={(e) => {
        if (e.key === 'Escape' && e.currentTarget.contains(e.target as Node)) {
          onClose()
        }
      }}
      className="sticky top-20 flex max-h-[calc(100dvh-6rem)] flex-col gap-4 overflow-y-auto rounded-xl border bg-card p-4"
    >
      <div className="flex items-center gap-2">
        <h2 id="trade-panel-title" className="text-base font-semibold">
          {t('panel.title')}
        </h2>
        <StockPicker
          stocks={stocks}
          value={stock.symbol}
          onChange={onSymbolChange}
          open={pickerOpen}
          onOpenChange={setPickerOpen}
        />
        {session && (
          <Button variant="ghost" size="icon" asChild>
            <Link
              to="/stocks/$symbol"
              params={{ symbol: stock.symbol }}
              aria-label={t('panel.detail')}
              title={t('panel.detail')}
            >
              <ExternalLink aria-hidden />
            </Link>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label={t('panel.close')}
          className="ml-auto"
        >
          <X aria-hidden />
        </Button>
      </div>

      {session ? (
        // Đổi mã thì bắt đầu lại từ bước nhập; đổi chiều lệnh giữ nguyên khối lượng đã gõ
        <OrderSteps
          key={`${stock.symbol}-${round}`}
          stock={stock}
          userId={session.user.id}
          initialSide={side}
          side={side}
          surface="panel"
          onCancel={onClose}
          onDone={() => setRound((r) => r + 1)}
          onSideChange={onSideChange}
        />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-6 text-center">
          <p className="font-semibold">{t('panel.loginTitle')}</p>
          <p className="text-sm text-muted-foreground">
            {t('panel.loginDescription')}
          </p>
          <Button asChild>
            <Link to="/login" search={{ redirect: location.href }}>
              {t('panel.login')}
            </Link>
          </Button>
        </div>
      )}

      <section
        aria-labelledby="trade-panel-book"
        className="flex flex-col gap-2"
      >
        <h3 id="trade-panel-book" className="text-sm font-semibold">
          {tm('stock.book.title')}
        </h3>
        <OrderBook stock={stock} />
      </section>
    </aside>
  )
}
