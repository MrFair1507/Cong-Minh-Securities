import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DataTable } from '@/shared/components/DataTable'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import type { MarginCall, MarginEvent } from '../../api/margin'
import { callColumns, eventColumns } from './historyColumns'

// Tab Lịch sử: chọn giữa cảnh báo ký quỹ và lịch sử dịch vụ
export function HistoryTab({
  calls,
  events,
}: {
  calls: MarginCall[]
  events: MarginEvent[]
}) {
  const { t } = useTranslation('margin')
  const [view, setView] = useState<'calls' | 'events'>('calls')
  const calls_ = useMemo(() => callColumns(t), [t])
  const events_ = useMemo(() => eventColumns(t), [t])

  return (
    <div className="flex flex-col gap-3">
      <Tabs
        value={view}
        onValueChange={(value) => setView(value as 'calls' | 'events')}
      >
        <TabsList>
          <TabsTrigger value="calls">{t('history.calls')}</TabsTrigger>
          <TabsTrigger value="events">{t('history.events')}</TabsTrigger>
        </TabsList>
      </Tabs>
      {view === 'calls' ? (
        <DataTable
          columns={calls_}
          data={calls}
          getRowId={(call) => String(call.id)}
          empty={t('history.callsEmpty')}
        />
      ) : (
        <DataTable
          columns={events_}
          data={events}
          getRowId={(event) => String(event.id)}
          empty={t('history.eventsEmpty')}
        />
      )}
    </div>
  )
}
