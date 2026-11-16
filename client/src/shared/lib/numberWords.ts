// Đọc số tiền thành chữ, hiện dưới ô nhập số tiền để người dùng đối chiếu.
// 11100000 -> "Mười một triệu một trăm nghìn đồng"

const VI_DIGITS = [
  'không',
  'một',
  'hai',
  'ba',
  'bốn',
  'năm',
  'sáu',
  'bảy',
  'tám',
  'chín',
]

// Đọc một nhóm 3 chữ số. full = nhóm không đứng đầu, phải đọc đủ "không trăm", "linh"
function readViTriple(n: number, full: boolean): string[] {
  const hundreds = Math.floor(n / 100)
  const tens = Math.floor((n % 100) / 10)
  const units = n % 10
  const words: string[] = []

  if (hundreds > 0 || full) words.push(VI_DIGITS[hundreds], 'trăm')

  if (tens === 0) {
    if (units > 0 && (hundreds > 0 || full)) words.push('linh')
  } else if (tens === 1) {
    words.push('mười')
  } else {
    words.push(VI_DIGITS[tens], 'mươi')
  }

  if (units === 1 && tens > 1) words.push('mốt')
  else if (units === 4 && tens > 1) words.push('tư')
  else if (units === 5 && tens > 0) words.push('lăm')
  else if (units > 0) words.push(VI_DIGITS[units])

  return words
}

// Phần dưới 1 tỷ: nhóm triệu, nghìn, đơn vị. Nhóm bằng 0 thì bỏ qua.
function readViBelowBillion(n: number, full: boolean): string[] {
  const groups = [
    { value: Math.floor(n / 1_000_000), unit: 'triệu' },
    { value: Math.floor((n % 1_000_000) / 1000), unit: 'nghìn' },
    { value: n % 1000, unit: '' },
  ]
  const words: string[] = []
  for (const group of groups) {
    if (group.value === 0) continue
    words.push(...readViTriple(group.value, full || words.length > 0))
    if (group.unit) words.push(group.unit)
  }
  return words
}

function readVi(n: number): string[] {
  if (n < 1_000_000_000) return readViBelowBillion(n, false)
  const billions = Math.floor(n / 1_000_000_000)
  const rest = n % 1_000_000_000
  // 1.000 tỷ đọc "một nghìn tỷ": phần tỷ đọc lại như một số bình thường
  const words = [...readVi(billions), 'tỷ']
  if (rest > 0) words.push(...readViBelowBillion(rest, true))
  return words
}

export function moneyToWordsVi(amount: number): string {
  const n = Math.floor(Math.abs(amount))
  const words = n === 0 ? ['không'] : readVi(n)
  const text = `${words.join(' ')} đồng`
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const EN_SMALL = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
]
const EN_TENS = [
  '',
  '',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety',
]
const EN_SCALES = ['', 'thousand', 'million', 'billion', 'trillion']

function readEnTriple(n: number): string[] {
  const words: string[] = []
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  if (hundreds > 0) words.push(EN_SMALL[hundreds], 'hundred')
  if (rest >= 20) {
    const units = rest % 10
    words.push(
      units
        ? `${EN_TENS[Math.floor(rest / 10)]}-${EN_SMALL[units]}`
        : EN_TENS[Math.floor(rest / 10)],
    )
  } else if (rest > 0) {
    words.push(EN_SMALL[rest])
  }
  return words
}

export function moneyToWordsEn(amount: number): string {
  let n = Math.floor(Math.abs(amount))
  if (n === 0) return 'Zero dong'
  const parts: string[] = []
  for (let scale = 0; n > 0 && scale < EN_SCALES.length; scale++) {
    const group = n % 1000
    if (group > 0) {
      parts.unshift(
        [...readEnTriple(group), EN_SCALES[scale]].filter(Boolean).join(' '),
      )
    }
    n = Math.floor(n / 1000)
  }
  const text = `${parts.join(' ')} dong`
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function moneyToWords(amount: number, language: string): string {
  return language.startsWith('en')
    ? moneyToWordsEn(amount)
    : moneyToWordsVi(amount)
}
