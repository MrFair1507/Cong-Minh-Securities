import { useTranslation } from 'react-i18next'

const FRONT_LINES = [
  { y: 60, width: 150 },
  { y: 84, width: 110 },
  { y: 108, width: 170 },
  { y: 132, width: 96 },
]
const BACK_LINES = [
  { y: 40, width: 190 },
  { y: 64, width: 150 },
  { y: 88, width: 180 },
]

type SampleIdCardProps = { side: 'front' | 'back'; className?: string }

export function SampleIdCard({ side, className }: SampleIdCardProps) {
  const { t } = useTranslation('auth')

  return (
    <svg viewBox="0 0 320 200" role="img" className={className}>
      <title>{`${t('kyc.sample.title')} · ${t(`kyc.document.${side}`)}`}</title>
      <rect
        x="1"
        y="1"
        width="318"
        height="198"
        rx="12"
        className="fill-info-bg stroke-border"
      />

      {side === 'front' ? (
        <>
          <text
            x="20"
            y="34"
            className="fill-foreground text-[13px] font-semibold"
          >
            {t('kyc.sample.title')}
          </text>
          <rect
            x="20"
            y="52"
            width="76"
            height="96"
            rx="6"
            className="fill-muted"
          />
          <circle cx="58" cy="86" r="16" className="fill-ring" />
          <path d="M30 140 Q58 104 86 140 Z" className="fill-ring" />
          {FRONT_LINES.map(({ y, width }) => (
            <rect
              key={y}
              x="112"
              y={y}
              width={width}
              height="8"
              rx="4"
              className="fill-ring opacity-50"
            />
          ))}
          <text
            x="112"
            y="174"
            className="fill-muted-foreground font-mono text-[13px]"
          >
            999 ••• ••• •••
          </text>
        </>
      ) : (
        <>
          {BACK_LINES.map(({ y, width }) => (
            <rect
              key={y}
              x="20"
              y={y}
              width={width}
              height="8"
              rx="4"
              className="fill-ring opacity-50"
            />
          ))}
          <rect
            x="228"
            y="28"
            width="72"
            height="72"
            rx="6"
            className="fill-muted"
          />
          <text
            x="20"
            y="150"
            className="fill-muted-foreground font-mono text-[11px]"
          >
            {'CMS<<MAU<MO<PHONG<<<<<<<<<<<'}
          </text>
          <text
            x="20"
            y="170"
            className="fill-muted-foreground font-mono text-[11px]"
          >
            {'999<<<<<<<<<<<<<<<<<<<<<<<<<'}
          </text>
        </>
      )}

      <text
        x="160"
        y="112"
        textAnchor="middle"
        transform="rotate(-15 160 100)"
        className="fill-danger text-[26px] font-bold opacity-30"
      >
        {t('kyc.sample.watermark')}
      </text>
    </svg>
  )
}
