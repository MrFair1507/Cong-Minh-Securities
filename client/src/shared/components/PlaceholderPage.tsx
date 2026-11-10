import { useTranslation } from 'react-i18next'
import { PageHeader } from './PageHeader'

export type PageKey =
  | 'market'
  | 'stock'
  | 'orders'
  | 'portfolio'
  | 'cash'
  | 'margin'
  | 'profile'
  | 'login'
  | 'register'

// Trang tạm cho các route chưa làm, để menu không dẫn vào trang trắng
export function PlaceholderPage({
  page,
  title,
}: {
  page: PageKey
  title?: string
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={title ?? t(`pages.${page}.title`)}
        description={t(`pages.${page}.description`)}
      />
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        {t('placeholder')}
      </div>
    </div>
  )
}
