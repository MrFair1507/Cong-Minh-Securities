import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ResetChallenge } from '../api/passwordReset'
import { ForgotInfoStep } from '../components/forgot/ForgotInfoStep'
import { ResetPasswordStep } from '../components/forgot/ResetPasswordStep'
import type { ForgotInfoValues } from '../schemas'

type Verified = { info: ForgotInfoValues; challenge: ResetChallenge }

// Quên mật khẩu 2 bước: xác minh thông tin eKYC → OTP mô phỏng + mật khẩu mới
export function ForgotPasswordPage() {
  const { t } = useTranslation('auth')
  const { email } = useSearch({ from: '/_guest/forgot-password' })
  const navigate = useNavigate()
  const [verified, setVerified] = useState<Verified | null>(null)

  return (
    <div className="flex w-[380px] flex-col gap-4">
      {verified ? (
        <ResetPasswordStep
          info={verified.info}
          challenge={verified.challenge}
          onDone={() =>
            navigate({ to: '/login', search: { email: verified.info.email } })
          }
        />
      ) : (
        <ForgotInfoStep
          defaultEmail={email ?? ''}
          onVerified={(info, challenge) => setVerified({ info, challenge })}
        />
      )}

      <div className="border-t pt-4 text-center">
        <Link
          to="/login"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {t('forgot.backToLogin')}
        </Link>
      </div>
    </div>
  )
}
