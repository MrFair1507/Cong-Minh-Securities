import { useSuspenseQuery } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'
import { BadgeCheck, KeyRound } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/shared/components/PageHeader'
import { formatDate, formatDateTime } from '@/shared/lib/format'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { profileQueryOptions } from '../api/profile'
import { ChangePasswordDialog } from '../components/profile/ChangePasswordDialog'

const EMPTY = '–'

type Row = { label: string; value: ReactNode }

// Nhãn trái, giá trị phải, mỗi dòng một thông tin
function InfoList({ rows }: { rows: Row[] }) {
  return (
    <dl className="divide-y">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between gap-6 py-3 first:pt-0 last:pb-0"
        >
          <dt className="shrink-0 text-sm text-muted-foreground">
            {row.label}
          </dt>
          <dd className="min-w-0 truncate text-right text-sm font-medium tabular-nums">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children?: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <CardAction className="self-center">{action}</CardAction>}
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  )
}

// Thông tin chỉ đọc: họ tên và giấy tờ khóa theo eKYC (DB không cho client sửa)
export function ProfilePage() {
  const { t } = useTranslation('auth')
  const { t: tCommon } = useTranslation()
  const { session } = useRouteContext({ from: '/_app/_authed/profile' })
  const { data: profile } = useSuspenseQuery(
    profileQueryOptions(session.user.id),
  )
  const [passwordOpen, setPasswordOpen] = useState(false)

  const email = session.user.email ?? ''
  const name = profile.full_name || email
  const initial = (name[0] ?? '?').toUpperCase() // giống avatar trên header
  const date = (value: string | null) => (value ? formatDate(value) : EMPTY)
  const gender =
    profile.gender === 'MALE' || profile.gender === 'FEMALE'
      ? t(`kyc.gender.${profile.gender}`)
      : EMPTY

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={tCommon('pages.profile.title')}
        description={tCommon('pages.profile.description')}
      />

      <div className="grid grid-cols-[300px_1fr] items-start gap-4">
        {/* Thẻ tóm tắt */}
        <Card>
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <Avatar className="size-16">
              <AvatarFallback className="text-2xl font-semibold text-foreground">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="flex w-full min-w-0 flex-col gap-1">
              <p className="truncate text-lg leading-6 font-semibold">{name}</p>
              <p className="truncate text-sm text-muted-foreground">{email}</p>
            </div>
            {profile.kyc_verified_at ? (
              <Badge className="bg-safe-bg text-safe">
                <BadgeCheck />
                {t('profile.kycVerified')}
              </Badge>
            ) : (
              <Badge variant="outline">{t('profile.kycMissing')}</Badge>
            )}
          </CardContent>
          <CardContent className="border-t pt-4">
            <InfoList
              rows={[
                { label: t('profile.accountNo'), value: profile.account_no },
                {
                  label: t('profile.openedOn'),
                  value: formatDateTime(profile.created_at),
                },
              ]}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <SectionCard
            title={t('profile.info.title')}
            description={t('profile.info.description')}
          >
            <InfoList
              rows={[
                {
                  label: t('fields.fullName'),
                  value: profile.full_name || EMPTY,
                },
                {
                  label: t('kyc.confirm.dateOfBirth'),
                  value: date(profile.date_of_birth),
                },
                { label: t('kyc.confirm.gender'), value: gender },
                { label: t('fields.phone'), value: profile.phone ?? EMPTY },
                { label: t('fields.email'), value: email || EMPTY },
              ]}
            />
          </SectionCard>

          <SectionCard title={t('profile.identity.title')}>
            <InfoList
              rows={[
                {
                  label: t('kyc.confirm.idNumber'),
                  value: profile.id_number ?? EMPTY,
                },
                {
                  label: t('kyc.confirm.issuedOn'),
                  value: date(profile.id_issued_on),
                },
                {
                  label: t('profile.identity.verifiedOn'),
                  value: profile.kyc_verified_at
                    ? formatDateTime(profile.kyc_verified_at)
                    : EMPTY,
                },
              ]}
            />
          </SectionCard>

          <SectionCard
            title={t('profile.security.title')}
            description={t('profile.security.description')}
            action={
              <Button variant="outline" onClick={() => setPasswordOpen(true)}>
                <KeyRound />
                {t('profile.password.title')}
              </Button>
            }
          />
        </div>
      </div>

      <ChangePasswordDialog
        email={email}
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
      />
    </div>
  )
}
