import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTransactions } from '@/hooks/useTransactions'
import { useAssets } from '@/hooks/useAssets'
import { usePrivy } from '@privy-io/react-auth'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { TransactionsTable, type TxRow } from '@/components/TransactionsTable'

export const Route = createFileRoute('/activity')({
  component: ActivityPage,
})

// table rendering moved to TransactionsTable component

function ActivityPage() {
  const { user, getAccessToken } = usePrivy() as any
  const walletId = (user as any)?.wallets?.find((w: any) => w?.chainType === 'solana' || w?.chain === 'solana')?.address
    ?? (user as any)?.linkedAccounts?.find((a: any) => a?.type === 'wallet' && (a?.chainType === 'solana' || a?.chain === 'solana'))?.address
    ?? 'unknown-wallet'
  const { data, isLoading } = useTransactions(walletId)
  const rows = data?.transactions ?? []
  const { data: assets = [] } = useAssets()
  const mintToName = React.useMemo(() => {
    const m: Record<string, string> = {}
    for (const a of assets) m[a.mint] = a.name || a.symbol || a.mint
    return m
  }, [assets])
  const [extraMintNames, setExtraMintNames] = React.useState<Record<string, string>>({})
  const requestedMintsRef = React.useRef<Set<string>>(new Set())
  const extraMintNamesRef = React.useRef<Record<string, string>>({})
  React.useEffect(() => {
    extraMintNamesRef.current = extraMintNames
  }, [extraMintNames])
  const [query, setQuery] = React.useState('')
  const [pageSize, setPageSize] = React.useState(10)
  const [page, setPage] = React.useState(1)
  const [showSmall, setShowSmall] = React.useState(false)

  const normalizedQuery = query.trim().toLowerCase()
  const filtered = React.useMemo(() => {
    if (!normalizedQuery) return rows
    return rows.filter((t) => {
      const sent = t.details.type === 'transfer_sent'
      const symbol = t.details.asset.toUpperCase()
      const fullDisplay = t.details.display_values[symbol.toLowerCase()] ?? Object.values(t.details.display_values)[0] ?? ''
      const statusLabel = t.status.replace(/_/g, ' ')
      const fields = [
        sent ? 'sent' : 'received',
        symbol,
        fullDisplay,
        t.transaction_hash,
        t.details.sender,
        t.details.recipient,
        t.details.chain,
        statusLabel,
        String(t.created_at),
      ]
        .join(' ')
        .toLowerCase()
      return fields.includes(normalizedQuery)
    })
  }, [rows, normalizedQuery])

  const filteredBySmall = React.useMemo(() => {
    if (showSmall) return filtered
    return filtered.filter((t) => Number(t.details.raw_value) >= 100)
  }, [filtered, showSmall])

  const smallHiddenCount = React.useMemo(() => {
    return filtered.filter((t) => Number(t.details.raw_value) < 100).length
  }, [filtered])

  const pageCount = Math.max(1, Math.ceil(filteredBySmall.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  const pageRows = filteredBySmall.slice(start, end)

  React.useEffect(() => {
    const candidates = pageRows
      .map((t) => t.details.asset)
      .filter((mint) => mint && mint.toLowerCase() !== 'sol')
    const mintsNeedingName = Array.from(new Set(candidates)).filter((mint) => {
      if (mintToName[mint]) return false
      if (extraMintNamesRef.current[mint]) return false
      if (requestedMintsRef.current.has(mint)) return false
      return true
    })
    if (mintsNeedingName.length === 0) return
    for (const m of mintsNeedingName) requestedMintsRef.current.add(m)
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
  }, [pageRows, mintToName])

  React.useEffect(() => {
    setPage(1)
  }, [normalizedQuery, pageSize])

  return (
    <div className="min-h-screen">
      <div className="px-6 py-6 flex items-center justify-between">
        <h1 className="font-pp-machina text-[24px] font-normal leading-[32px] tracking-[-0.006em] leading-trim-cap text-[var(--text-primary)]">Activity</h1>
      </div>
      <section className="px-6 py-6 mx-auto">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-[360px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--text-tertiary)]" />
            <Input
              placeholder="Search activity"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
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
        </div>
        {isLoading ? (
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
                key: `${t.transaction_hash}_${t.details.asset}_${sent ? 'sent' : 'received'}_${counterparty}`,
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

