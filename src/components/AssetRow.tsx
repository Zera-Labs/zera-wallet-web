import { useEffect } from 'react'
import { TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ensureFeed, releaseFeed, useLiveToken } from '@/stores/tokenFeed'
import { valueUsd as calcValueUsd, unrealizedPnlUsd as calcUnrealized } from '@/lib/portfolio'
import type { AssetRowData } from '@/hooks/useAssets'

export default function AssetRow({ asset, onOpen }: { asset: AssetRowData; onOpen: () => void }) {
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
        <div className="size-11 rounded-full bg-[var(--brand-light-dark-green)] border border-[var(--brand-light-green)]" />
        <div className="flex items-center gap-2 text-[17px] leading-8">
          <span>{asset.name}</span>
          <Badge variant="secondary">{asset.chain}</Badge>
        </div>
      </TableCell>
      <TableCell className="tabular-nums font-body text-[16px] leading-8 tracking-[-0.006rem] text-[var(--text-primary)]/50">{price.toLocaleString(undefined, { maximumFractionDigits: 8 })}</TableCell>
      <TableCell className="tabular-nums font-body text-[16px] leading-8 tracking-[-0.006rem] text-[var(--text-primary)]/50">{asset.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
      <TableCell className="tabular-nums font-semibold">${liveValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
      <TableCell className="text-[var(--brand-green)] tabular-nums">{(livePnlUsd >= 0 ? '+' : '')}${livePnlUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
      <TableCell>
        <div className="inline-block h-6 w-16 bg-[var(--brand-light-dark-green)] rounded" />
      </TableCell>
    </TableRow>
  )
}


