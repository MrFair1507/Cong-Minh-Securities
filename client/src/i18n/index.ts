import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import common from './vi/common.json'

// Chỉ tiếng Việt, nhưng mọi chữ trên giao diện vẫn đi qua key để sau này thêm ngôn ngữ dễ.
export const defaultNS = 'common'
export const resources = {
  vi: { common },
} as const

i18n.use(initReactI18next).init({
  lng: 'vi',
  fallbackLng: 'vi',
  defaultNS,
  resources,
  interpolation: { escapeValue: false }, // React đã tự escape
})

export default i18n
