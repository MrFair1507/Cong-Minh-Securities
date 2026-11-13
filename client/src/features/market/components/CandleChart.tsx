import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { formatPrice } from '@/shared/lib/format'
import type { Candle } from '../lib/candles'

// Biểu đồ vẽ trên canvas nên không dùng được var(--...): đọc mã màu hiện tại của theme sáng/tối
function readColors() {
  const style = getComputedStyle(document.documentElement)
  const css = (name: string) => style.getPropertyValue(name).trim()
  return {
    up: css('--price-up'),
    down: css('--price-down'),
    text: css('--muted-foreground'),
    grid: css('--border'),
  }
}

// Token màu giá là mã hex 6 chữ số nên thêm 2 chữ số alpha để cột KL nhạt hơn nến
const VOLUME_ALPHA = '66'

function volumeData(candles: Candle[], colors: ReturnType<typeof readColors>) {
  return candles.map((c) => ({
    time: c.time,
    value: c.volume,
    color: (c.close >= c.open ? colors.up : colors.down) + VOLUME_ALPHA,
  }))
}

type Series = {
  candles: ISeriesApi<'Candlestick'>
  volume: ISeriesApi<'Histogram'>
}

type CandleChartProps = {
  candles: Candle[]
  // Đổi khoảng thời gian thì canh lại cho vừa khung; Realtime cập nhật nến thì giữ nguyên vùng đang xem
  fitKey: string
}

export function CandleChart({ candles, fitKey }: CandleChartProps) {
  const { i18n } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<Series | null>(null)
  const candlesRef = useRef(candles)

  // Tạo biểu đồ một lần khi mount, gỡ khi unmount
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        fontFamily: '"Inter Variable", sans-serif',
      },
      grid: { vertLines: { visible: false } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
      localization: { priceFormatter: formatPrice },
    })
    const candleSeries = chart.addSeries(CandlestickSeries, {
      borderVisible: false,
    })
    // Cột KL nằm ở 20% dưới cùng, trên thang giá riêng (ẩn)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: '',
      lastValueVisible: false,
      priceLineVisible: false,
    })
    chart.priceScale('right').applyOptions({
      scaleMargins: { top: 0.08, bottom: 0.25 },
    })
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })

    function applyTheme() {
      const c = readColors()
      chart.applyOptions({
        layout: { textColor: c.text },
        grid: { horzLines: { color: c.grid } },
      })
      candleSeries.applyOptions({
        upColor: c.up,
        downColor: c.down,
        wickUpColor: c.up,
        wickDownColor: c.down,
      })
      volumeSeries.setData(volumeData(candlesRef.current, c))
    }
    applyTheme()

    // next-themes đổi class "dark" trên <html>: theo dõi để tô lại màu biểu đồ
    const observer = new MutationObserver(applyTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    chartRef.current = chart
    seriesRef.current = { candles: candleSeries, volume: volumeSeries }
    return () => {
      observer.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  // Nhãn ngày tháng theo ngôn ngữ đang chọn
  useEffect(() => {
    chartRef.current?.applyOptions({
      localization: { locale: i18n.language === 'en' ? 'en-US' : 'vi-VN' },
    })
  }, [i18n.language])

  // Nạp dữ liệu mỗi khi nến đổi (đổi khoảng thời gian hoặc Realtime đẩy giá mới)
  useEffect(() => {
    candlesRef.current = candles
    const series = seriesRef.current
    if (!series) return
    series.candles.setData(candles)
    series.volume.setData(volumeData(candles, readColors()))
  }, [candles])

  useEffect(() => {
    if (fitKey) chartRef.current?.timeScale().fitContent()
  }, [fitKey])

  return <div ref={containerRef} className="h-105 w-full" />
}
