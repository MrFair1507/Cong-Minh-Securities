import type { TFunction } from 'i18next'
import { z } from 'zod'

// Nhận t để thông báo lỗi đi qua i18n (đổi ngôn ngữ thì lỗi đổi theo)
export const loginSchema = (t: TFunction<'auth'>) =>
  z.object({
    // Ô trống báo "Vui lòng nhập email", có chữ mà sai dạng mới báo "không hợp lệ"
    email: z
      .string()
      .trim()
      .min(1, t('errors.emailRequired'))
      .pipe(z.email(t('errors.emailInvalid'))),
    password: z.string().min(1, t('errors.passwordRequired')),
  })

// Đăng ký bước 1: chưa gọi Supabase
export const accountSchema = (t: TFunction<'auth'>) =>
  z
    .object({
      fullName: z.string().trim().min(1, t('errors.fullNameRequired')),
      email: z.email(t('errors.emailInvalid')),
      phone: z.string().regex(/^0\d{9}$/, t('errors.phoneInvalid')),
      password: z.string().min(8, t('errors.passwordMin')),
      confirmPassword: z.string(),
    })
    .refine((v) => v.password === v.confirmPassword, {
      message: t('errors.passwordMismatch'),
      path: ['confirmPassword'], // lỗi hiện dưới ô Xác nhận mật khẩu
    })

// Đăng ký bước 3: thông tin đọc từ thẻ đều khóa, form chỉ còn ô đồng ý
export const confirmSchema = (t: TFunction<'auth'>) =>
  z.object({
    accepted: z.literal(true, t('kyc.errors.mustAccept')),
  })

// Hồ sơ: đổi mật khẩu
export const passwordSchema = (t: TFunction<'auth'>) =>
  z
    .object({
      currentPassword: z.string().min(1, t('errors.passwordRequired')),
      newPassword: z.string().min(8, t('errors.passwordMin')),
      confirmPassword: z.string(),
    })
    .refine((v) => v.newPassword !== v.currentPassword, {
      message: t('errors.samePassword'),
      path: ['newPassword'],
    })
    .refine((v) => v.newPassword === v.confirmPassword, {
      message: t('errors.passwordMismatch'),
      path: ['confirmPassword'],
    })

// Quên mật khẩu bước 1: 3 thông tin phải khớp hồ sơ eKYC
export const forgotInfoSchema = (t: TFunction<'auth'>) =>
  z.object({
    email: z.email(t('errors.emailInvalid')),
    idNumber: z.string().regex(/^\d{12}$/, t('forgot.errors.idNumberInvalid')),
    phone: z.string().regex(/^0\d{9}$/, t('errors.phoneInvalid')),
  })

// Quên mật khẩu bước 2: OTP + mật khẩu mới
export const resetPasswordSchema = (t: TFunction<'auth'>) =>
  z
    .object({
      otp: z.string().regex(/^\d{6}$/, t('forgot.errors.otpFormat')),
      newPassword: z.string().min(8, t('errors.passwordMin')),
      confirmPassword: z.string(),
    })
    .refine((v) => v.newPassword === v.confirmPassword, {
      message: t('errors.passwordMismatch'),
      path: ['confirmPassword'],
    })

export type LoginValues = z.infer<ReturnType<typeof loginSchema>>
export type AccountValues = z.infer<ReturnType<typeof accountSchema>>
export type ConfirmValues = z.infer<ReturnType<typeof confirmSchema>>
export type ForgotInfoValues = z.infer<ReturnType<typeof forgotInfoSchema>>
