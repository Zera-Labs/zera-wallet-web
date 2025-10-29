import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTransactions } from '@/hooks/useTransactions'
import { usePrivy } from '@privy-io/react-auth'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { TransactionsTable, type TxRow } from '@/components/TransactionsTable'

export const Route = createFileRoute('/activity')({
  component: ActivityPage,
})

// table rendering moved to TransactionsTable component

function ActivityPage() {
  const { user } = usePrivy()
  const walletId = (user as any)?.wallets?.find((w: any) => w?.chainType === 'solana' || w?.chain === 'solana')?.address
    ?? (user as any)?.linkedAccounts?.find((a: any) => a?.type === 'wallet' && (a?.chainType === 'solana' || a?.chain === 'solana'))?.address
    ?? 'unknown-wallet'
  const { data, isLoading } = useTransactions(walletId)
  const rows = data?.transactions ?? []
  const [query, setQuery] = React.useState('')
  const [pageSize, setPageSize] = React.useState(10)
  const [page, setPage] = React.useState(1)

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

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  const pageRows = filtered.slice(start, end)

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
              const symbol = t.details.asset.toUpperCase()
              const fullDisplay = t.details.display_values[symbol.toLowerCase()] ?? Object.values(t.details.display_values)[0] ?? ''
              const counterparty = sent ? t.details.recipient : t.details.sender
              return {
                key: t.privy_transaction_id,
                type: sent ? 'sent' : 'received',
                symbol,
                amountDisplay: fullDisplay,
                status: t.status,
                createdAt: t.created_at,
                signature: t.transaction_hash,
                counterparty,
              }
            })}
          />
        )}
        <div className="mt-4 flex items-center justify-between text-sm text-[var(--text-tertiary)]">
          <div>
            Showing {filtered.length === 0 ? 0 : start + 1}-{Math.min(end, filtered.length)} of {filtered.length}
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
          </div>
        </div>
      </section>
    </div>
  )
}

