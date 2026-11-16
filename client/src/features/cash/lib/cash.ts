// Hàm thuần cho trang Dòng tiền và ngân hàng mô phỏng (test được bằng Vitest ở tuần 3).
import type { Enums } from '@/shared/api/database.types'

export type CashTxType = Enums<'cash_tx_type'>

// Thứ tự tab lọc trên trang
export const CASH_TYPES = [
  'BUY',
  'SELL',
  'DEPOSIT',
  'WITHDRAW',
  'LOAN',
  'REPAY',
  'INIT',
] as const satisfies readonly CashTxType[]

export const MAX_BANK_LINKS = 2 // khớp giới hạn trong RPC link_bank
export const MIN_TRANSFER = 10_000 // khớp check_transfer_amount
export const QUICK_DEPOSITS = [1_000_000, 5_000_000, 10_000_000, 50_000_000]

const DAY_MS = 24 * 60 * 60 * 1000

// Tổng tiền vào / tiền ra trong `days` ngày gần nhất (tiền ra trả về số âm).
// Bỏ qua vốn ban đầu (INIT) để số "tiền vào" phản ánh giao dịch thật của người dùng.
export function flowTotals(
  rows: { type: CashTxType; amount: number; created_at: string }[],
  days: number,
  now: number = Date.now(),
): { inflow: number; outflow: number } {
  const since = now - days * DAY_MS
  let inflow = 0
  let outflow = 0
  for (const row of rows) {
    if (row.type === 'INIT') continue
    if (new Date(row.created_at).getTime() < since) continue
    if (row.amount > 0) inflow += row.amount
    else outflow += row.amount
  }
  return { inflow, outflow }
}

// Che số tài khoản, chỉ để 4 số cuối: 1234567890 -> "••••7890"
export function maskAccount(accountNo: string): string {
  return `••••${accountNo.slice(-4)}`
}

// Ô số tiền cho gõ "5.000.000": bỏ mọi ký tự không phải số
export function parseMoney(text: string): number {
  const digits = text.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

// Hiện lại số tiền đang gõ với dấu chấm ngăn nghìn: "5000000" -> "5.000.000"
export function formatMoneyInput(text: string): string {
  const value = parseMoney(text)
  return value > 0 ? value.toLocaleString('vi-VN') : ''
}

// Tài khoản nhận tiền của CMS tại mỗi ngân hàng mô phỏng (số tự đặt)
const COLLECTION_ACCOUNTS: Record<string, string> = {
  ALPHA: '1900100026',
  BETA: '2900200026',
  GAMMA: '3900300026',
}

export function collectionAccount(bankCode: string): string {
  return COLLECTION_ACCOUNTS[bankCode] ?? '9900000026'
}

// Nội dung chuyển khoản bắt buộc: "NAP" + số tài khoản chứng khoán
export function depositMemo(stockAccountNo: string | null): string {
  return `NAP ${stockAccountNo ?? ''}`.trim()
}

// Nội dung mã QR. Cố ý KHÔNG theo chuẩn thanh toán thật để app ngân hàng không hiểu nhầm.
export function depositQrPayload(input: {
  bankCode: string
  amount: number
  memo: string
}): string {
  return [
    'CMS-MOCK',
    'DEPOSIT',
    `bank=${input.bankCode}`,
    `to=${collectionAccount(input.bankCode)}`,
    `amount=${input.amount}`,
    `memo=${input.memo}`,
  ].join('|')
}

// Mã tham chiếu hiển thị trong bảng dòng tiền
export function cashReference(row: {
  id: number
  type: CashTxType
  order_id: number | null
  margin_loan_id: number | null
}): string {
  if (row.order_id) return `#${row.order_id}`
  if (row.margin_loan_id)
    return `VL-${String(row.margin_loan_id).padStart(4, '0')}`
  if (row.type === 'DEPOSIT') return `NT-${row.id}`
  if (row.type === 'WITHDRAW') return `RT-${row.id}`
  return '—'
}
