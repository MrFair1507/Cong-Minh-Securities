import { Upload } from 'lucide-react'
import { type ChangeEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import {
  CARD_SIDES,
  type CardImages,
  type CardSide,
  checkIdCard,
  type IdCardError,
  parseBack,
  parseFront,
} from '../../lib/idCard'
import type { MockIdentity } from '../../lib/mockIdentity'
import { readQr } from '../../lib/readQr'
import { StepHeading } from './RegisterStepper'
import { SCAN_STEPS, ScanLine, ScanProgress } from './ScanProgress'

const IMAGE_TYPES = ['image/jpeg', 'image/png']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MIN_STEP_MS = 400

type Scan = { current: number; failed: boolean }

type ScanErrors = Partial<Record<CardSide | 'card', IdCardError>>

type DocumentStepProps = {
  fullName: string 
  images: CardImages
  onImagesChange: (images: CardImages) => void
  onBack: () => void
  onVerified: (identity: MockIdentity) => void
}

export function DocumentStep({
  fullName,
  images,
  onImagesChange,
  onBack,
  onVerified,
}: DocumentStepProps) {
  const { t } = useTranslation('auth')
  const [scan, setScan] = useState<Scan>()
  const [errors, setErrors] = useState<ScanErrors>({})
  const scanning = scan !== undefined && !scan.failed

  function handleImage(side: CardSide, file: File) {
    onImagesChange({ ...images, [side]: file })
    setErrors(({ [side]: _side, card: _card, ...rest }) => rest)
    setScan(undefined)
  }

  function fail(current: number, scanErrors: ScanErrors) {
    setScan({ current, failed: true })
    setErrors(scanErrors)
  }

  async function verify(frontImage: File, backImage: File) {
    setErrors({})

    // 1. Đọc mã QR trên từng ảnh
    setScan({ current: 0, failed: false })
    const [[frontQr, backQr]] = await Promise.all([
      Promise.all([readQr(frontImage), readQr(backImage)]),
      wait(MIN_STEP_MS),
    ])
    if ('error' in frontQr || 'error' in backQr) {
      return fail(0, { front: errorOf(frontQr), back: errorOf(backQr) })
    }

    // 2. Tách dữ liệu từng mặt
    setScan({ current: 1, failed: false })
    await wait(MIN_STEP_MS)
    const front = parseFront(frontQr.data)
    const back = parseBack(backQr.data)
    if ('error' in front || 'error' in back) {
      return fail(1, { front: errorOf(front), back: errorOf(back) })
    }

    // 3. Đối chiếu hai mặt với nhau và với họ tên
    setScan({ current: 2, failed: false })
    await wait(MIN_STEP_MS)
    const card = checkIdCard(front.data, back.data, fullName)
    if ('error' in card) return fail(2, { card: card.error })

    setScan({ current: SCAN_STEPS.length, failed: false })
    await wait(MIN_STEP_MS)
    onVerified(card.data)
  }

  async function handleVerify() {
    if (!images.front || !images.back) return
    try {
      await verify(images.front, images.back)
    } catch {
      setScan(undefined)
      toast.error(t('errors.unknown'))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <StepHeading
        title={t('kyc.document.title')}
        description={t('kyc.document.description')}
      />

      <div className="grid grid-cols-2 items-start gap-3">
        {CARD_SIDES.map((side) => (
          <DocumentSlot
            key={side}
            side={side}
            value={images[side]}
            error={errors[side]}
            scanning={scanning}
            onChange={(file) => handleImage(side, file)}
          />
        ))}
      </div>

      {scan && <ScanProgress {...scan} />}
      {errors.card && (
        <p role="alert" className="text-sm text-destructive">
          {t(`kyc.cardErrors.${errors.card}`)}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
          disabled={scanning}
        >
          {t('register.back')}
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1"
          disabled={!images.front || !images.back || scanning}
          onClick={handleVerify}
        >
          {scanning ? t('kyc.document.verifying') : t('kyc.document.verify')}
        </Button>
      </div>
    </div>
  )
}

// Giữ mỗi dòng quét đủ lâu để người dùng kịp nhìn
function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function errorOf(result: { error: IdCardError } | { data: unknown }) {
  return 'error' in result ? result.error : undefined
}

type DocumentSlotProps = {
  side: CardSide
  value?: File
  error?: IdCardError
  scanning: boolean
  onChange: (file: File) => void
}

function DocumentSlot({
  side,
  value,
  error,
  scanning,
  onChange,
}: DocumentSlotProps) {
  const { t } = useTranslation('auth')
  const previewUrl = useObjectUrl(value)
  const label = t(`kyc.document.${side}`)
  const errorId = `card-${side}-error`

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // cho phép chọn lại đúng file vừa chọn
    if (!file) return
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error(t('kyc.errors.imageType'))
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(t('kyc.errors.imageSize'))
      return
    }
    onChange(file)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm leading-5 font-medium">{label}</span>
      <label className="relative grid aspect-[8/5] cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed bg-muted/40 transition-colors hover:bg-muted has-disabled:cursor-default has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-aria-invalid:border-destructive">
        <input
          type="file"
          accept={IMAGE_TYPES.join(',')}
          aria-label={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          disabled={scanning}
          onChange={handleFile}
          className="sr-only"
        />
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={label}
            className="size-full object-cover"
          />
        ) : (
          <span className="flex flex-col items-center gap-1 px-2 text-center text-xs text-muted-foreground">
            <Upload className="size-5" aria-hidden />
            <span className="font-medium text-foreground">
              {t('kyc.document.upload')}
            </span>
            {t('kyc.document.hint')}
          </span>
        )}
        {scanning && <ScanLine />}
      </label>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {t(`kyc.cardErrors.${error}`)}
        </p>
      )}
    </div>
  )
}

// Ảnh chỉ thành URL blob: trong trình duyệt, không upload.
// Đổi ảnh hoặc rời bước (unmount) thì thu hồi URL cũ.
function useObjectUrl(file?: File) {
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    if (!file) {
      setUrl(undefined)
      return
    }
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  return url
}
