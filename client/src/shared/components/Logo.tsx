import { Link } from '@tanstack/react-router'
import { TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Dấu và tên sản phẩm, theo khối Logo trong Figma (ô 28px nền primary, icon xu hướng)
export function Logo() {
  const { t } = useTranslation()
  return (
    <Link to="/market" className="flex shrink-0 items-center gap-2.5">
      <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
        <TrendingUp className="size-4" aria-hidden />
      </span>
      <span className="text-base leading-6 font-semibold">{t('appName')}</span>
    </Link>
  )
}
