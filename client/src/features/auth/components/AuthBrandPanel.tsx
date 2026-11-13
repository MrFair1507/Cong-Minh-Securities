import { Link } from '@tanstack/react-router'
import { Check, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const FEATURES = ['feature1', 'feature2', 'feature3'] as const

export function AuthBrandPanel() {
  const { t } = useTranslation('auth')
  const { t: tc } = useTranslation()

  // Cột thương hiệu luôn nền tối ở cả 2 theme, nên dùng màu zinc cố định thay vì token
  return (
    <aside className="flex w-[640px] shrink-0 flex-col justify-between bg-zinc-900 p-12 text-zinc-50 dark:border-r dark:border-border">
      <Link to="/market" className="flex items-center gap-2.5">
        <span className="grid size-7 place-items-center rounded-md bg-zinc-50 text-zinc-900">
          <TrendingUp className="size-4" aria-hidden />
        </span>
        <span className="text-base leading-6 font-semibold">
          {tc('appName')}
        </span>
      </Link>

      <div className="flex flex-col gap-5">
        <p className="text-[32px] leading-10 font-semibold">
          {t('brand.headline')}
        </p>
        <ul className="flex flex-col gap-5">
          {FEATURES.map((key) => (
            <li
              key={key}
              className="flex items-center gap-2.5 text-sm text-zinc-200"
            >
              <Check className="size-4 text-safe" aria-hidden />
              {t(`brand.${key}`)}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-zinc-400">{t('brand.footer')}</p>
    </aside>
  )
}
