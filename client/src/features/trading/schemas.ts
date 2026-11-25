import type { OrderSide } from '@cms/shared/trading'
import type { TFunction } from 'i18next'
import { z } from 'zod'
import { LOT_SIZE } from '@/shared/constants/market'
import { isLotQuantity, parseQuantity } from './lib/order'

export const ORDER_SIDES = ['BUY', 'SELL'] as const satisfies OrderSide[]

export const orderFormSchema = (t: TFunction<'trading'>) =>
  z.object({
    quantity: z
      .string()
      .trim()
      .min(1, t('errors.quantityRequired'))
      .refine(
        (value) => isLotQuantity(parseQuantity(value)),
        t('errors.quantityLot', { lot: LOT_SIZE }),
      ),
  })

export type OrderFormValues = z.infer<ReturnType<typeof orderFormSchema>>

// /orders?side=BUY&symbol=FPT
export const ordersSearchSchema = z.object({
  side: z.enum(ORDER_SIDES).optional().catch(undefined),
  symbol: z.string().max(20).optional().catch(undefined),
})

export type OrdersSearch = z.infer<typeof ordersSearchSchema>
