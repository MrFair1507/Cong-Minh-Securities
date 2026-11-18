import { supabase } from '@/shared/api/supabase'
import { authErrorKey } from './auth'

// updateUser không hỏi mật khẩu cũ, nên đăng nhập lại bằng mật khẩu hiện tại để kiểm trước.
// Trả về khóa i18n của lỗi (namespace auth), không lỗi thì trả undefined.
export async function changePassword(input: {
  email: string
  currentPassword: string
  newPassword: string
}) {
  const { error: checkError } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.currentPassword,
  })
  if (checkError) {
    return checkError.code === 'invalid_credentials'
      ? 'errors.currentPasswordWrong'
      : authErrorKey(checkError)
  }

  const { error } = await supabase.auth.updateUser({
    password: input.newPassword,
  })
  return error ? authErrorKey(error) : undefined
}
