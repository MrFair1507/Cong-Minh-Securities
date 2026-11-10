import 'i18next'
import type { defaultNS, resources } from '@/i18n'

// Gõ sai key t('...') thì TypeScript báo lỗi
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS
    resources: (typeof resources)['vi']
  }
}
