import type { MarginRates } from '@cms/shared/margin'
import { isMarginCall, marginRatio } from '@cms/shared/margin'
import type { SupabaseClient } from '@supabase/supabase-js'
// Chỉ import kiểu (bị xóa khi chạy), dùng chung file kiểu do `yarn db:types` sinh ra
import type { Database } from '../../client/src/shared/api/database.types'

// Sau mỗi lần cập nhật giá: tính tỷ lệ ký quỹ của từng tài khoản.
// Dưới call_rate và chưa có cảnh báo đang mở -> tạo cảnh báo OPEN.
// Từ call_rate trở lên (hoặc đã hết nợ) mà còn cảnh báo mở -> đóng cảnh báo.
export async function checkMarginCalls(
  supabase: SupabaseClient<Database>,
  prices: Map<number, number>,
): Promise<void> {
  const { data: accounts, error } = await supabase
    .from('margin_accounts')
    .select(
      'id, user_id, initial_rate, call_rate, maintenance_rate, margin_loans(outstanding)',
    )
  if (error) throw error
  if (accounts.length === 0) return

  const userIds = accounts.map((a) => a.user_id)
  const [profiles, holdings, openCalls] = await Promise.all([
    supabase.from('profiles').select('id, cash_balance').in('id', userIds),
    supabase
      .from('holdings')
      .select('user_id, stock_id, quantity')
      .in('user_id', userIds),
    supabase
      .from('margin_calls')
      .select('id, margin_account_id')
      .eq('status', 'OPEN'),
  ])
  if (profiles.error) throw profiles.error
  if (holdings.error) throw holdings.error
  if (openCalls.error) throw openCalls.error

  const cash = new Map(profiles.data.map((p) => [p.id, p.cash_balance]))
  const stockValue = new Map<string, number>()
  for (const h of holdings.data) {
    const value = h.quantity * (prices.get(h.stock_id) ?? 0)
    stockValue.set(h.user_id, (stockValue.get(h.user_id) ?? 0) + value)
  }
  const openCallByAccount = new Map(
    openCalls.data.map((c) => [c.margin_account_id, c.id]),
  )

  for (const account of accounts) {
    const debt = account.margin_loans.reduce((sum, l) => sum + l.outstanding, 0)
    const totalAssets =
      (cash.get(account.user_id) ?? 0) + (stockValue.get(account.user_id) ?? 0)
    const rates: MarginRates = {
      initialRate: account.initial_rate,
      callRate: account.call_rate,
      maintenanceRate: account.maintenance_rate,
    }
    const openCallId = openCallByAccount.get(account.id)
    const inCall = isMarginCall(totalAssets, debt, rates)

    if (inCall && openCallId === undefined) {
      const ratio = marginRatio(totalAssets, debt)
      const { error: insertError } = await supabase
        .from('margin_calls')
        .insert({
          margin_account_id: account.id,
          user_id: account.user_id,
          ratio_at_call: Number(ratio.toFixed(4)),
        })
      // 23505: đã có cảnh báo mở (unique index), bỏ qua
      if (insertError && insertError.code !== '23505') throw insertError
      console.log(
        `  ! Cảnh báo ký quỹ: tài khoản ${account.id}, tỷ lệ ${(ratio * 100).toFixed(2)}%`,
      )
    } else if (!inCall && openCallId !== undefined) {
      const { error: updateError } = await supabase
        .from('margin_calls')
        .update({ status: 'RESOLVED', resolved_at: new Date().toISOString() })
        .eq('id', openCallId)
      if (updateError) throw updateError
      console.log(`  ✓ Đóng cảnh báo: tài khoản ${account.id}`)
    }
  }
}
