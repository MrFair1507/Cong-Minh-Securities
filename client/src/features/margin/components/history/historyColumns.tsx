import type { TFunction } from 'i18next'
import { createDataColumnHelper } from '@/shared/components/DataTable'
import {
  formatDate,
  formatDateTime,
  formatRatio,
  formatTime,
} from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import type { MarginCall, MarginEvent } from '../../api/margin'
import { loanCode } from '../../lib/dates'
import { isPackageCode } from '../../lib/packages'

const EVENT_TYPES = [
  'OPEN',
  'SETTINGS',
  'REGISTER_PACKAGE',
  'CANCEL_PACKAGE',
  'RENEW_LOAN',
  'AUTO_RENEW',
] as const
type EventType = (typeof EVENT_TYPES)[number]

function isEventType(value: string): value is EventType {
  return EVENT_TYPES.includes(value as EventType)
}

function TimeCell({ value }: { value: string }) {
  return (
    <div className="flex flex-col tabular-nums">
      <span>{formatDateTime(value)}</span>
      <span className="text-xs text-muted-foreground">{formatTime(value)}</span>
    </div>
  )
}

const callColumn = createDataColumnHelper<MarginCall>()

export function callColumns(t: TFunction<'margin'>) {
  return callColumn.columns([
    callColumn.accessor('created_at', {
      header: t('history.callColumns.time'),
      cell: ({ getValue }) => <TimeCell value={getValue()} />,
    }),
    callColumn.accessor('ratio_at_call', {
      header: t('history.callColumns.ratio'),
      meta: { className: 'text-right' },
      cell: ({ getValue }) => (
        <span className="font-semibold text-danger tabular-nums">
          {formatRatio(getValue())}
        </span>
      ),
    }),
    callColumn.accessor('status', {
      header: t('history.callColumns.status'),
      cell: ({ getValue }) => (
        <Badge
          className={
            getValue() === 'OPEN'
              ? 'bg-danger-bg text-danger'
              : 'bg-muted text-muted-foreground'
          }
        >
          {t(`history.callStatus.${getValue()}`)}
        </Badge>
      ),
    }),
    callColumn.accessor('resolved_at', {
      header: t('history.callColumns.resolvedAt'),
      cell: ({ getValue }) => {
        const value = getValue()
        return value ? <TimeCell value={value} /> : '—'
      },
    }),
  ])
}

const eventColumn = createDataColumnHelper<MarginEvent>()

function eventDetail(event: MarginEvent, t: TFunction<'margin'>): string {
  const onOff = (value: boolean | null) =>
    value ? t('history.on') : t('history.off')
  switch (event.type) {
    case 'OPEN':
    case 'SETTINGS':
      return t('history.settingsDetail', {
        repay: onOff(event.auto_repay),
        renew: onOff(event.auto_renew),
      })
    case 'REGISTER_PACKAGE':
    case 'CANCEL_PACKAGE':
      return isPackageCode(event.package_code)
        ? t('history.packageDetail', {
            name: t(`packages.${event.package_code}.name`),
          })
        : ''
    case 'RENEW_LOAN':
    case 'AUTO_RENEW':
      return t('history.renewDetail', {
        loan: event.margin_loan_id ? loanCode(event.margin_loan_id) : '',
        date: event.due_date ? formatDate(event.due_date) : '',
      })
    default:
      return ''
  }
}

// Lịch sử dịch vụ: mọi thao tác đều duyệt ngay nên trạng thái luôn "Đã duyệt"
export function eventColumns(t: TFunction<'margin'>) {
  return eventColumn.columns([
    eventColumn.accessor('created_at', {
      header: t('history.eventColumns.time'),
      cell: ({ getValue }) => <TimeCell value={getValue()} />,
    }),
    eventColumn.accessor('type', {
      header: t('history.eventColumns.type'),
      cell: ({ getValue }) => {
        const type = getValue()
        return isEventType(type) ? t(`history.eventTypes.${type}`) : type
      },
    }),
    eventColumn.display({
      id: 'detail',
      header: t('history.eventColumns.detail'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {eventDetail(row.original, t)}
        </span>
      ),
    }),
    eventColumn.display({
      id: 'status',
      header: t('history.eventColumns.status'),
      cell: () => (
        <Badge className="bg-safe-bg text-safe">{t('package.approved')}</Badge>
      ),
    }),
  ])
}
