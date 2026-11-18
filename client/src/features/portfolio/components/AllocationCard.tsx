import { cn } from 'cn'
import { useTranslation } from 'react-i18next'
import { Label, Pie, PieChart } from 'recharts'
import { formatCompact, formatRatio } from '@/shared/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/shared/ui/chart'
import { allocationColor, allocationFill } from '../lib/allocationColors'
import type { AllocationSlice } from '../lib/portfolio'

type AllocationCardProps = {
  slices: AllocationSlice[]
  stockCount: number
  marketValue: number
}

// Biểu đồ vòng tỷ trọng bằng shadcn Chart (Recharts), theo mẫu "Pie Chart - Donut with Text".
export function AllocationCard({
  slices,
  stockCount,
  marketValue,
}: AllocationCardProps) {
  const { t } = useTranslation('portfolio')
  const label = (slice: AllocationSlice) =>
    slice.symbol ?? t('allocation.others', { n: slice.count })

  // ChartConfig: tên hiển thị trong tooltip của từng lát
  const config: ChartConfig = Object.fromEntries(
    slices.map((slice) => [slice.key, { label: label(slice) }]),
  )
  const data = slices.map((slice) => ({
    key: slice.key,
    weight: slice.weight,
    fill: allocationColor(slice.slot),
  }))

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>{t('allocation.title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <ChartContainer config={config} className="mx-auto aspect-square h-45">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  nameKey="key"
                  formatter={(value, name, item) => (
                    <div className="flex w-full items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: item.payload.fill }}
                      />
                      <span className="text-muted-foreground">
                        {config[String(name)]?.label}
                      </span>
                      <span className="ml-auto font-medium tabular-nums">
                        {formatRatio(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Pie
              data={data}
              dataKey="weight"
              nameKey="key"
              startAngle={90} // bắt đầu từ đỉnh, chạy theo chiều kim đồng hồ như Figma
              endAngle={-270}
              innerRadius={56}
              outerRadius={88}
              stroke="var(--card)" // khe hở 2px giữa các lát, cùng màu nền thẻ
              strokeWidth={2}
              isAnimationActive={false} // giá nhảy mỗi 3 giây, tắt hiệu ứng để vòng không giật
            >
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !('cx' in viewBox) || !('cy' in viewBox)) {
                    return null
                  }
                  const cx = viewBox.cx ?? 0
                  const cy = viewBox.cy ?? 0
                  return (
                    <text x={cx} y={cy} textAnchor="middle">
                      <tspan
                        x={cx}
                        y={cy - 4}
                        className="fill-foreground text-base font-semibold"
                      >
                        {t('allocation.count', { n: stockCount })}
                      </tspan>
                      <tspan
                        x={cx}
                        y={cy + 14}
                        className="fill-muted-foreground text-xs"
                      >
                        {formatCompact(marketValue)}
                      </tspan>
                    </text>
                  )
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        {/* Chú thích luôn hiện tên mã và %, để màu không phải là cách duy nhất phân biệt */}
        <ul className="flex flex-col gap-2 text-sm">
          {slices.map((slice) => (
            <li key={slice.key} className="flex items-center gap-2">
              <span
                className={cn(
                  'size-2.5 shrink-0 rounded-sm',
                  allocationFill(slice.slot),
                )}
                aria-hidden
              />
              <span className="font-medium">{label(slice)}</span>
              <span className="ml-auto text-muted-foreground tabular-nums">
                {formatRatio(slice.weight)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
