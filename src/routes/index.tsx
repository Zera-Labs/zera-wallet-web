import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const { data: assets = [], isLoading } = useQuery<{ id: string; name: string; symbol: string; chain: string; price: number; amount: number; value: number; pnl: number; }[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      const res = await fetch('/api/assets')
      if (!res.ok) throw new Error('Failed to load assets')
      return res.json()
    },
  })

  return (
    <div className="min-h-screen">
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="flex w-full flex-col xl:flex-row items-stretch xl:items-start gap-6 self-stretch">
          <Card variant="dark" className="basis-full xl:basis-1/3 min-h-[260px] w-full" />
          <Card variant="dark" className="basis-full xl:basis-2/3 min-h-[260px] w-full" />
        </div>
      </section>

      <section className="px-6 mx-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Assets</h2>
          </div>
          <Table className="text-[15px]">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[18%]" />
              <col className="w-[16%]" />
              <col className="w-[10%]" />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>PNL</TableHead>
                <TableHead>Chart</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell className="py-6" colSpan={6}>Loading...</TableCell>
                </TableRow>
              ) : (
                assets.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="flex items-center gap-3">
                      <div className="size-11 rounded-full bg-[var(--brand-light-dark-green)] border border-[var(--brand-light-green)]" />
                      <div className="flex items-center gap-2 text-[17px] leading-8">
                        <span>{a.name}</span>
                        <Badge variant="secondary">{a.chain}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums font-body text-[16px] leading-8 tracking-[-0.006rem] text-[var(--text-primary)]/50">{a.price.toLocaleString(undefined, { maximumFractionDigits: 8 })}</TableCell>
                    <TableCell className="tabular-nums font-body text-[16px] leading-8 tracking-[-0.006rem] text-[var(--text-primary)]/50">{a.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="tabular-nums font-semibold">${a.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-[var(--brand-green)] tabular-nums">+${a.pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <div className="inline-block h-6 w-16 bg-[var(--brand-light-dark-green)] rounded" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  )
}
