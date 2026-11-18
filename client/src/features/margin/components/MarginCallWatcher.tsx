import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { Tables } from '@/shared/api/database.types'
import { supabase } from '@/shared/api/supabase'
import { formatRate, formatRatio } from '@/shared/lib/format'
import { type MarginCall, marginCallsQueryOptions } from '../api/margin'
import { useMarginSummary } from '../hooks/useMarginSummary'
import { MarginCallDialog } from './MarginCallDialog'

const SEEN_KEY = 'cms.marginCallSeen' // id cảnh báo đã báo trong phiên trình duyệt này

function readSeen(): number | null {
  try {
    const value = sessionStorage.getItem(SEEN_KEY)
    return value ? Number(value) : null
  } catch {
    return null
  }
}

function writeSeen(id: number) {
  try {
    sessionStorage.setItem(SEEN_KEY, String(id))
  } catch {}
}


export function MarginCallWatcher({ userId }: { userId: string }) {
  const { t } = useTranslation('margin')
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const summary = useMarginSummary(userId)
  const { data: calls } = useQuery(marginCallsQueryOptions(userId))
  const [shown, setShown] = useState<MarginCall | null>(null)

  useEffect(() => {
    const channel = supabase
      .channel(`margin-calls-${crypto.randomUUID()}`)
      .on<Tables<'margin_calls'>>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'margin_calls',
          filter: `user_id=eq.${userId}`,
        },
        ({ eventType, new: row }) => {
          queryClient.invalidateQueries({ queryKey: ['margin'] })
          if (eventType === 'INSERT' && 'id' in row) {
            writeSeen(row.id)
            setShown(row)
          }
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, userId])

  const openCall = calls?.find((call) => call.status === 'OPEN')
  useEffect(() => {
    if (!openCall || readSeen() === openCall.id) return
    writeSeen(openCall.id)
    toast.warning(
      t('call.toastTitle', {
        ratio: formatRatio(openCall.ratio_at_call),
        rate: formatRate(summary.rates.callRate),
      }),
      {
        description: t('call.toastDescription'),
        duration: 10_000,
        action: { label: t('call.view'), onClick: () => setShown(openCall) },
      },
    )
  }, [openCall, summary.rates.callRate, t])

  if (!shown) return null
  return (
    <MarginCallDialog
      call={shown}
      summary={summary}
      onClose={() => setShown(null)}
      onRepay={() => {
        setShown(null)
        navigate({ to: '/margin', search: { repay: true } })
      }}
    />
  )
}
