// Sinh thông tin giấy tờ hư cấu cho bước eKYC mô phỏng. Không có OCR: ảnh tải lên
// không được đọc, mọi giá trị đều ngẫu nhiên. Ngày dạng 'YYYY-MM-DD' (kiểu date của Postgres).

export const GENDERS = ['MALE', 'FEMALE'] as const
export type Gender = (typeof GENDERS)[number]

export type MockIdentity = {
  idNumber: string
  fullName: string
  dateOfBirth: string
  gender: Gender
  issuedOn: string
}

// CCCD thật bắt đầu bằng mã tỉnh 001–096, nên tiền tố 999 không bao giờ trùng giấy tờ thật.
// DB chặn thêm bằng check (id_number ~ '^999\d{9}$').
export const MOCK_ID_PREFIX = '999'

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

// Đọc theo giờ máy. Không dùng new Date('YYYY-MM-DD') vì chuỗi đó bị hiểu là UTC.
function parseIsoDate(isoDate: string) {
  const [year = 0, month = 1, day = 1] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function addYears(date: Date, years: number) {
  const result = new Date(date)
  result.setFullYear(result.getFullYear() + years)
  return result
}

function randomDateBetween(from: Date, to: Date) {
  return new Date(randomInt(from.getTime(), to.getTime()))
}

export function ageOn(dateOfBirth: string, today = new Date()) {
  const birth = parseIsoDate(dateOfBirth)
  const age = today.getFullYear() - birth.getFullYear()
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  return beforeBirthday ? age - 1 : age
}

export function generateIdNumber() {
  const digits = Array.from({ length: 9 }, () => randomInt(0, 9)).join('')
  return MOCK_ID_PREFIX + digits
}

// Tuổi ngẫu nhiên 20–55
export function generateDateOfBirth(today = new Date()) {
  return toIsoDate(
    randomDateBetween(addYears(today, -55), addYears(today, -20)),
  )
}

// Ngày cấp: sau sinh nhật 14 tuổi và trong vòng 10 năm gần đây
export function generateIssuedOn(dateOfBirth: string, today = new Date()) {
  const turned14 = addYears(parseIsoDate(dateOfBirth), 14)
  const tenYearsAgo = addYears(today, -10)
  const from = new Date(Math.max(turned14.getTime(), tenYearsAgo.getTime()))
  return toIsoDate(randomDateBetween(from, today))
}

export function isValidIssuedOn(dateOfBirth: string, issuedOn: string) {
  return parseIsoDate(issuedOn) >= addYears(parseIsoDate(dateOfBirth), 14)
}

export function generateMockIdentity(
  fullName: string,
  today = new Date(),
): MockIdentity {
  const dateOfBirth = generateDateOfBirth(today)
  return {
    idNumber: generateIdNumber(),
    fullName: fullName.trim(),
    dateOfBirth,
    gender: Math.random() < 0.5 ? 'MALE' : 'FEMALE',
    issuedOn: generateIssuedOn(dateOfBirth, today),
  }
}
