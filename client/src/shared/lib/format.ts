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

// 14770000 -> "14.770.000 ₫"
export function formatMoney(value: number): string {
  return moneyFormat.format(value)
}

export function formatPrice(value: number): string {
  return priceFormat.format(value / 1000)
}

// 3215400 -> "3.215.400"
export function formatVolume(value: number): string {
  return integerFormat.format(value)
}

// 0.016 -> "+1,60%", có dấu cộng khi dương
export function formatPercent(ratio: number): string {
  const text = priceFormat.format(ratio * 100)
  return `${ratio > 0 ? '+' : ''}${text}%`
}
