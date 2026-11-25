import { z } from 'zod'
import {
  ageOn,
  GENDERS,
  isValidIssuedOn,
  MOCK_ID_PREFIX,
  type MockIdentity,
} from './mockIdentity'

export const CARD_SIDES = ['front', 'back'] as const
export type CardSide = (typeof CARD_SIDES)[number]

export type IdCardError =
  | 'IMAGE_UNREADABLE' // trình duyệt không mở được ảnh
  | 'NO_QR' // không thấy mã QR
  | 'NOT_CMS' // QR không phải của thẻ mẫu CMS
  | 'WRONG_SIDE' // tải nhầm mặt
  | 'BAD_CARD' // dữ liệu hỏng hoặc vô lý
  | 'NOT_MOCK_NUMBER' // số không bắt đầu bằng 999
  | 'SIDES_MISMATCH' // hai mặt của hai thẻ khác nhau
  | 'UNDERAGE'
  | 'NAME_MISMATCH' // khác họ tên đã nhập ở bước 1

// Ảnh người dùng chọn, chỉ nằm trong bộ nhớ trình duyệt
export type CardImages = Partial<Record<CardSide, File>>

export type CardResult<T> = { data: T } | { error: IdCardError }

// Nội dung QR: CMS-MOCK|ID|FRONT|{json}. Cùng tiền tố với QR nạp tiền, không theo chuẩn thật nào.
const CARD_PREFIX = 'CMS-MOCK|ID|'
const SIDE_PREFIX: Record<CardSide, string> = {
  front: `${CARD_PREFIX}FRONT|`,
  back: `${CARD_PREFIX}BACK|`,
}
const MOCK_NUMBER = new RegExp(`^${MOCK_ID_PREFIX}\\d{9}$`)

const frontSchema = z.object({
  v: z.literal(1),
  idNumber: z.string(),
  fullName: z.string().trim().min(1),
  dateOfBirth: z.iso.date(),
  gender: z.enum(GENDERS),
})
const backSchema = z.object({
  v: z.literal(1),
  idNumber: z.string(),
  issuedOn: z.iso.date(),
})

export type CardFront = z.infer<typeof frontSchema>
export type CardBack = z.infer<typeof backSchema>

export const parseFront = (text: string) =>
  parseSide(text, 'front', frontSchema)

export const parseBack = (text: string) => parseSide(text, 'back', backSchema)

function parseSide<T extends { idNumber: string }>(
  text: string,
  side: CardSide,
  schema: z.ZodType<T>,
): CardResult<T> {
  // Kể cả QR trên căn cước thật cũng dừng ở đây: không tách trường, không lưu, không log
  if (!text.startsWith(CARD_PREFIX)) return { error: 'NOT_CMS' }
  const prefix = SIDE_PREFIX[side]
  if (!text.startsWith(prefix)) {
    const isOtherSide = CARD_SIDES.some((s) => text.startsWith(SIDE_PREFIX[s]))
    return { error: isOtherSide ? 'WRONG_SIDE' : 'BAD_CARD' }
  }

  const result = schema.safeParse(parseJson(text.slice(prefix.length)))
  if (!result.success) return { error: 'BAD_CARD' }
  if (!MOCK_NUMBER.test(result.data.idNumber))
    return { error: 'NOT_MOCK_NUMBER' }
  return { data: result.data }
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

// Đối chiếu hai mặt với nhau và với họ tên ở bước 1
export function checkIdCard(
  front: CardFront,
  back: CardBack,
  fullName: string,
  today = new Date(),
): CardResult<MockIdentity> {
  if (front.idNumber !== back.idNumber) return { error: 'SIDES_MISMATCH' }
  // "Tuổi" âm nghĩa là ngày đó còn ở tương lai
  if (
    ageOn(back.issuedOn, today) < 0 ||
    !isValidIssuedOn(front.dateOfBirth, back.issuedOn)
  )
    return { error: 'BAD_CARD' }
  if (ageOn(front.dateOfBirth, today) < 18) return { error: 'UNDERAGE' }
  if (normalizeName(front.fullName) !== normalizeName(fullName))
    return { error: 'NAME_MISMATCH' }

  return {
    data: {
      idNumber: front.idNumber,
      fullName: front.fullName,
      dateOfBirth: front.dateOfBirth,
      gender: front.gender,
      issuedOn: back.issuedOn,
    },
  }
}

// Bỏ khác biệt về hoa/thường, khoảng trắng thừa, cách gõ dấu (NFC). Vẫn phân biệt dấu: Hòa khác Hoa.
export function normalizeName(name: string) {
  return name.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase()
}
