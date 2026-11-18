// Ngày hôm nay theo giờ Việt Nam dạng 'YYYY-MM-DD', khớp vn_today() trong DB.
// Locale en-CA định dạng sẵn năm-tháng-ngày.
const vnDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function vnToday(): string {
  return vnDateFormat.format(new Date())
}

// Cộng n ngày vào 'YYYY-MM-DD' (tính theo UTC để không lệch múi giờ)
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

// Mã khoản vay hiển thị: 7 → "VL-0007"
export function loanCode(id: number): string {
  return `VL-${String(id).padStart(4, '0')}`
}
