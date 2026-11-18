import { supabase } from '@/shared/api/supabase'
import type { ForgotInfoValues } from '../schemas'

// Mã lỗi/kết quả từ 2 RPC quên mật khẩu → khóa i18n (namespace auth)
const ERROR_KEYS = {
  RESET_INFO_MISMATCH: 'forgot.errors.mismatch',
  OTP_TOO_SOON: 'forgot.errors.tooSoon',
  OTP_INVALID: 'forgot.errors.otpInvalid',
  OTP_EXPIRED: 'forgot.errors.otpExpired',
  OTP_LOCKED: 'forgot.errors.otpLocked',
  WEAK_PASSWORD: 'errors.passwordMin',
} as const

type ResetErrorKey =
  | (typeof ERROR_KEYS)[keyof typeof ERROR_KEYS]
  | 'errors.unknown'

function errorKey(code: string | undefined): ResetErrorKey {
  return ERROR_KEYS[code as keyof typeof ERROR_KEYS] ?? 'errors.unknown'
}

// OTP mô phỏng: RPC trả mã về để giao diện hiện lên (thay tin nhắn SMS)
export type ResetChallenge = { code: string; phoneTail: string }

export async function requestPasswordReset(
  input: ForgotInfoValues,
): Promise<{ challenge: ResetChallenge } | { errorKey: ResetErrorKey }> {
  const { data, error } = await supabase.rpc('request_password_reset', {
    p_email: input.email,
    p_id_number: input.idNumber,
    p_phone: input.phone,
  })
  const row = data?.[0]
  if (error || !row) return { errorKey: errorKey(error?.message) }
  return { challenge: { code: row.code, phoneTail: row.phone_tail } }
}

// Trả về khóa i18n của lỗi, thành công thì undefined
export async function resetPassword(input: {
  email: string
  otp: string
  newPassword: string
}): Promise<ResetErrorKey | undefined> {
  const { data, error } = await supabase.rpc('reset_password', {
    p_email: input.email,
    p_code: input.otp,
    p_new_password: input.newPassword,
  })
  if (error) return errorKey(error.message)
  return data === 'OK' ? undefined : errorKey(data)
}
