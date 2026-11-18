// Script giả lập giá. Chạy: yarn workspace server start [--trend=down|up] [--session=<giây>]
//   --trend=down|up : giá đi một chiều (mọi mã, mỗi nhịp), dùng khi demo cảnh báo ký quỹ
//   --session=30    : cứ 30 giây mở "phiên mới" (tham chiếu = giá hiện tại, tính lại trần/sàn),
//                     để giá giảm quá biên độ một phiên trong lúc demo
import { parseArgs } from 'node:util'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../client/src/shared/api/database.types'
import { checkMarginCalls } from './margin-watch'
import {
  buildOrderBook,
  nextForeignRoom,
  nextPrice,
  type OrderBook,
  pickRandom,
  priceLimits,
  randomChange,
  randomVolume,
  type TradeSide,
  type Trend,
  tradeSide,
} from './price'

const TICK_MS = 3000
const STOCKS_PER_TICK = 5 // mỗi nhịp chỉ đổi vài mã, giảm số tin nhắn Realtime

type SimStock = {
  id: number
  symbol: string
  band: number
  refPrice: number
  ceiling: number
  floor: number
  price: number
  volume: number // tổng KL trong phiên
  lastVolume: number // KL khớp gần nhất
  high: number
  low: number
  totalValue: number // tổng giá trị khớp, để tính giá TB
  book: OrderBook
  foreignRoom: number
  lastSide: TradeSide // bên chủ động của lần khớp trước
}

type TradeRow = {
  stock_id: number
  price: number
  volume: number
  side: TradeSide
}

type Candle = {
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// ---------- Tham số dòng lệnh và biến môi trường ----------
const { values: args } = parseArgs({
  options: {
    trend: { type: 'string', default: 'none' },
    session: { type: 'string' },
  },
})
if (!['none', 'up', 'down'].includes(args.trend)) {
  throw new Error('--trend chỉ nhận none, up hoặc down')
}
const trend = args.trend as Trend
const sessionMs = args.session ? Number(args.session) * 1000 : 0
if (Number.isNaN(sessionMs) || sessionMs < 0) {
  throw new Error('--session phải là số giây')
}

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  throw new Error(
    'Thiếu SUPABASE_URL hoặc SUPABASE_SECRET_KEY trong server/.env',
  )
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ---------- Trạng thái trong bộ nhớ ----------
let stocks: SimStock[] = []
const candles = new Map<number, Candle>()
let tradeDate = ''
let sessionStartedAt = 0
let timer: NodeJS.Timeout | undefined

// Ngày theo giờ Việt Nam, dạng YYYY-MM-DD
function vnDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date())
}

function formatPrice(value: number): string {
  return value.toLocaleString('vi-VN')
}

async function loadStocks(): Promise<SimStock[]> {
  const { data, error } = await supabase
    .from('stocks')
    .select(
      'id, symbol, ref_price, ceiling_price, floor_price, price, volume, last_volume, high_price, low_price, total_value, bid_prices, bid_volumes, ask_prices, ask_volumes, foreign_room, exchanges(price_band)',
    )
    .order('id')
  if (error) throw error
  return data.map((s) => ({
    id: s.id,
    symbol: s.symbol,
    band: s.exchanges.price_band,
    refPrice: s.ref_price,
    ceiling: s.ceiling_price,
    floor: s.floor_price,
    price: s.price,
    volume: s.volume,
    lastVolume: s.last_volume,
    high: s.high_price ?? s.price,
    low: s.low_price ?? s.price,
    totalValue: s.total_value,
    book: {
      bidPrices: s.bid_prices,
      bidVolumes: s.bid_volumes,
      askPrices: s.ask_prices,
      askVolumes: s.ask_volumes,
    },
    foreignRoom: s.foreign_room,
    lastSide: 'BUY',
  }))
}

async function saveTrades(rows: TradeRow[]): Promise<void> {
  if (rows.length === 0) return
  const { error } = await supabase.from('trades').insert(rows)
  if (error) throw error
}

// Sang ngày mới: xóa khớp lệnh của các ngày trước để bảng không phình
async function clearOldTrades(date: string): Promise<void> {
  const { error } = await supabase
    .from('trades')
    .delete()
    .lt('created_at', `${date}T00:00:00+07:00`)
  if (error) throw error
}

// Đọc nến của ngày đang giao dịch (khi script khởi động lại giữa ngày)
async function loadCandles(date: string): Promise<void> {
  const { data, error } = await supabase
    .from('price_history')
    .select('stock_id, open, high, low, close, volume')
    .eq('trade_date', date)
  if (error) throw error
  for (const c of data) {
    candles.set(c.stock_id, {
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    })
  }
}

async function saveStocks(list: SimStock[]): Promise<void> {
  const results = await Promise.all(
    list.map((s) =>
      supabase
        .from('stocks')
        .update({
          ref_price: s.refPrice,
          ceiling_price: s.ceiling,
          floor_price: s.floor,
          price: s.price,
          volume: s.volume,
          last_volume: s.lastVolume,
          high_price: s.high,
          low_price: s.low,
          total_value: s.totalValue,
          bid_prices: s.book.bidPrices,
          bid_volumes: s.book.bidVolumes,
          ask_prices: s.book.askPrices,
          ask_volumes: s.book.askVolumes,
          foreign_room: s.foreignRoom,
        })
        .eq('id', s.id),
    ),
  )
  for (const r of results) if (r.error) throw r.error
}

async function saveCandles(list: SimStock[]): Promise<void> {
  const rows = list.map((s) => {
    const c = candles.get(s.id)
    if (!c) throw new Error(`Thiếu nến của ${s.symbol}`)
    return { stock_id: s.id, trade_date: tradeDate, ...c }
  })
  const { error } = await supabase
    .from('price_history')
    .upsert(rows, { onConflict: 'stock_id,trade_date' })
  if (error) throw error
}

// Mở phiên mới: tham chiếu = giá hiện tại (giá đóng cửa phiên trước), tính lại trần/sàn.
// newDay = true: sang ngày mới, tạo nến mới. false: phiên nhanh khi demo, giữ nến hôm nay.
async function startSession(date: string, newDay: boolean): Promise<void> {
  tradeDate = date
  sessionStartedAt = Date.now()
  for (const s of stocks) {
    const limits = priceLimits(s.price, s.band)
    s.refPrice = s.price
    s.ceiling = limits.ceiling
    s.floor = limits.floor
    s.volume = 0
    s.lastVolume = 0
    s.high = s.price
    s.low = s.price
    s.totalValue = 0
    s.book = buildOrderBook(s.price, s) // dựng sổ lệnh cho mọi mã để bảng giá không trống
    if (newDay) {
      candles.set(s.id, {
        open: s.price,
        high: s.price,
        low: s.price,
        close: s.price,
        volume: 0,
      })
    }
  }
  await saveStocks(stocks)
  if (newDay) {
    await saveCandles(stocks)
    await clearOldTrades(date)
  }
  console.log(`== Phiên mới ${date}${newDay ? '' : ' (phiên nhanh)'} ==`)
  await endSessionMargin()
}

// Cuối phiên trước: tự thu nợ ký quỹ từ tiền mặt và tự gia hạn khoản vay tới hạn
// (RPC end_session_margin, chỉ secret key gọi được). Chạy cả ở phiên nhanh để demo thấy được.
async function endSessionMargin(): Promise<void> {
  const { data, error } = await supabase.rpc('end_session_margin')
  if (error) {
    console.error('  ! Thu nợ cuối phiên lỗi:', error.message)
    return
  }
  const result = data?.[0]
  if (result && (result.repaid_loans > 0 || result.renewed_loans > 0)) {
    console.log(
      `  $ Ký quỹ: thu nợ ${result.repaid_loans} khoản, gia hạn ${result.renewed_loans} khoản`,
    )
  }
}

async function tick(): Promise<void> {
  const today = vnDate()
  if (today !== tradeDate) {
    await startSession(today, true)
  } else if (sessionMs > 0 && Date.now() - sessionStartedAt >= sessionMs) {
    await startSession(today, false)
  }

  const picked = trend === 'none' ? pickRandom(stocks, STOCKS_PER_TICK) : stocks
  const trades: TradeRow[] = []
  for (const s of picked) {
    const previousPrice = s.price
    const change = randomChange(trend, s.price, s.refPrice)
    s.price = nextPrice(s.price, change, s)
    const volume = randomVolume()
    s.lastSide = tradeSide(previousPrice, s.price, s.lastSide)
    trades.push({
      stock_id: s.id,
      price: s.price,
      volume,
      side: s.lastSide,
    })
    s.volume += volume
    s.lastVolume = volume
    s.totalValue += s.price * volume
    s.high = Math.max(s.high, s.price)
    s.low = Math.min(s.low, s.price)
    s.book = buildOrderBook(s.price, s)
    s.foreignRoom = nextForeignRoom(s.foreignRoom)

    const c = candles.get(s.id)
    if (c) {
      c.high = Math.max(c.high, s.price)
      c.low = Math.min(c.low, s.price)
      c.close = s.price
      c.volume += volume
    }
  }
  await saveStocks(picked)
  await saveCandles(picked)
  await saveTrades(trades)

  const time = new Date().toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  const summary = picked
    .slice(0, STOCKS_PER_TICK)
    .map((s) => `${s.symbol} ${formatPrice(s.price)}`)
    .join('  ')
  console.log(
    `${time}  ${summary}${picked.length > STOCKS_PER_TICK ? '  ...' : ''}`,
  )

  await checkMarginCalls(supabase, new Map(stocks.map((s) => [s.id, s.price])))
}

// Chạy nhịp kế tiếp sau khi nhịp trước xong, không bị chồng lên nhau
async function loop(): Promise<void> {
  try {
    await tick()
  } catch (err) {
    console.error('Lỗi trong nhịp giả lập:', err)
  }
  timer = setTimeout(loop, TICK_MS)
}

async function main(): Promise<void> {
  stocks = await loadStocks()
  const today = vnDate()
  await loadCandles(today)
  if (candles.size === stocks.length) {
    // Khởi động lại giữa ngày: tiếp tục phiên hiện tại
    tradeDate = today
    sessionStartedAt = Date.now()
  }
  console.log(
    `Giả lập ${stocks.length} mã, mỗi ${TICK_MS / 1000} giây, xu hướng: ${trend}` +
      (sessionMs > 0 ? `, phiên nhanh ${sessionMs / 1000} giây` : ''),
  )
  await loop()
}

process.on('SIGINT', () => {
  clearTimeout(timer)
  console.log('\nĐã dừng giả lập.')
  process.exit(0)
})

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
