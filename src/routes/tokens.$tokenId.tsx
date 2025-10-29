import { createFileRoute, useParams } from '@tanstack/react-router'
import { useTokenMeta } from '@/hooks/useToken'
import { useTransactions } from '@/hooks/useTransactions'
import { useAssets } from '@/hooks/useAssets'
import { usePrivy } from '@privy-io/react-auth'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TransactionsTable, type TxRow } from '@/components/TransactionsTable'
import { Button } from '@/components/ui/button'
import { useEffect, useMemo, useState } from 'react'
import { useLiveToken, ensureFeed, releaseFeed } from '@/stores/tokenFeed'
import { ArrowUp, ArrowDown, ArrowLeftRight, CircleEllipsis, ChevronLeft, ChevronRight } from 'lucide-react'
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

  // Fetch all wallet transactions and filter client-side by mint
  const { user, getAccessToken } = usePrivy() as any
  const walletId = (user as any)?.wallets?.find((w: any) => w?.chainType === 'solana' || w?.chain === 'solana')?.address
    ?? (user as any)?.linkedAccounts?.find((a: any) => a?.type === 'wallet' && (a?.chainType === 'solana' || a?.chain === 'solana'))?.address
    ?? 'unknown-wallet'
  const { data: allTxs, isLoading: isLoadingTxs } = useTransactions(walletId)
  const rowsAll = allTxs?.transactions ?? []
  const rows = useMemo(() => {
    const target = tokenId.toLowerCase()
    return rowsAll.filter((t) => String(t?.details?.mint || '').toLowerCase() === target)
  }, [rowsAll, tokenId])

  // Pagination and small-amount toggle (mirrors Activity page)
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [showSmall, setShowSmall] = useState(false)

  const filteredBySmall = useMemo(() => {
    if (showSmall) return rows
    return rows.filter((t) => Number(t.details.raw_value) >= 100)
  }, [rows, showSmall])

  const smallHiddenCount = useMemo(() => {
    return rows.filter((t) => Number(t.details.raw_value) < 100).length
  }, [rows])

  const pageCount = Math.max(1, Math.ceil(filteredBySmall.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  const pageRows = filteredBySmall.slice(start, end)

  // Resolve mint -> symbol/name like Activity page
  const { data: assets = [] } = useAssets()
  const mintToName = useMemo(() => {
    const m: Record<string, string> = {}
    for (const a of assets) m[a.mint] = a.name || a.symbol || a.mint
    return m
  }, [assets])
  const [extraMintNames, setExtraMintNames] = useState<Record<string, string>>({})
  const requestedMintsRef = useMemo(() => new Set<string>(), [])
  const extraMintNamesRef = useMemo(() => ({ current: {} as Record<string, string> }), [])
  useEffect(() => { extraMintNamesRef.current = extraMintNames }, [extraMintNames])
  useEffect(() => {
    const candidates = pageRows
      .map((t) => t.details.asset)
      .filter((mint) => mint && mint.toLowerCase() !== 'sol')
    const mintsNeedingName = Array.from(new Set(candidates)).filter((mint) => {
      if (mintToName[mint]) return false
      if (extraMintNamesRef.current[mint]) return false
      if (requestedMintsRef.has(mint)) return false
      return true
    })
    if (mintsNeedingName.length === 0) return
    for (const m of mintsNeedingName) requestedMintsRef.add(m)
    ;(async () => {
      try {
        const headerToken = (await getAccessToken?.()) || undefined
        const pairs = await Promise.all(mintsNeedingName.map(async (mint) => {
          try {
            const res = await fetch(`/api/token/${encodeURIComponent(mint)}/asset`, {
              credentials: 'include',
              headers: headerToken ? { Authorization: `Bearer ${headerToken}` } : undefined,
              cache: 'no-store',
            })
            if (!res.ok) return [mint, undefined] as const
            const json = await res.json()
            const name: string | undefined = json?.name || json?.symbol
            return [mint, name] as const
          } catch {
            return [mint, undefined] as const
          }
        }))
        setExtraMintNames((prev) => {
          let changed = false
          const next = { ...prev }
          for (const [mint, name] of pairs) {
            if (name && !next[mint]) {
              next[mint] = name
              changed = true
            }
          }
          return changed ? next : prev
        })
      } catch {}
    })()
  }, [pageRows, mintToName, getAccessToken])

  useEffect(() => {
    setPage(1)
  }, [pageSize, tokenId])

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
        {isLoadingTxs ? (
          <div className="py-6">Loading...</div>
        ) : (
          <TransactionsTable
            rows={pageRows.map<TxRow>((t) => {
              const sent = t.details.type === 'transfer_sent'
              const isSol = t.details.asset.toLowerCase() === 'sol'
              const symbol = isSol ? 'SOL' : (mintToName[t.details.asset] || extraMintNames[t.details.asset] || t.details.asset.toUpperCase())
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
        )}
        <div className="mt-4 flex items-center justify-between text-sm text-[var(--text-tertiary)]">
          <div>
            Showing {filteredBySmall.length === 0 ? 0 : start + 1}-{Math.min(end, filteredBySmall.length)} of {filteredBySmall.length}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3">
              <label className="text-sm text-[var(--text-tertiary)]">Rows per page</label>
              <select
                className="h-9 px-2 rounded-md bg-[var(--brand-green-950)] border border-input text-sm"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <button
              type="button"
              aria-label="Previous page"
              className="inline-flex items-center justify-center size-9 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" />
            </button>
            <span>Page {currentPage} / {pageCount}</span>
            <button
              type="button"
              aria-label="Next page"
              className="inline-flex items-center justify-center size-9 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50"
              disabled={currentPage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              <ChevronRight className="size-4" />
            </button>
            {smallHiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setShowSmall((v) => !v)}
                className="h-9 px-3 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                aria-pressed={showSmall}
              >
                {showSmall ? 'Hide small (<100 raw)' : `Show small (<100 raw) · ${smallHiddenCount}`}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

