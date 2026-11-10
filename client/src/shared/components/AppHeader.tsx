import type { Session } from '@supabase/supabase-js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ChartLine,
  ChartPie,
  History,
  LogOut,
  Scale,
  Search,
  User,
  Wallet,
} from 'lucide-react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { profileQueryOptions } from '@/features/auth/api/profile'
import { supabase } from '@/shared/api/supabase'
import { formatMoney } from '@/shared/lib/format'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Input } from '@/shared/ui/input'
import { Logo } from './Logo'

// Menu của sidebar trong Figma, chuyển lên header. Hồ sơ và Đăng xuất nằm trong menu avatar.
const NAV_ITEMS = [
  { to: '/market', key: 'market', icon: ChartLine, guest: true },
  { to: '/orders', key: 'orders', icon: History, guest: false },
  { to: '/portfolio', key: 'portfolio', icon: ChartPie, guest: false },
  { to: '/cash', key: 'cash', icon: Wallet, guest: false },
  { to: '/margin', key: 'margin', icon: Scale, guest: false },
] as const

const SYMBOL_PATTERN = /^[A-Z0-9]{3}$/

export function AppHeader({ session }: { session: Session | null }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const items = NAV_ITEMS.filter((item) => session || item.guest)

  // Gõ mã rồi Enter thì mở trang chi tiết mã
  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const symbol = String(new FormData(form).get('symbol') ?? '')
      .trim()
      .toUpperCase()
    if (!SYMBOL_PATTERN.test(symbol)) return
    form.reset()
    navigate({ to: '/stocks/$symbol', params: { symbol } })
  }

  return (
    <header className="sticky top-0 z-40 h-16 border-b bg-background">
      <div className="mx-auto flex h-full max-w-[1200px] items-center gap-6 px-6">
        <Logo />

        <nav aria-label={t('nav.label')} className="flex items-center gap-1">
          {items.map(({ to, key, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex h-9 items-center gap-2 rounded-md px-3 text-sm leading-5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[status=active]:bg-border data-[status=active]:font-medium data-[status=active]:text-foreground"
            >
              <Icon className="size-4" aria-hidden />
              {t(`nav.${key}`)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-5">
          <search>
            <form onSubmit={handleSearch} className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                name="symbol"
                aria-label={t('header.searchLabel')}
                placeholder={t('header.search')}
                autoComplete="off"
                className="h-9 w-56 rounded-md bg-background pl-9"
              />
            </form>
          </search>

          {session ? (
            <AccountArea session={session} />
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="lg">
                <Link to="/login">{t('header.login')}</Link>
              </Button>
              <Button asChild size="lg">
                <Link to="/register">{t('header.register')}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// Tiền mặt và menu tài khoản, chỉ hiện khi đã đăng nhập
function AccountArea({ session }: { session: Session }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: profile } = useQuery(profileQueryOptions(session.user.id))

  const email = session.user.email ?? ''
  const displayName = profile?.full_name || email
  const initial = (displayName[0] ?? '?').toUpperCase()

  async function handleLogout() {
    await supabase.auth.signOut()
    queryClient.clear()
    navigate({ to: '/market' })
  }

  return (
    <>
      <div className="flex flex-col items-end whitespace-nowrap">
        <span className="text-xs leading-4 text-muted-foreground">
          {t('header.cash')}
        </span>
        <span className="text-sm leading-5 font-semibold tabular-nums">
          {profile ? formatMoney(profile.cash_balance) : '—'}
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t('header.accountMenu')}
            className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Avatar className="size-8">
              <AvatarFallback className="bg-muted text-sm font-semibold text-foreground">
                {initial}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate text-sm font-medium text-foreground">
              {displayName}
            </span>
            {profile?.full_name && (
              <span className="truncate text-xs font-normal text-muted-foreground">
                {email}
              </span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/profile">
              <User aria-hidden />
              {t('nav.profile')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleLogout}>
            <LogOut aria-hidden />
            {t('header.logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
