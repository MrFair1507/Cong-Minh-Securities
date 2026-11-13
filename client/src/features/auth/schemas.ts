import type { TFunction } from 'i18next'
import { z } from 'zod'
import { ageOn, GENDERS } from './lib/mockIdentity'

// Nhận t để thông báo lỗi đi qua i18n (đổi ngôn ngữ thì lỗi đổi theo)
export const loginSchema = (t: TFunction<'auth'>) =>
  z.object({
    email: z.email(t('errors.emailInvalid')),
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

// Đăng ký bước 3: chỉ ngày sinh, giới tính sửa được. Số giấy tờ, ngày cấp bị khóa nên không nằm trong form.
export const confirmSchema = (t: TFunction<'auth'>) =>
  z.object({
    dateOfBirth: z.iso
      .date(t('kyc.errors.dateInvalid'))
      .refine((value) => ageOn(value) >= 18, t('kyc.errors.underage')),
    gender: z.enum(GENDERS),
    accepted: z.literal(true, t('kyc.errors.mustAccept')),
  })

export type LoginValues = z.infer<ReturnType<typeof loginSchema>>
export type AccountValues = z.infer<ReturnType<typeof accountSchema>>
export type ConfirmValues = z.infer<ReturnType<typeof confirmSchema>>
