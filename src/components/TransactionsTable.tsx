 
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Send, Download, ExternalLink } from 'lucide-react'

export type TxRow = {
  key: string
  type: 'sent' | 'received'
  symbol: string
  amountDisplay: string
  status?: 'broadcasted' | 'confirmed' | 'execution_reverted' | 'failed' | 'replaced' | 'finalized' | 'provider_error' | 'pending'
  createdAt: number
  signature: string
  counterparty?: string
  rawValue?: number
}

function truncateMiddle(value: string, maxLength = 18) {
  if (!value) return ''
  if (value.length <= maxLength) return value
  const keep = Math.floor((maxLength - 1) / 2)
  return `${value.slice(0, keep)}…${value.slice(-keep)}`
}

function shortAddress(addr?: string) {
  if (!addr) return ''
  return `${addr.slice(0, 5)}...${addr.slice(-4)}`
}

function formatDate(ts: number) {
  const d = new Date(ts)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TransactionsTable({ rows }: { rows: TxRow[] }) {
  return (
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
        {rows.length === 0 ? (
          <TableRow>
            <TableCell className="py-6" colSpan={6}>No activity yet</TableCell>
          </TableRow>
        ) : (
          rows.map((r) => {
            const sent = r.type === 'sent'
            const statusLabel = (r.status ?? 'finalized').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
            return (
              <TableRow key={r.key}>
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
                          <span
                            className="cursor-help block truncate"
                          >
                            {sent ? '-' : '+'}{r.amountDisplay} {r.symbol}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent sideOffset={6}>{r.amountDisplay} {r.symbol}</TooltipContent>
                      </Tooltip>
                    </div>
                    {r.counterparty ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-[13px] text-[var(--text-tertiary)] cursor-help font-mono">
                            {shortAddress(r.counterparty)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent sideOffset={6}>
                          {r.counterparty}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <div className="text-[13px] text-[var(--text-tertiary)]">{shortAddress(r.counterparty)}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="tx" status={(r.status ?? 'finalized') as any} className="gap-1.5">
                    {r.status === 'pending' && (
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-3.5">
                        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.75" />
                        <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {r.status === 'confirmed' && (
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-3.5">
                        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.75" />
                        <path d="M9.5 12.5l2 2 3.5-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {(r.status === 'failed' || r.status === 'execution_reverted' || r.status === 'provider_error') && (
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-3.5">
                        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.75" />
                        <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {(r.status === 'broadcasted' || r.status === 'replaced' || r.status === 'finalized' || !r.status) && (
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-3.5">
                        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.75" />
                        <path d="M8.5 12h7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {statusLabel}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(r.createdAt)}</TableCell>
                <TableCell className="font-mono text-[13px] opacity-80">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={`https://solscan.io/tx/${r.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline inline-flex items-center gap-1"
                      >
                        {r.signature.slice(0, 10)}…
                        <ExternalLink className="size-3.5 opacity-80" aria-hidden="true" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6} className="font-mono break-all">
                      {r.signature}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}


