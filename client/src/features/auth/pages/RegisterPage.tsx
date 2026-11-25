import { useNavigate, useRouteContext, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { authErrorKey, signUp } from '../api/auth'
import { AccountStep } from '../components/register/AccountStep'
import { CompleteStep } from '../components/register/CompleteStep'
import { ConfirmStep } from '../components/register/ConfirmStep'
import { DocumentStep } from '../components/register/DocumentStep'
import {
  type RegisterStep,
  RegisterStepper,
} from '../components/register/RegisterStepper'
import type { CardImages } from '../lib/idCard'
import type { MockIdentity } from '../lib/mockIdentity'
import type { AccountValues } from '../schemas'

// Wizard 4 bước. State để trong trang (useState): tải lại trang thì về bước 1,
// chấp nhận được vì ảnh vốn không được lưu.
export function RegisterPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate({ from: '/register' })
  const { session } = useRouteContext({ from: '/_guest/register' })
  const { completed } = useSearch({ from: '/_guest/register' })

  // Tải lại ở bước 4 (đã có phiên + ?completed=true) thì vẫn hiện bước 4
  const [step, setStep] = useState<RegisterStep>(() =>
    session && completed ? 'complete' : 'account',
  )
  const [account, setAccount] = useState<AccountValues>()
  // Giữ ảnh ở đây để bấm Quay lại không mất
  const [images, setImages] = useState<CardImages>({})
  const [identity, setIdentity] = useState<MockIdentity>()
  const [emailError, setEmailError] = useState<string>()

  function handleAccount(values: AccountValues) {
    setAccount(values)
    setEmailError(undefined)
    setStep('document')
  }

  function handleVerified(verified: MockIdentity) {
    setIdentity(verified)
    setStep('confirm')
  }

  async function handleConfirm() {
    if (!account || !identity) return
    // Gắn cờ trước: signUp phát SIGNED_IN → router.invalidate() chạy lại beforeLoad.
    // Có completed thì guard không đá sang /market trước khi kịp hiện bước 4.
    await navigate({ search: { completed: true }, replace: true })
    const error = await signUp(account, identity)
    if (!error) {
      setStep('complete')
      return
    }

    await navigate({ search: {}, replace: true })
    const key = authErrorKey(error)
    if (key === 'errors.emailTaken') {
      setEmailError(t(key))
      setStep('account')
      return
    }
    toast.error(t(key))
  }

  return (
    <div className="flex w-[440px] flex-col gap-6">
      <RegisterStepper current={step} />

      {step === 'account' && (
        <AccountStep
          defaultValues={account}
          emailError={emailError}
          onEmailChange={() => setEmailError(undefined)}
          onSubmit={handleAccount}
        />
      )}
      {step === 'document' && account && (
        <DocumentStep
          fullName={account.fullName}
          images={images}
          onImagesChange={setImages}
          onBack={() => setStep('account')}
          onVerified={handleVerified}
        />
      )}
      {step === 'confirm' && identity && (
        <ConfirmStep
          identity={identity}
          onBack={() => setStep('document')}
          onSubmit={handleConfirm}
        />
      )}
      {step === 'complete' && <CompleteStep userId={session?.user.id} />}
    </div>
  )
}
