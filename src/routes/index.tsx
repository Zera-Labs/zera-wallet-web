import * as React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAssets } from '@/hooks/useAssets'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import PerformanceChart from '@/components/PerformanceChart'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff, Send, Download } from 'lucide-react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import AssetRow from '@/components/AssetRow'
import TransfersModal from '@/components/TransfersModal'
import { usePriceSocket } from '@/hooks/usePriceSocket'
import { useTokenFeed } from '@/stores/tokenFeed'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const navigate = useNavigate()
  const { data: assets = [], isLoading } = useAssets()
  
  const mints = React.useMemo(() => Array.from(new Set((assets ?? []).map((a) => a.mint).filter(Boolean))), [assets])
  const pricesByMint = usePriceSocket(mints)
  React.useEffect(() => {
    const { setToken } = useTokenFeed.getState()
    for (const [mint, data] of Object.entries(pricesByMint)) {
      
      if (data.summary['24h']?.last_price_usd_change) {
        setToken(mint, data)
      } else {
        setToken(mint, data)
      }
    }
  }, [pricesByMint])
  const [isTransferOpen, setIsTransferOpen] = React.useState(false)
  const [transferMode, setTransferMode] = React.useState<'send' | 'receive'>('send')
  const [isHidden, setIsHidden] = React.useState(false)
  
  // Compute portfolio composition by category (ZERA, ETH, SOL, Other) using live prices when available.
  const composition = React.useMemo(() => {
    if (!assets?.length) {
      return { items: [], total: 0 }
    }

    const getAssetValueUsd = (a: (typeof assets)[number]): number => {
      const livePrice = pricesByMint?.[a.mint]?.summary?.price_usd
      const price = typeof livePrice === 'number' ? livePrice : a.price
      return price * a.amount
    }

    const sumBy = (symbol: string) => assets
      .filter((a) => a.symbol.toUpperCase() === symbol)
      .reduce((s, a) => s + getAssetValueUsd(a), 0)

    const zera = sumBy('ZERA')
    const eth = sumBy('ETH')
    const sol = sumBy('SOL')
    const knownTotal = zera + eth + sol
    const overallTotal = assets.reduce((s, a) => s + getAssetValueUsd(a), 0)
    const other = Math.max(0, overallTotal - knownTotal)

    const items = [
      { key: 'ZERA', label: 'ZERA', value: zera, color: 'var(--brand-green-500)' },
      { key: 'ETH', label: 'ETH', value: eth, color: 'var(--vb-500)' },
      { key: 'SOL', label: 'SOL', value: sol, color: 'var(--cpink-500)' },
      { key: 'Other', label: 'Other', value: other, color: 'var(--corange-500)' },
    ].filter((c) => c.value > 0)

    const sorted = items.sort((a, b) => b.value - a.value)
    return { items: sorted, total: overallTotal }
  }, [assets, pricesByMint])

  const totalDisplay = React.useMemo(() => {
    return composition.total || 0
  }, [composition.total])

  const onClickAsset = (mint: string) => {
    if (mint !== 'so11111111111111111111111111111111111111112') {
      navigate({ to: (`/tokens/${mint}` as any) })
    } else {
      navigate({ to: (`/tokens/sol11111111111111111111111111111111111111112` as any) })
    }
  }

  return (
    <div className="min-h-screen">
      <div className="px-6 py-6 flex items-center justify-between">
        <h1 className="font-pp-machina text-[24px] font-normal leading-[32px] tracking-[-0.006em] leading-trim-cap text-[var(--text-primary)]">Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button
            variant="greenTint"
            onClick={() => {
              setTransferMode('send')
              setIsTransferOpen(true)
            }}
            className="gap-1.5 text-[var(--brand-green-50)] text-[12px] px-1 py-0.5 h-[40px] rounded-[12px]"
          >
            <Send className="size-6" />
            Send
          </Button>
          <Button
            variant="greenTint"
            onClick={() => {
              setTransferMode('receive')
              setIsTransferOpen(true)
            }}
            className="gap-1.5 text-[var(--brand-green-50)] text-[12px] px-1 py-0.5 h-[40px] rounded-[12px]"
          >
            <Download className="size-6" />
            Receive
          </Button>
        </div>
      </div>
      <section className="relative px-6 overflow-hidden">
        <div className="w-full flex flex-col md:flex-row gap-6">
          <Card variant="darkSolidGrey" className="h-[224px] py-6 px-4 w-full md:basis-1/2 gap-0">
            <CardHeader className="px-0">
              <CardTitle className="text-[16px] font-normal flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-[var(--text-tertiary)]">Balance</div>
                  <Badge variant="secondary" className="gap-1.5 text-[var(--brand-green-50)] px-1 py-0.5">
                    USD
                  </Badge>
                </div>
                <Button
                  type="button"
                  aria-label={isHidden ? 'Show balance' : 'Hide balance'}
                  onClick={() => setIsHidden((v) => !v)}
                  variant="icon"
                  size="icon-44"
                  className="bg-transparent opacity-50"
                >
                  {isHidden ? <EyeOff className="size-6" /> : <Eye className="size-6" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {isHidden ? (
                <div className="flex items-center justify-center h-[152px] text-foreground/50">
                  hidden
                </div>
              ) : (
                <div className="px-2 space-y-3">
                  <div className="space-y-1">
                    <div className={"font-pp-machina text-[32px] leading-[32px] tracking-[-0.006em] leading-trim-cap text-[var(--brand-green-50)]"}>
                      {`$${totalDisplay.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                    </div>
                    {/* {(() => {
                      const changeUsd = upnl24h.changeUsd
                      const prevMvIncluded = upnl24h.prevMarketValueUsdIncluded
                      const changePct = prevMvIncluded > 0 ? (changeUsd / prevMvIncluded) * 100 : 0
                      const positive = changeUsd >= 0
                      return (
                        <Badge variant="balance" balanceTone={positive ? 'green' : 'red'} className="py-0.5">
                          {positive ? <ArrowUp /> : <ArrowDown />}
                          {`$${Math.abs(changeUsd).toLocaleString(undefined, { maximumFractionDigits: 2 })}${prevMvIncluded > 0 ? ` (${Math.abs(changePct).toFixed(1)}%)` : ''}`}
                        </Badge>
                      )
                    })()} */}
                  </div>
                    <div className="w-full h-2 rounded-full overflow-hidden bg-[var(--brand-light-dark-green)] border border-[var(--brand-light-green)]">
                      <div className="flex w-full h-full">
                        {composition.items.map((c) => {
                          const pct = composition.total > 0 ? (c.value / composition.total) * 100 : 0
                          return (
                            <div
                              key={c.key}
                              className="h-full"
                              style={{ width: `${pct}%`, backgroundColor: c.color }}
                            />
                          )
                        })}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-[var(--text-tertiary)]">
                      {composition.items.map((c) => {
                        const pct = composition.total > 0 ? Math.round((c.value / composition.total) * 100) : 0
                        return (
                          <div key={`legend-${c.key}`} className="flex items-center gap-2">
                            <span className="inline-block size-3 rounded-[2px]" style={{ backgroundColor: c.color }} />
                            <span className="text-foreground/80">{c.label}</span>
                            <span className="text-foreground/50">{`${pct}%`}</span>
                          </div>
                        )
                      })}
                    </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card variant="darkSolidGrey" className="h-[224px] py-6 px-4 w-full md:basis-1/2">
            <PerformanceChart />
          </Card>
        </div>
      </section>

      <section className="px-6 py-6 mx-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Assets</h2>
          </div>
          <Table className="text-[15px]">
            <colgroup>
              <col className="w-[38%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[18%]" />
              <col className="w-[16%]" />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>24hr %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell className="py-6" colSpan={6}>Loading...</TableCell>
                </TableRow>
              ) : (
                assets.map((a) => (
                  <AssetRow key={a.id} asset={a as any} onOpen={() => onClickAsset(a.mint)} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
      <TransfersModal open={isTransferOpen} onOpenChange={setIsTransferOpen} initialMode={transferMode} key={transferMode} />
    </div>
  )
}
