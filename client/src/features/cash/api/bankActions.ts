import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'

// Mã lỗi các RPC ngân hàng mô phỏng trả trong message (raise exception 'OTP_INVALID')
const ERROR_CODES = [
  'NOT_AUTHENTICATED',
  'KYC_REQUIRED',
  'BANK_NOT_FOUND',
  'INVALID_ACCOUNT_NO',
  'BANK_LINK_LIMIT',
  'BANK_ACCOUNT_TAKEN',
  'BANK_LINK_NOT_FOUND',
  'OTP_INVALID',
  'OTP_EXPIRED',
  'INVALID_AMOUNT',
  'INSUFFICIENT_BANK_BALANCE',
  'INSUFFICIENT_CASH',
  'MARGIN_DEBT_OUTSTANDING',
] as const

export type BankErrorCode = (typeof ERROR_CODES)[number] | 'UNKNOWN'

export function bankErrorCode(error: unknown): BankErrorCode {
  const message = (error as { message?: unknown } | null)?.message
  return ERROR_CODES.find((code) => code === message) ?? 'UNKNOWN'
}

export type OtpPurpose = 'LINK_BANK' | 'WITHDRAW'

// Xin mã OTP mô phỏng: RPC trả mã về để giao diện hiện lên (thay tin nhắn SMS)
export function useRequestOtp() {
  return useMutation({
    mutationFn: async (purpose: OtpPurpose) => {
      const { data, error } = await supabase.rpc('request_bank_otp', {
        p_purpose: purpose,
      })
      if (error) throw error
      return data
    },
  })
}

// Mọi thao tác ngân hàng đều đổi tiền mặt (header), dòng tiền và danh sách liên kết
function useInvalidateCash() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      ['profile', 'cash', 'bank-links'].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      ),
    )
}

export function useLinkBank() {
  const invalidate = useInvalidateCash()
  return useMutation({
    mutationFn: async (input: {
      bankCode: string
      accountNo: string
      otp: string
    }) => {
      const { data, error } = await supabase.rpc('link_bank', {
        p_bank_code: input.bankCode,
        p_account_no: input.accountNo,
        p_otp: input.otp,
      })
      if (error) throw error
      return data
    },
    onSuccess: invalidate,
  })
}

export function useUnlinkBank() {
  const invalidate = useInvalidateCash()
  return useMutation({
    mutationFn: async (linkId: number) => {
      const { error } = await supabase.rpc('unlink_bank', {
        p_link_id: linkId,
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useDeposit() {
  const invalidate = useInvalidateCash()
  return useMutation({
    mutationFn: async (input: { linkId: number; amount: number }) => {
      const { data, error } = await supabase.rpc('deposit_cash', {
        p_link_id: input.linkId,
        p_amount: input.amount,
      })
      if (error) throw error
      return data
    },
    onSuccess: invalidate,
  })
}

export function useWithdraw() {
  const invalidate = useInvalidateCash()
  return useMutation({
    mutationFn: async (input: {
      linkId: number
      amount: number
      otp: string
    }) => {
      const { data, error } = await supabase.rpc('withdraw_cash', {
        p_link_id: input.linkId,
        p_amount: input.amount,
        p_otp: input.otp,
      })
      if (error) throw error
      return data
    },
    onSuccess: invalidate,
  })
}
