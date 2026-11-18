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
