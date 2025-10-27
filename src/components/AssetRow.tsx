import { useEffect } from 'react'
import { CircleHelp } from 'lucide-react'
import { TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ensureFeed, releaseFeed, useLiveToken } from '@/stores/tokenFeed'
import { valueUsd as calcValueUsd, unrealizedPnlUsd as calcUnrealized } from '@/lib/portfolio'
import type { AssetRowData } from '@/hooks/useAssets'

export default function AssetRow({ asset, onOpen }: { asset: AssetRowData; onOpen: () => void }) {
  const resolveIconSrc = (name: string): string | undefined => {
    const n = name.toLowerCase()
    if (n.includes('solana')) return '/solana-logo.png'
    if (n.includes('zera')) return '/android-chrome-192x192.png'
    if (n.includes('ethereum')) return '/ethereum-logo.png'
    return undefined
  }

  let borderColor = 'border-[var(--brand-green-300)]'
  if (asset.name.toLowerCase().includes('ethereum')) {
    borderColor = 'border-[var(--ethereum-border)]'
  }
  if (asset.name.toLowerCase().includes('solana')) {
    borderColor = 'border-[var(--solana-border)]'
  }

  useEffect(() => {
    ensureFeed(asset.id)
    return () => releaseFeed(asset.id)
  }, [asset.id])

  const live = useLiveToken(asset.id)
  const price = live?.price ?? asset.price
  const liveValue = calcValueUsd(asset.amount, price)
  const livePnlUsd = calcUnrealized(asset.amount, price, asset.avgCostUsd) ?? asset.pnl

  return (
    <TableRow onClick={onOpen} className="cursor-pointer">
      <TableCell className="flex items-center gap-3">
        {(() => {
          const src = resolveIconSrc(asset.name)
          return src ? (
            <img
              src={src}
              alt={`${asset.name} logo`}
              className={`size-11 rounded-full border ${borderColor} object-cover`}
            />
          ) : (
            <div className="size-11 rounded-full bg-[var(--brand-light-dark-green)] border border-[var(--brand-light-green)] grid place-items-center text-[var(--brand-green-50)]">
              <CircleHelp className="size-5 opacity-80" />
            </div>
          )
        })()}
        <div className="flex items-center gap-2 text-[17px] leading-8">
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{asset.name}</span>
          <Badge variant="secondary">{asset.chain}</Badge>
        </div>
      </TableCell>
      <TableCell className="tabular-nums font-body text-[16px] leading-8 tracking-[-0.006rem] text-[var(--text-primary)]/50">{price.toLocaleString(undefined, { maximumFractionDigits: 8 })}</TableCell>
      <TableCell className="tabular-nums font-body text-[16px] leading-8 tracking-[-0.006rem] text-[var(--text-primary)]/50">{asset.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
      <TableCell className="tabular-nums font-semibold">${liveValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
      <TableCell className={`${livePnlUsd >= 0 ? 'text-[var(--brand-green)]' : 'text-[var(--balance-green)]'} tabular-nums`}>{(livePnlUsd >= 0 ? '+' : '')}${livePnlUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
    </TableRow>
  )
}


