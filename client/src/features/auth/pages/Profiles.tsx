import { useSuspenseQuery } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/shared/components/PageHeader'
import { formatDate, formatDateTime, formatMoney } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { profileQueryOptions } from '../api/profile'

const EMPTY = '–'

type InfoRow = { label: string; value: ReactNode }

function InfoCard({
  title,
  description,
  rows,
}: {
  title: string
  description: string
  rows: InfoRow[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-3">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4"
            >
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="text-right font-medium tabular-nums">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

// Hồ sơ chỉ đọc. Sửa tên và đặt lại tiền ảo cần RPC ghi DB (tuần 2).
export function ProfilePage() {
  const { t } = useTranslation('auth')
  const { t: tCommon } = useTranslation()
  const { session } = useRouteContext({ from: '/_app/_authed/profile' })
  const { data: profile } = useSuspenseQuery(
    profileQueryOptions(session.user.id),
  )

  const date = (value: string | null) => (value ? formatDate(value) : EMPTY)

  const account: InfoRow[] = [
    { label: t('fields.fullName'), value: profile.full_name || EMPTY },
    { label: t('fields.email'), value: session.user.email ?? EMPTY },
    { label: t('fields.phone'), value: profile.phone ?? EMPTY },
    { label: t('profile.accountNo'), value: profile.account_no },
    {
      label: t('profile.openedOn'),
      value: formatDateTime(profile.created_at),
    },
    { label: t('profile.cash'), value: formatMoney(profile.cash_balance) },
  ]

  const identity: InfoRow[] = [
    { label: t('kyc.confirm.idNumber'), value: profile.id_number ?? EMPTY },
    { label: t('kyc.confirm.dateOfBirth'), value: date(profile.date_of_birth) },
    {
      label: t('kyc.confirm.gender'),
      value:
        profile.gender === 'MALE' || profile.gender === 'FEMALE'
          ? t(`kyc.gender.${profile.gender}`)
          : EMPTY,
    },
    { label: t('kyc.confirm.issuedOn'), value: date(profile.id_issued_on) },
    {
      label: t('profile.kycStatus'),
      value: profile.kyc_verified_at ? (
        <Badge className="bg-safe-bg text-safe">
          {t('profile.kycVerified', {
            date: formatDateTime(profile.kyc_verified_at),
          })}
        </Badge>
      ) : (
        <Badge variant="outline">{t('profile.kycMissing')}</Badge>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={tCommon('pages.profile.title')}
        description={tCommon('pages.profile.description')}
      />
      <div className="grid grid-cols-2 items-start gap-4">
        <InfoCard
          title={t('profile.account.title')}
          description={t('profile.account.description')}
          rows={account}
        />
        <InfoCard
          title={t('profile.identity.title')}
          description={t('profile.identity.description')}
          rows={identity}
        />
      </div>
    </div>
  )
}
