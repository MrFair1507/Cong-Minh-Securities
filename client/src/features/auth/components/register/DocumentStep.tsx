import { FileImage, Upload } from 'lucide-react'
import { type ChangeEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { StepHeading } from './RegisterStepper'
import { SampleIdCard } from './SampleIdCard'
import { ScanLine, ScanProgress } from './ScanProgress'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const SIDES = ['front', 'back'] as const
type Side = (typeof SIDES)[number]

type DocImage = File | 'sample' | null

type DocumentStepProps = { onBack: () => void; onVerified: () => void }

export function DocumentStep({ onBack, onVerified }: DocumentStepProps) {
  const { t } = useTranslation('auth')
  const [images, setImages] = useState<Record<Side, DocImage>>({
    front: null,
    back: null,
  })
  const [scanning, setScanning] = useState(false)
  const ready = images.front !== null && images.back !== null

  return (
    <div className="flex flex-col gap-4">
      <StepHeading
        title={t('kyc.document.title')}
        description={t('kyc.document.description')}
      />

      <div className="grid grid-cols-2 gap-3">
        {SIDES.map((side) => (
          <DocumentSlot
            key={side}
            side={side}
            value={images[side]}
            scanning={scanning}
            onChange={(value) =>
              setImages((prev) => ({ ...prev, [side]: value }))
            }
          />
        ))}
      </div>

      {scanning ? (
        <ScanProgress onDone={onVerified} />
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setImages({ front: 'sample', back: 'sample' })}
        >
          <FileImage aria-hidden />
          {t('kyc.document.useSample')}
        </Button>
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
          disabled={!ready || scanning}
          onClick={() => setScanning(true)}
        >
          {scanning ? t('kyc.document.verifying') : t('kyc.document.verify')}
        </Button>
      </div>
    </div>
  )
}

type DocumentSlotProps = {
  side: Side
  value: DocImage
  scanning: boolean
  onChange: (value: DocImage) => void
}

function DocumentSlot({ side, value, scanning, onChange }: DocumentSlotProps) {
  const { t } = useTranslation('auth')
  const previewUrl = useObjectUrl(value instanceof File ? value : null)
  const label = t(`kyc.document.${side}`)

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // cho phép chọn lại đúng file vừa chọn
    if (!file) return
    if (!file.type.startsWith('image/')) {
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
      <label className="relative grid aspect-[8/5] cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed bg-muted/40 transition-colors hover:bg-muted has-disabled:cursor-default has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
        <input
          type="file"
          accept="image/*"
          aria-label={label}
          disabled={scanning}
          onChange={handleFile}
          className="sr-only"
        />
        {value === 'sample' && (
          <SampleIdCard side={side} className="size-full" />
        )}
        {previewUrl && (
          <img
            src={previewUrl}
            alt={label}
            className="size-full object-cover"
          />
        )}
        {value === null && (
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
    </div>
  )
}

// Ảnh chỉ thành URL blob: trong trình duyệt, không upload.
// Đổi ảnh hoặc rời bước (unmount) thì thu hồi URL cũ.
function useObjectUrl(file: File | null) {
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
