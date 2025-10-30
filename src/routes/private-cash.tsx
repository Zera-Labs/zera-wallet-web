import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Clock4, ShieldCheck, Send, Download, LayoutList, PlusSquare } from 'lucide-react'
import PrivateAssetCard from '@/components/PrivateAssetCard'

export const Route = createFileRoute('/private-cash')({
  component: PrivateCashPage,
})

function PrivateCashPage() {
  const initialTiles = React.useMemo(
    () => [
      { id: '1', isFull: true, valueUsd: 6789.56, address: '0x9a7b3c1d4e', minutes: 10 },
      { id: '2', isFull: true, valueUsd: 994123.34, address: '0x1b3c5d7a9e', minutes: 5 },
      { id: '3', isFull: false, valueUsd: 4567.72, address: '0xef8ba9dc20', minutes: 120 },
      { id: '4', isFull: true, valueUsd: 3129.22, address: '0xef8ba9dc20', minutes: 0 },
      { id: '5', isFull: true, valueUsd: 3456.78, address: '0x4f1a2b3c5e', minutes: 0 },
      { id: '6', isFull: true, valueUsd: 800912.34, address: '0x7c1f2e3d9b', minutes: 0 },
      { id: '7', isFull: false, valueUsd: 2345.9, address: '0x0a3b5c7d1e', minutes: 47 },
      { id: '8', isFull: true, valueUsd: 11234.12, address: '0xe4f2a1c3b9', minutes: 0 },
    ],
    []
  )
  const [tiles, setTiles] = React.useState(initialTiles)
  const dragIndex = React.useRef<number | null>(null)
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    dragIndex.current = index
    try {
      e.dataTransfer?.setData('text/plain', String(index))
    } catch {}
    e.dataTransfer.effectAllowed = 'move'
  }

  const moveTile = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return
    setTiles((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(Math.min(to, next.length), 0, item)
      return next
    })
  }

  const handleDropOnIndex = (toIndex: number) => (e: React.DragEvent) => {
    e.preventDefault()
    const from = dragIndex.current ?? Number(e.dataTransfer.getData('text/plain'))
    moveTile(from, toIndex)
    dragIndex.current = null
    setHoverIndex(null)
  }

  const allowDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="px-6 py-6 flex items-center justify-between">
        <h1 className="font-pp-machina text-[24px] font-normal leading-[32px] tracking-[-0.006em] text-[var(--text-primary)]">Private cash</h1>
        <div className="flex items-center gap-4">
          <Button
            variant="greenTint"
            onClick={() => {}}
            className="gap-1.5 text-[var(--brand-green-50)] text-[12px] px-1 py-0.5 h-[40px] rounded-[12px]"
          >
            <Send className="size-6" />
            Deposit
          </Button>
          <Button
            variant="greenTint"
            onClick={() => {}}
            className="gap-1.5 text-[var(--brand-green-50)] text-[12px] px-1 py-0.5 h-[40px] rounded-[12px]"
          >
            <Download className="size-6" />
            Withdraw
          </Button>
        </div>
      </div>

      {/* Top summary cards */}
      <section className="relative px-6 overflow-hidden">
        <div className="w-full grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Offline balance card */}
          <Card variant="darkSolidGrey" className="py-6 px-4 gap-3">
            <CardHeader className="px-0 pb-2">
              <CardTitle className="text-[16px] font-normal flex items-center gap-2 text-[var(--text-tertiary)]">
                <span>Offline balance</span>
                <Badge variant="secondary" className="gap-1.5 text-[var(--brand-green-50)] px-1 py-0.5">USD</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-3">
              <div className="font-pp-machina text-[32px] leading-[32px] tracking-[-0.006em] text-[var(--brand-green-50)]">$354,938.<span className="opacity-60">18</span></div>
              <div className="text-[12px] text-[var(--text-tertiary)]">Available for offline transactions</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[12px] text-[var(--text-tertiary)]">
                  <span>Collateralisation</span>
                  <span>108.5%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-[var(--brand-light-dark-green)] border border-[var(--brand-light-green)]">
                  <div className="h-full bg-[var(--brand-green)]" style={{ width: '100%' }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending transactions card */}
          <Card variant="darkSolidGrey" className="py-6 px-4 gap-3">
            <CardHeader className="px-0 pb-2">
              <CardTitle className="text-[16px] font-normal text-[var(--text-tertiary)]">Pending transactions</CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-3">
              <div className="font-pp-machina text-[32px] leading-[32px] tracking-[-0.006em] text-[var(--brand-green-50)]">7</div>
              <div className="text-[12px] text-[var(--text-tertiary)]">Awaiting settlement</div>
              <div className="flex items-center gap-2 text-[12px] text-[var(--brand-green-50)]">
                <Badge variant="tx" status="pending" className="px-2 py-1">
                  <Clock4 className="mr-1" /> 2h
                </Badge>
                <span className="text-[var(--text-tertiary)]">Last sync</span>
              </div>
            </CardContent>
          </Card>

          {/* Security status card */}
          <Card variant="darkSolidGrey" className="py-6 px-4 gap-3">
            <CardHeader className="px-0 pb-2">
              <CardTitle className="text-[16px] font-normal text-[var(--text-tertiary)]">Security status</CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-3">
              <div className="flex items-center gap-2 text-[16px]">
                <ShieldCheck className="text-[var(--brand-green)]" />
                <span className="text-[var(--brand-green-50)]">Secure</span>
              </div>
              <div className="text-[12px] text-[var(--text-tertiary)]">All proofs verified</div>
              <div>
                <Badge variant="balance" balanceTone="green" className="py-1">128-bit Security</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Bottom: Private assets grid */}
      <section className="px-6 py-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[16px] font-semibold">Private assets</h3>
          <div className="flex items-center gap-3">
            <Button
              variant="greenTint"
              className="gap-1.5 text-[var(--brand-green-50)] text-[12px] px-1 py-0.5 h-[40px] rounded-[12px] w-[44px] justify-center"
              aria-label="Toggle view"
            >
              <LayoutList className="size-6" />
            </Button>
            <Button
              variant="greenTint"
              className="gap-1.5 text-[var(--brand-green-50)] text-[12px] px-1 py-0.5 h-[40px] rounded-[12px]"
            >
              <PlusSquare className="size-6" />
              Add new
            </Button>
            <Button
              variant="greenTint"
              className="gap-1.5 text-[var(--brand-green-50)] text-[12px] px-1 py-0.5 h-[40px] rounded-[12px]"
            >
              <Download className="size-6" />
              Redeem
            </Button>
          </div>
        </div>
        <Card variant="darkSolidGrey" className="py-4 px-4">
          <div className="flex flex-wrap gap-4">
            {tiles.map((t, index) => (
              <div
                key={t.id}
                draggable
                onDragStart={handleDragStart(index)}
                onDragOver={allowDrop}
                onDrop={handleDropOnIndex(index)}
                onDragEnter={() => setHoverIndex(index)}
                onDragLeave={(e) => {
                  // Only clear when leaving the tile container
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setHoverIndex((i) => (i === index ? null : i))
                }}
                className="relative cursor-move"
              >
                <PrivateAssetCard
                  isFull={t.isFull}
                  valueUsd={t.valueUsd}
                  contractAddress={t.address}
                  minutesSinceSync={t.minutes}
                />
                {hoverIndex === index ? (
                  <div className="pointer-events-none absolute inset-0 rounded-[22px] ring-2 ring-[var(--brand-light-green)]/80 shadow-[0_0_8px_0_#52C97D40]" />
                ) : null}
              </div>
            ))}
            {/* Drag-n-drop dashed target */}
            <div
              onDragOver={allowDrop}
              onDrop={handleDropOnIndex(tiles.length)}
              onDragEnter={() => setHoverIndex(tiles.length)}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setHoverIndex((i) => (i === tiles.length ? null : i))
              }}
              className="relative w-[186px] h-[158px] grid place-items-center gap-4 text-[var(--text-tertiary)]"
            >
              <svg className="absolute inset-0 pointer-events-none" width="186" height="158" viewBox="0 0 186 158">
                <rect x="0.5" y="0.5" width="185" height="157" rx="18" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="8 8" />
              </svg>
              <div className="flex items-center gap-4 opacity-60">
                <span>drag-n-drop</span>
                <Badge variant="secondary">ZKP</Badge>
              </div>
              {hoverIndex === tiles.length ? (
                <div className="pointer-events-none absolute inset-0 rounded-[18px] ring-2 ring-[var(--brand-light-green)]/80 shadow-[0_0_8px_0_#52C97D40]" />
              ) : null}
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}


