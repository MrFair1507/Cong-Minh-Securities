import { DEFAULT_RATES, MAX_RENEWALS } from '@cms/shared/margin'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { formatRate } from '@/shared/lib/format'
import { marginPackagesQueryOptions } from '../../api/margin'

// Tham số mô phỏng hiện ở thẻ kích hoạt và hộp thoại mở tài khoản (lãi, hạn lấy từ gói Cơ bản)
export function useActivationParams() {
  const { t } = useTranslation('margin')
  const { data: packages = [] } = useQuery(marginPackagesQueryOptions())
  const basic = packages.find((pkg) => pkg.code === 'BASIC')

  return [
    {
      label: t('activation.initialRate'),
      value: formatRate(DEFAULT_RATES.initialRate),
    },
    {
      label: t('activation.callRate'),
      value: formatRate(DEFAULT_RATES.callRate),
    },
    {
      label: t('activation.maintenanceRate'),
      value: formatRate(DEFAULT_RATES.maintenanceRate),
    },
    {
      label: t('activation.interest'),
      value:
        basic?.rate != null
          ? t('package.yearRate', { rate: formatRate(basic.rate) })
          : '–',
    },
    {
      label: t('activation.term'),
      value: t('activation.termValue', {
        days: basic?.termDays ?? 90,
        count: MAX_RENEWALS,
      }),
    },
    { label: t('activation.power'), value: t('activation.powerValue') },
  ]
}
