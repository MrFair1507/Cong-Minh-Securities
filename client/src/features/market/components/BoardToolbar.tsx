import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/shared/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { EXCHANGES, type Exchange, type MarketSearch } from '../schemas'

const ALL = 'ALL'

type BoardToolbarProps = {
  exchange?: Exchange
  q?: string
  onChange: (patch: Pick<MarketSearch, 'exchange' | 'q'>) => void
}

export function BoardToolbar({ exchange, q, onChange }: BoardToolbarProps) {
  const { t } = useTranslation('market')

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={q ?? ''}
          onChange={(e) => onChange({ q: e.target.value || undefined })}
          placeholder={t('toolbar.search')}
          aria-label={t('toolbar.searchLabel')}
          autoComplete="off"
          maxLength={20}
          className="h-8 w-48 pl-8 uppercase placeholder:normal-case"
        />
      </div>

      <Tabs
        value={exchange ?? ALL}
        onValueChange={(value) =>
          onChange({
            exchange: value === ALL ? undefined : (value as Exchange),
          })
        }
      >
        <TabsList aria-label={t('toolbar.exchangeLabel')}>
          <TabsTrigger value={ALL}>{t('toolbar.all')}</TabsTrigger>
          {EXCHANGES.map((code) => (
            <TabsTrigger key={code} value={code}>
              {code}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
