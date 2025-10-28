import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useTransactions } from '@/hooks/useTransactions'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { usePrivy } from '@privy-io/react-auth'
import { Send, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/activity')({
  component: ActivityPage,
})

function formatDate(ts: number) {
  const d = new Date(ts)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncateMiddle(value: string, maxLength = 16) {
  if (value.length <= maxLength) return value
  const keep = Math.floor((maxLength - 1) / 2)
  return `${value.slice(0, keep)}…${value.slice(-keep)}`
}

function shortAddress(addr: string) {
  if (!addr) return ''
  return `${addr.slice(0, 5)}...${addr.slice(-4)}`
}

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
        <Table className="text-[15px]">
          <colgroup>
            <col className="w-[20%]" />
            <col className="w-[20%]" />
            <col className="w-[20%]" />
            <col className="w-[20%]" />
            <col className="w-[20%]" />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Signature</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell className="py-6" colSpan={6}>Loading...</TableCell>
              </TableRow>
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell className="py-6" colSpan={6}>No activity yet</TableCell>
              </TableRow>
            ) : (
              pageRows.map((t) => {
                const sent = t.details.type === 'transfer_sent'
                const symbol = t.details.asset.toUpperCase()
                const fullDisplay = t.details.display_values[symbol.toLowerCase()] ?? Object.values(t.details.display_values)[0] ?? ''
                const truncatedDisplay = truncateMiddle(fullDisplay, 18)
                const counterparty = sent ? t.details.recipient : t.details.sender
                const statusLabel = t.status.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
                return (
                  <TableRow key={t.privy_transaction_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Badge variant="icon">
                          {sent ? <Send /> : <Download />}
                        </Badge>
                        <span className="text-[var(--text-primary)]">{sent ? 'Sent' : 'Received'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className={sent ? 'text-red-300' : 'text-green-300'}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {sent ? '-' : '+'}{truncatedDisplay} {symbol}
                              </span>
                            </TooltipTrigger>
                            {fullDisplay && fullDisplay.length > truncatedDisplay.length && (
                              <TooltipContent sideOffset={6}>{fullDisplay} {symbol}</TooltipContent>
                            )}
                          </Tooltip>
                        </div>
                        <div className="text-[13px] text-[var(--text-tertiary)]">
                          {shortAddress(counterparty)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="tx" status={t.status as any} className="gap-1.5">
                        {t.status === 'pending' && (
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-3.5">
                            <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.75" />
                            <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {t.status === 'confirmed' && (
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-3.5">
                            <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.75" />
                            <path d="M9.5 12.5l2 2 3.5-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {(t.status === 'failed' || t.status === 'execution_reverted' || t.status === 'provider_error') && (
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-3.5">
                            <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.75" />
                            <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {(t.status === 'broadcasted' || t.status === 'replaced' || t.status === 'finalized') && (
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-3.5">
                            <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.75" />
                            <path d="M8.5 12h7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(t.created_at)}</TableCell>
                    <TableCell className="font-mono text-[13px] opacity-80">{t.transaction_hash.slice(0, 10)}…</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
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

