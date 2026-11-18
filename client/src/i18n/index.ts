import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enAuth from './en/auth.json'
import enCash from './en/cash.json'
import enCommon from './en/common.json'
import enMargin from './en/margin.json'
import enMarket from './en/market.json'
import enPortfolio from './en/portfolio.json'
import enTrading from './en/trading.json'
import viAuth from './vi/auth.json'
import viCash from './vi/cash.json'
import viCommon from './vi/common.json'
import viMargin from './vi/margin.json'
import viMarket from './vi/market.json'
import viPortfolio from './vi/portfolio.json'
import viTrading from './vi/trading.json'

export const defaultNS = 'common'
export const languages = ['vi', 'en'] as const
export type Language = (typeof languages)[number]

const vi = {
  common: viCommon,
  auth: viAuth,
  market: viMarket,
  trading: viTrading,
  cash: viCash,
  portfolio: viPortfolio,
  margin: viMargin,
}
// satisfies: file tiếng Anh thiếu key nào so với tiếng Việt thì TypeScript báo lỗi
const en = {
  common: enCommon,
  auth: enAuth,
  market: enMarket,
  trading: enTrading,
  cash: enCash,
  portfolio: enPortfolio,
  margin: enMargin,
} satisfies typeof vi

export const resources = { vi, en } as const

const STORAGE_KEY = 'cms.lang'

function savedLanguage(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'vi'
  } catch {
    return 'vi'
  }
}

i18n.use(initReactI18next).init({
  lng: savedLanguage(),
  fallbackLng: 'vi',
  supportedLngs: languages,
  defaultNS,
  resources,
  interpolation: { escapeValue: false },
})

document.documentElement.lang = i18n.language
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {}
})

export default i18n
