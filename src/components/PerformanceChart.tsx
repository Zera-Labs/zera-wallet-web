import * as React from 'react'
import { IChartApi, ISeriesApi, UTCTimestamp, ColorType } from 'lightweight-charts'
import { Badge } from './ui/badge'

export default function PerformanceChart() {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const chartRef = React.useRef<IChartApi | null>(null)
  const seriesRef = React.useRef<ISeriesApi<'Area'> | null>(null)
  const [range, setRange] = React.useState<'24H' | '1W' | '1M'>('24H')

  function generateData(kind: '24H' | '1W' | '1M') {
    const now = Math.floor(Date.now() / 1000)
    let step: number
    let points: number
    if (kind === '24H') { step = 60 * 60; points = 24 }
    else if (kind === '1W') { step = 24 * 60 * 60; points = 7 }
    else { step = 24 * 60 * 60; points = 30 }

    const start = now - step * (points - 1)
    const data: Array<{ time: UTCTimestamp, value: number }> = []
    let v = 100
    for (let i = 0; i < points; i++) {
      const t = (start + i * step) as UTCTimestamp
      // simple bounded random walk
      const pct = (Math.random() - 0.5) * 0.02
      v = Math.max(1, v * (1 + pct))
      data.push({ time: t, value: Number(v.toFixed(2)) })
    }
    return data
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
        timeScale: { borderVisible: false, fixLeftEdge: true, fixRightEdge: true },
        grid: { horzLines: { visible: true }, vertLines: { visible: false } },
        autoSize: true,
      })

      const area = chart.addSeries(AreaSeries, {
        lineColor: '#97dfb1',
        topColor: '#97dfb1',
        bottomColor: 'transparent',
      })
      seriesRef.current = area
      chartRef.current = chart

      // initial dataset
      area.setData(generateData(range))
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
    seriesRef.current.setData(generateData(range))
    chartRef.current.timeScale().fitContent()
  }, [range])

  return (
    <div className="w-full h-[244px]">
      <div className="flex h-[44px] justify-between items-center">
        <div className="flex items-center justify-between">
            Performance
            <Badge variant="secondary" className="ml-2">USD</Badge>
        </div>
        <div className="mb-2 flex gap-2">
            <button className={`px-3 py-1 rounded-md ${range === '24H' ? 'bg-[var(--brand-green)] text-black' : 'bg-white/10'}`} onClick={() => setRange('24H')}>24H</button>
            <button className={`px-3 py-1 rounded-md ${range === '1W' ? 'bg-[var(--brand-green)] text-black' : 'bg-white/10'}`} onClick={() => setRange('1W')}>1W</button>
            <button className={`px-3 py-1 rounded-md ${range === '1M' ? 'bg-[var(--brand-green)] text-black' : 'bg-white/10'}`} onClick={() => setRange('1M')}>1M</button>
        </div>
      </div>
      <div ref={containerRef} className="h-[150px] w-full" />
    </div>
  )
}


