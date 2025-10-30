import * as React from 'react'
import { IChartApi, ISeriesApi, UTCTimestamp, ColorType } from 'lightweight-charts'
import { Badge } from './ui/badge'

interface PerformanceChartProps {
  chartHeight?: number
  className?: string
  showHeader?: boolean
  title?: string
  currencyBadge?: string
  data?: Array<{ time: UTCTimestamp; value: number }>
  currentPrice?: number
  note?: string
}

export default function PerformanceChart({
  chartHeight = 150,
  className,
  showHeader = true,
  title = 'Performance',
  currencyBadge = 'USD',
  data,
  currentPrice,
  note,
}: PerformanceChartProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const chartRef = React.useRef<IChartApi | null>(null)
  const seriesRef = React.useRef<ISeriesApi<'Area'> | null>(null)
  const boundsSeriesRef = React.useRef<ISeriesApi<'Area'> | null>(null)
  const nowRef = React.useRef<number | null>(null)

  function isBusinessDay(t: unknown): t is { year: number; month: number; day: number } {
    return !!t && typeof t === 'object' && 'year' in t && 'month' in t && 'day' in t
  }
  

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let disposed = false
    let ro: ResizeObserver | undefined

    ;(async () => {
      const { createChart, AreaSeries } = await import('lightweight-charts')

      if (disposed) return

      const chart = createChart(container, {
        layout: {
          textColor: '#EEFAF2',
          background: { type: ColorType.Solid, color: 'transparent' },
        },
        rightPriceScale: { visible: true, borderVisible: false },
        timeScale: {
          borderVisible: false,
          fixLeftEdge: true,
          fixRightEdge: true,
          tickMarkFormatter: (time: unknown) => {
            const tSec = (typeof time === 'number')
              ? time
              : isBusinessDay(time)
                ? Date.UTC(time.year, time.month - 1, time.day) / 1000
                : NaN
            const nowSec = nowRef.current
            if (!Number.isFinite(tSec) || nowSec == null) return ''
            const dt = Math.max(0, Math.round(nowSec - tSec))
            const anchors: Array<[number, string]> = [
              [24 * 60 * 60, '24h'],
              [6 * 60 * 60, '6h'],
              [60 * 60, '1h'],
              [30 * 60, '30m'],
              [15 * 60, '15m'],
              [5 * 60, '5m'],
              [60, '1m'],
            ]
            let best: { d: number; label: string } | null = null
            for (const [sec, label] of anchors) {
              const diff = Math.abs(dt - sec)
              if (!best || diff < best.d) best = { d: diff, label }
            }
            if (!best) return ''
            const tolerance = Math.max(5, Math.floor((best.label.endsWith('m') ? 10 : 300)))
            return best.d <= tolerance ? best.label : ''
          },
        },
        grid: { horzLines: { visible: true }, vertLines: { visible: false } },
        autoSize: true,
      })

      const area = chart.addSeries(AreaSeries, {
        lineColor: '#97dfb1',
        topColor: '#97dfb1',
        bottomColor: 'transparent',
        priceFormat: { type: 'price', precision: 5, minMove: 0.00001 },
      })
      const bounds = chart.addSeries(AreaSeries, {
        lineColor: 'transparent',
        topColor: 'transparent',
        bottomColor: 'transparent',
        priceFormat: { type: 'price', precision: 5, minMove: 0.00001 },
      })
      seriesRef.current = area
      boundsSeriesRef.current = bounds
      chartRef.current = chart

      // initial dataset (no synthetic fallback)
      area.setData(data ?? [])
      if (data && data.length) {
        const last = data[data.length - 1]
        if (typeof last.time === 'number') nowRef.current = last.time as number
      }
      // initial bounds if possible
      if (data && data.length && currentPrice != null) {
        const firstTime = data[0].time
        const lastTime = data[data.length - 1].time
        let maxDelta = 0
        for (const p of data) {
          const d = Math.abs(p.value - currentPrice)
          if (d > maxDelta) maxDelta = d
        }
        if (maxDelta > 0) {
          bounds.setData([
            { time: firstTime, value: currentPrice - maxDelta },
            { time: lastTime, value: currentPrice + maxDelta },
          ])
        }
      }
      chart.timeScale().fitContent()

      ro = new ResizeObserver(() => {
        chart.applyOptions({ autoSize: true })
      })
      ro.observe(container)
    })()

    return () => {
      disposed = true
      if (ro) ro.disconnect()
      if (chartRef.current) chartRef.current.remove()
      chartRef.current = null
    }
  }, [])

  React.useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return
    seriesRef.current.setData(data ?? [])
    if (data && data.length) {
      const last = data[data.length - 1]
      if (typeof last.time === 'number') nowRef.current = last.time as number
    } else {
      nowRef.current = null
    }
    chartRef.current.timeScale().fitContent()
  }, [data])

  React.useEffect(() => {
    if (!boundsSeriesRef.current) return
    if (!currentPrice || !data || data.length === 0) {
      boundsSeriesRef.current?.setData([])
      return
    }
    const firstTime = data[0].time
    const lastTime = data[data.length - 1].time
    let maxDelta = 0
    for (const p of data) {
      const d = Math.abs(p.value - currentPrice)
      if (d > maxDelta) maxDelta = d
    }
    if (maxDelta > 0) {
      boundsSeriesRef.current.setData([
        { time: firstTime, value: currentPrice - maxDelta },
        { time: lastTime, value: currentPrice + maxDelta },
      ])
    } else {
      boundsSeriesRef.current.setData([])
    }
  }, [currentPrice, data])

  return (
    <div className={className ?? ''}>
      {showHeader ? (
        <div className="flex h-[44px] justify-between items-center">
          <div className="flex items-center justify-between">
              {title}
              <Badge variant="secondary" className="ml-2">{currencyBadge}</Badge>
              {note ? (
                <span className="ml-2 text-[12px] text-[var(--text-tertiary)]">{note}</span>
              ) : null}
          </div>
        </div>
      ) : null}
      <div ref={containerRef} className="w-full" style={{ height: chartHeight }} />
    </div>
  )
}


