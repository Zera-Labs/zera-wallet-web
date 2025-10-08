import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAssets } from '@/hooks/useAssets'
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PiggyBank, Banknote, ArrowLeftRight, Circle } from 'lucide-react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import AssetRow from '@/components/AssetRow'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const navigate = useNavigate()
  const { data: assets = [], isLoading } = useAssets()

  return (
    <div className="min-h-screen">
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="grid w-full grid-cols-1 xl:grid-cols-[10fr_10fr_5fr] items-stretch gap-6 self-stretch">
          <Card variant="dark" className="min-h-[224px] w-full" />
          <Card variant="dark" className="min-h-[224px] w-full" />
          <Card
            variant="dark"
            className="min-h-[224px] w-full md:justify-self-end xl:max-w-none"
          >
            <CardHeader>
              <CardTitle className="text-base">Private pool</CardTitle>
              <CardAction>
                <Badge className="gap-1.5">
                  <Circle className="size-3" />
                  Active
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="w-fit mx-auto space-y-4">
                  <div className="font-pp-machina text-[32px] leading-[32px] font-extrabold tracking-[-0.192px] text-[var(--brand-green-50)] text-center">
                    $354,938.18
                  </div>
                  <div className="grid grid-cols-3 gap-4 justify-items-center w-full">
                <div className="flex flex-col items-center gap-2">
                  <Button variant="icon" size="icon-44" aria-label="Deposit"><PiggyBank /></Button>
                  <span className="text-xs text-[var(--text-tertiary)]">Deposit</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Button variant="icon" size="icon-44" aria-label="Withdraw"><Banknote /></Button>
                  <span className="text-xs text-[var(--text-tertiary)]">Withdraw</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Button variant="icon" size="icon-44" aria-label="Transfer"><ArrowLeftRight /></Button>
                  <span className="text-xs text-[var(--text-tertiary)]">Transfer</span>
                </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
                  <AssetRow key={a.id} asset={a as any} onOpen={() => navigate({ to: (`/tokens/${a.id}` as any) })} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  )
}
