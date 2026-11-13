import type { SortingState } from '@tanstack/react-table'
import { z } from 'zod'

export const EXCHANGES = ['HOSE', 'HNX'] as const
export type Exchange = (typeof EXCHANGES)[number]

export const BOARD_SORTS = [
  'symbol',
  '-symbol',
  'price',
  '-price',
  'change',
  '-change',
  'volume',
  '-volume',
] as const
export type BoardSort = (typeof BOARD_SORTS)[number]

export const marketSearchSchema = z.object({
  exchange: z.enum(EXCHANGES).optional().catch(undefined),
  q: z.string().max(20).optional().catch(undefined),
  sort: z.enum(BOARD_SORTS).optional().catch(undefined),
})

export type MarketSearch = z.infer<typeof marketSearchSchema>

export function sortParamToState(sort: BoardSort | undefined): SortingState {
  if (!sort) return []
  const desc = sort.startsWith('-')
  return [{ id: desc ? sort.slice(1) : sort, desc }]
}

export function sortStateToParam(sorting: SortingState): BoardSort | undefined {
  const first = sorting[0]
  if (!first) return undefined
  const param = `${first.desc ? '-' : ''}${first.id}`
  return BOARD_SORTS.find((s) => s === param)
}
