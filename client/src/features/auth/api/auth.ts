import type { AuthError } from '@supabase/supabase-js'
import { supabase } from '@/shared/api/supabase'
import type { MockIdentity } from '../lib/mockIdentity'
import type { AccountValues, LoginValues } from '../schemas'

export async function signIn({ email, password }: LoginValues) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return error
}

// Trigger handle_new_user đọc metadata này để ghi vào profiles.
// Metadata do client gửi nên không tin được: check constraint ở DB chặn số giấy tờ không có tiền tố 999.
export async function signUp(account: AccountValues, identity: MockIdentity) {
  const { error } = await supabase.auth.signUp({
    email: account.email,
    password: account.password,
    options: {
      data: {
        full_name: identity.fullName, // tên trên thẻ, đã đối chiếu với tên nhập ở bước 1
        phone: account.phone,
        id_number: identity.idNumber,
        date_of_birth: identity.dateOfBirth,
        gender: identity.gender,
        id_issued_on: identity.issuedOn,
      },
    },
  })
  return error
}

const ERROR_KEYS = {
  invalid_credentials: 'errors.invalidCredentials',
  user_already_exists: 'errors.emailTaken',
  email_exists: 'errors.emailTaken',
  email_not_confirmed: 'errors.emailNotConfirmed',
  weak_password: 'errors.weakPassword',
  same_password: 'errors.samePassword',
  over_request_rate_limit: 'errors.rateLimit',
} as const

// Trigger lỗi (số giấy tờ đã dùng hoặc không có đầu 999) thì Supabase trả 500 kèm câu này.
// Phải so message vì auth-js bỏ error.code của mọi phản hồi 5xx.
const SIGNUP_DB_ERROR = 'Database error saving new user'

export function authErrorKey(error: AuthError) {
  if (error.message.includes(SIGNUP_DB_ERROR)) return 'errors.signupRejected'
  return ERROR_KEYS[error.code as keyof typeof ERROR_KEYS] ?? 'errors.unknown'
}
