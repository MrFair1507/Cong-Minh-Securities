import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'
import type { PackageCode } from '../lib/packages'

const ERROR_CODES = [
  'NOT_AUTHENTICATED',
  'KYC_REQUIRED',
  'MARGIN_ACCOUNT_EXISTS',
  'MARGIN_ACCOUNT_REQUIRED',
  'INVALID_SETTINGS',
  'INVALID_PACKAGE',
  'PACKAGE_ALREADY_ACTIVE',
  'PACKAGE_CONFLICT',
  'NO_ACTIVE_PACKAGE',
  'INVALID_AMOUNT',
  'LOAN_NOT_FOUND',
  'LOAN_PAID',
  'REPAY_EXCEEDS_DEBT',
  'INSUFFICIENT_CASH',
  'RENEW_TOO_EARLY',
  'RENEW_LIMIT',
  'MARGIN_RATIO_TOO_LOW',
] as const

export type MarginErrorCode = (typeof ERROR_CODES)[number] | 'UNKNOWN'

export function marginErrorCode(error: unknown): MarginErrorCode {
  const message = (error as { message?: unknown } | null)?.message
  return ERROR_CODES.find((code) => code === message) ?? 'UNKNOWN'
}

function useInvalidate(keys: string[]) {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      keys.map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
    )
}

export function useOpenMarginAccount() {
  const invalidate = useInvalidate(['margin'])
  return useMutation({
    mutationFn: async (input: { autoRepay: boolean; autoRenew: boolean }) => {
      const { error } = await supabase.rpc('open_margin_account', {
        p_auto_repay: input.autoRepay,
        p_auto_renew: input.autoRenew,
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useUpdateMarginSettings() {
  const invalidate = useInvalidate(['margin'])
  return useMutation({
    mutationFn: async (input: { autoRepay: boolean; autoRenew: boolean }) => {
      const { error } = await supabase.rpc('update_margin_settings', {
        p_auto_repay: input.autoRepay,
        p_auto_renew: input.autoRenew,
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useRegisterPackage() {
  const invalidate = useInvalidate(['margin'])
  return useMutation({
    mutationFn: async (code: PackageCode) => {
      const { error } = await supabase.rpc('register_margin_package', {
        p_code: code,
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useCancelPackage() {
  const invalidate = useInvalidate(['margin'])
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('cancel_margin_package')
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useRepayLoan() {
  const invalidate = useInvalidate(['margin', 'profile', 'cash'])
  return useMutation({
    mutationFn: async (input: { loanId: number; amount: number }) => {
      const { error } = await supabase.rpc('repay_margin_loan', {
        p_loan_id: input.loanId,
        p_amount: input.amount,
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useRenewLoan() {
  const invalidate = useInvalidate(['margin'])
  return useMutation({
    mutationFn: async (loanId: number) => {
      const { data, error } = await supabase.rpc('renew_margin_loan', {
        p_loan_id: loanId,
      })
      if (error) throw error
      return data 
    },
    onSuccess: invalidate,
  })
}
