import { Link } from '@tanstack/react-router'
import { Check, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const FEATURES = ['feature1', 'feature2', 'feature3'] as const

export function AuthBrandPanel() {
  const { t } = useTranslation('auth')
  const { t: tc } = useTranslation()

  // Cột thương hiệu lệch nền một bậc so với cột form + viền phải (sáng: muted, tối: card).
  // Rộng 520px để màn 1024px vẫn đủ chỗ cho form 380px.
  return (
    <aside className="flex w-130 shrink-0 flex-col gap-12 border-r bg-muted p-12 dark:bg-card">
      <Link to="/market" className="flex items-center gap-2.5">
        <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
          <TrendingUp className="size-4" aria-hidden />
        </span>
        <span className="text-base leading-6 font-semibold">
          {tc('appName')}
        </span>
      </Link>

      <div className="my-auto flex flex-col gap-5">
        <p className="text-[32px] leading-10 font-semibold">
          {t('brand.headline')}
        </p>
        <ul className="flex flex-col gap-5">
          {FEATURES.map((key) => (
            <li
              key={key}
              className="flex items-center gap-2.5 text-sm text-foreground/80"
            >
              <Check className="size-4 text-safe" aria-hidden />
              {t(`brand.${key}`)}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
