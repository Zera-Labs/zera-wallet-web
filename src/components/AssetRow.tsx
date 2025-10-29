import { useEffect } from 'react'
import { CircleHelp } from 'lucide-react'
import { TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ensureFeed, releaseFeed, useLiveToken } from '@/stores/tokenFeed'
import { valueUsd as calcValueUsd } from '@/lib/portfolio'
import type { AssetRowData } from '@/hooks/useAssets'
import { useAssetImage } from '@/hooks/useAssets'

export default function AssetRow({ asset, onOpen }: { asset: AssetRowData; onOpen: () => void }) {
  const resolveIconSrc = (name: string): string | undefined => {
    const n = name.toLowerCase()
    if (n.includes('solana')) return '/solana-logo.png'
    if (n.includes('zera')) return '/android-chrome-192x192.png'
    if (n.includes('ethereum')) return '/ethereum-logo.png'
    return undefined
  }

  useEffect(() => {
    ensureFeed(asset.mint)
    return () => releaseFeed(asset.mint)
  }, [asset.mint])

  const live = useLiveToken(asset.mint)
  const { data: assetImg } = useAssetImage(asset.mint)
  const name = live?.name ?? asset.name
  const price = live?.summary?.price_usd ?? asset.price
  let borderColor = 'border-[var(--brand-green-300)]'
  if (name.toLowerCase().includes('ethereum')) {
    borderColor = 'border-[var(--ethereum-border)]'
  }
  if (name.toLowerCase().includes('solana')) {
    borderColor = 'border-[var(--solana-border)]'
  }
  const liveValue = calcValueUsd(asset.amount, price)
  const rawDp24 = live?.summary['24h'].last_price_usd_change ?? 0

  return (
    <TableRow onClick={onOpen} className="cursor-pointer">
      <TableCell className="flex items-center gap-3">
        {(() => {
          const src = assetImg?.image || resolveIconSrc(name)
          return src ? (
            <img
              src={src}
              alt={`${name} logo`}
              className={`size-11 rounded-full border ${borderColor} object-cover`}
            />
          ) : (
            <div className="size-11 rounded-full bg-[var(--brand-light-dark-green)] border border-[var(--brand-light-green)] grid place-items-center text-[var(--brand-green-50)]">
              <CircleHelp className="size-5 opacity-80" />
            </div>
          )
        })()}
        <div className="flex items-center gap-2 text-[17px] leading-8">
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{name}</span>
          <Badge variant="secondary">{asset.chain}</Badge>
        </div>
      </TableCell>
      <TableCell className="tabular-nums font-body text-[16px] leading-8 tracking-[-0.006rem] text-[var(--text-primary)]/50">{price.toLocaleString(undefined, { maximumFractionDigits: 8 })}</TableCell>
      <TableCell className="tabular-nums font-body text-[16px] leading-8 tracking-[-0.006rem] text-[var(--text-primary)]/50">
        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
          {asset.amount.toLocaleString(undefined, { maximumFractionDigits: 20 })}
        </span>
      </TableCell>
      <TableCell className="tabular-nums font-semibold">${liveValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
      <TableCell className={`${rawDp24 >= 0 ? 'text-[var(--brand-green)]' : 'text-[var(--balance-red)]'} tabular-nums`}>{(rawDp24 >= 0 ? '+' : '-')}{Math.abs(rawDp24).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</TableCell>
    </TableRow>
  )
}


