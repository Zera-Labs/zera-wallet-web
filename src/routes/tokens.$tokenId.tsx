import { createFileRoute, useParams } from '@tanstack/react-router'
import { useTokenMeta } from '@/hooks/useToken'
import { useTransactions } from '@/hooks/useTransactions'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TransactionsTable, type TxRow } from '@/components/TransactionsTable'
import { Button } from '@/components/ui/button'
import { useEffect, useMemo } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useLiveToken, ensureFeed, releaseFeed } from '@/stores/tokenFeed'
import { ArrowUp, ArrowDown, ArrowLeftRight, CircleEllipsis } from 'lucide-react'
import PerformanceChart from '@/components/PerformanceChart'

export const Route = createFileRoute('/tokens/$tokenId')({
  component: TokenPage,
})

function TokenPage() {
  const { tokenId } = useParams({ from: '/tokens/$tokenId' })

  useEffect(() => {
    ensureFeed(tokenId)
    return () => releaseFeed(tokenId)
  }, [tokenId])

  const live = useLiveToken(tokenId)

  const { data: meta } = useTokenMeta(tokenId)

  const { user } = usePrivy()
  const walletId = (user as any)?.wallets?.find((w: any) => w?.chainType === 'solana' || w?.chain === 'solana')?.address
    ?? (user as any)?.linkedAccounts?.find((a: any) => a?.type === 'wallet' && (a?.chainType === 'solana' || a?.chain === 'solana'))?.address
    ?? 'unknown-wallet'
  const { data: allTxs } = useTransactions(walletId)
  const rows = allTxs?.transactions ?? []

  const price = live?.summary?.price_usd ?? meta?.price
  const pnlPercent = useMemo(() => {
    const avg = meta?.avgCostUsd
    if (avg != null && avg > 0 && price != null) {
      return ((price - avg) / avg) * 100
    }
    return meta?.pnl
  }, [meta?.avgCostUsd, meta?.pnl, price])

  return (
    <div className="px-6 pb-16">
      <section className="pt-6 pb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-11 rounded-full bg-[var(--brand-light-dark-green)] border border-[var(--brand-light-green)]" />
          <div className="flex items-center gap-2 text-[17px] leading-8">
            <span>{live?.name ?? meta?.name ?? tokenId.toUpperCase()}</span>
            <Badge variant="secondary">{meta?.chain ?? '—'}</Badge>
          </div>
        </div>
        <div className="flex items-end gap-3 mb-4">
          <div className="text-[44px] font-extrabold tabular-nums">{price != null ? `$${price.toLocaleString(undefined, { maximumFractionDigits: 8 })}` : '—'}</div>
          <Badge variant="balance" balanceTone={(pnlPercent ?? 0) >= 0 ? 'green' : 'red'}>
            {(pnlPercent != null ? `${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—`')}%
          </Badge>
        </div>
        <Card variant="darkSolidGrey" className="w-full min-h-[260px] py-3 px-4">
          <PerformanceChart
            ranges={["1H", "1D", "1W", "1M", "YTD", "ALL"]}
            defaultRange="1D"
            chartHeight={180}
            title="Performance"
            currencyBadge="USD"
          />
        </Card>
      </section>

      <section className="py-6">
        <div className="flex gap-4">
          <Button variant="icon" size="icon-44" aria-label="Up" pill><ArrowUp aria-hidden="true" /></Button>
          <Button variant="icon" size="icon-44" aria-label="Down" pill><ArrowDown aria-hidden="true" /></Button>
          <Button variant="icon" size="icon-44" aria-label="Swap" pill><ArrowLeftRight aria-hidden="true" /></Button>
          <Button variant="icon" size="icon-44" aria-label="More" pill><CircleEllipsis aria-hidden="true" /></Button>
        </div>
      </section>

      <section className="py-2">
        <h3 className="text-lg font-semibold mb-3">Transactions</h3>
        <TransactionsTable
          rows={rows
            .filter((t) => {
              const asset = String(t?.details?.asset || '').toLowerCase()
              if (tokenId.toLowerCase() === 'sol') return asset === 'sol'
              const mint = String((meta as any)?.mint || '').toLowerCase()
              if (mint) return asset === mint
              // fallback: if tokenId looks like a mint, accept it
              return asset === tokenId.toLowerCase()
            })
            .filter((t) => Number(t.details.raw_value) >= 100)
            .map<TxRow>((t) => {
              const sent = t.details.type === 'transfer_sent'
              const symbol = t.details.asset.toUpperCase()
              const fullDisplay = t.details.display_values[symbol.toLowerCase()] ?? Object.values(t.details.display_values)[0] ?? ''
              const counterparty = sent ? t.details.recipient : t.details.sender
              return {
                key: t.transaction_id,
                type: sent ? 'sent' : 'received',
                symbol,
                amountDisplay: fullDisplay,
                status: t.status,
                createdAt: t.created_at,
                signature: t.transaction_hash,
                counterparty,
                rawValue: Number(t.details.raw_value),
              }
            })}
        />
      </section>
    </div>
  )
}

