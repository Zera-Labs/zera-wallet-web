import { createFileRoute, useParams } from '@tanstack/react-router'
import { useTokenMeta, useTokenTxs } from '@/hooks/useToken'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useEffect, useMemo } from 'react'
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

  const { data: txs = [] } = useTokenTxs(tokenId)

  const price = live?.price ?? meta?.price
  const pnlPercent = useMemo(() => {
    const avg = meta?.avgCostUsd
    if (avg != null && avg > 0 && price != null) {
      return ((price - avg) / avg) * 100
    }
    return live?.pnl ?? meta?.pnl
  }, [meta?.avgCostUsd, meta?.pnl, price, live?.pnl])

  return (
    <div className="px-6 pb-16">
      <section className="pt-6 pb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-11 rounded-full bg-[var(--brand-light-dark-green)] border border-[var(--brand-light-green)]" />
          <div className="flex items-center gap-2 text-[17px] leading-8">
            <span>{meta?.name ?? tokenId.toUpperCase()}</span>
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
        <Table>
          <colgroup>
            <col className="w-[70%]" />
            <col className="w-[30%]" />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead>Swap</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {txs.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="tabular-nums">
                  {t.fromSymbol} → {t.toSymbol}
                  <span className="ml-2 text-[color:color-mix(in srgb,var(--text-primary) 50%,transparent)]">
                    {t.fromValue.toLocaleString()} → {t.toValue.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>{new Date(t.at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  )
}

