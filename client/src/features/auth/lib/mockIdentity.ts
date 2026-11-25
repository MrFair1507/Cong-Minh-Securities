export const GENDERS = ['MALE', 'FEMALE'] as const
export type Gender = (typeof GENDERS)[number]

export type MockIdentity = {
  idNumber: string
  fullName: string
  dateOfBirth: string
  gender: Gender
  issuedOn: string
}

// Số CCCD thật không có đầu 999. DB cũng chặn mọi số khác đầu này.
export const MOCK_ID_PREFIX = '999'

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

export function ageOn(dateOfBirth: string, today = new Date()) {
  const birth = parseIsoDate(dateOfBirth)
  const age = today.getFullYear() - birth.getFullYear()
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  return beforeBirthday ? age - 1 : age
}

// Thẻ chỉ cấp từ sinh nhật 14 tuổi trở đi
export function isValidIssuedOn(dateOfBirth: string, issuedOn: string) {
  return parseIsoDate(issuedOn) >= addYears(parseIsoDate(dateOfBirth), 14)
}
