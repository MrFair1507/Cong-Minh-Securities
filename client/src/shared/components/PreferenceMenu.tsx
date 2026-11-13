import { Languages, Monitor, Moon, Settings, Sun, SunMoon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'
import { languages } from '@/i18n'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'

const THEMES = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
] as const

// Hai mục con "Giao diện" và "Ngôn ngữ". Dùng chung cho menu avatar và nút cài đặt của khách.
// Theme do next-themes lưu vào localStorage (key cms.theme), ngôn ngữ do i18n lưu (key cms.lang).
export function PreferenceMenuItems() {
  const { t, i18n } = useTranslation()
  const { theme = 'system', setTheme } = useTheme()

  return (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <SunMoon aria-hidden />
          {t('theme.label')}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
            {THEMES.map(({ value, icon: Icon }) => (
              <DropdownMenuRadioItem key={value} value={value}>
                <Icon aria-hidden />
                {t(`theme.${value}`)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Languages aria-hidden />
          {t('language.label')}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup
            value={i18n.resolvedLanguage}
            onValueChange={(lng) => i18n.changeLanguage(lng)}
          >
            {languages.map((lng) => (
              <DropdownMenuRadioItem key={lng} value={lng}>
                {t(`language.${lng}`)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </>
  )
}

// Khách chưa đăng nhập không có avatar: nút bánh răng mở cùng các mục trên
export function PreferenceMenu() {
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={t('header.preferences')}
        >
          <Settings aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <PreferenceMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
