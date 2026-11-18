// Định dạng số theo kiểu Việt Nam: dấu chấm ngăn nghìn, dấu phẩy thập phân.

const moneyFormat = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

// Giá trên bảng giá hiển thị theo nghìn đồng, 2 chữ số thập phân: 25400 -> "25,40"
const priceFormat = new Intl.NumberFormat('vi-VN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const integerFormat = new Intl.NumberFormat('vi-VN')

export function formatMoney(value: number): string {
  return moneyFormat.format(value)
}

export function formatPrice(value: number): string {
  return priceFormat.format(value / 1000)
}

const compactFormat = new Intl.NumberFormat('vi-VN', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

// Số gọn cho chỗ hẹp: 143630000 -> "143,6 Tr"
export function formatCompact(value: number): string {
  return compactFormat.format(value)
}

// 3215400 -> "3.215.400"
export function formatVolume(value: number): string {
  return integerFormat.format(value)
}

// Thay đổi giá có dấu: 300 -> "+0,30", -1200 -> "-1,20"
export function formatPriceChange(value: number): string {
  return `${value > 0 ? '+' : ''}${formatPrice(value)}`
}

// Bảng giá ghi khối lượng theo đơn vị 10 cổ phiếu: 3215400 -> "321.540"
export function formatBoardVolume(value: number): string {
  return integerFormat.format(Math.round(value / 10))
}

const ratioFormat = new Intl.NumberFormat('vi-VN', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

// Tỷ lệ không dấu: 0.0888 -> "8,88%"
export function formatRatio(ratio: number): string {
  return ratioFormat.format(ratio)
}

const rateFormat = new Intl.NumberFormat('vi-VN', {
  style: 'percent',
  maximumFractionDigits: 2,
})

// Lãi suất, ngưỡng: bỏ số 0 thừa: 0.4 -> "40%", 0.095 -> "9,5%"
export function formatRate(rate: number): string {
  return rateFormat.format(rate)
}

// 0.016 -> "+1,60%", có dấu cộng khi dương
export function formatPercent(ratio: number): string {
  const text = priceFormat.format(ratio * 100)
  return `${ratio > 0 ? '+' : ''}${text}%`
}

// '1990-05-02' -> '02/05/1990'
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

const dateTimeFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
})
export function formatDateTime(isoDateTime: string): string {
  return dateTimeFormat.format(new Date(isoDateTime))
}

const timeFormat = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Ho_Chi_Minh',
})
// timestamptz -> "09:05" giờ Việt Nam
export function formatTime(isoDateTime: string): string {
  return timeFormat.format(new Date(isoDateTime))
}

const clockFormat = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'Asia/Ho_Chi_Minh',
})
// timestamptz -> "09:05:30" giờ Việt Nam
export function formatClock(isoDateTime: string): string {
  return clockFormat.format(new Date(isoDateTime))
}
