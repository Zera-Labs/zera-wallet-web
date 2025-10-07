import { createFileRoute } from '@tanstack/react-router'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/ui-demo')({
  component: UiDemo,
})

function UiDemo() {
  return (
    <div className="px-6 py-10 space-y-8">
      <h1 className="text-2xl font-semibold">UI Demo</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Badges</h2>
        <Table className="max-w-[700px]">
          <colgroup>
            <col className="w-[28%]" />
            <col className="w-[24%]" />
            <col className="w-[24%]" />
            <col className="w-[24%]" />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead>Variant</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Focus</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Primary</TableCell>
              <TableCell>
                <Badge>Label</Badge>
              </TableCell>
              <TableCell>
                <Badge className="ring-[3px] ring-[var(--brand-light-green)]">Label</Badge>
              </TableCell>
              <TableCell />
            </TableRow>
            <TableRow>
              <TableCell>Secondary</TableCell>
              <TableCell>
                <Badge variant="secondary">Label</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="ring-[3px] ring-[var(--brand-light-green)]">Label</Badge>
              </TableCell>
              <TableCell />
            </TableRow>
            <TableRow>
              <TableCell>Outline</TableCell>
              <TableCell>
                <Badge variant="outline">Label</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="ring-[3px] ring-[var(--brand-light-green)]">Label</Badge>
              </TableCell>
              <TableCell />
            </TableRow>
            <TableRow>
              <TableCell>Ghost</TableCell>
              <TableCell>
                <Badge variant="ghost">Label</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="ghost" className="ring-[3px] ring-[var(--brand-light-green)]">Label</Badge>
              </TableCell>
              <TableCell />
            </TableRow>
            <TableRow>
              <TableCell>Destructive</TableCell>
              <TableCell>
                <Badge variant="destructive">Label</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="destructive" className="ring-[3px] ring-red-500/40">Label</Badge>
              </TableCell>
              <TableCell />
            </TableRow>
            <TableRow>
              <TableCell>Balance (green)</TableCell>
              <TableCell>
                <Badge variant="balance" balanceTone="green">$176,677.01 +12.5%</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="balance" balanceTone="green" className="ring-[3px] ring-[var(--brand-light-green)]">$176,677.01 +12.5%</Badge>
              </TableCell>
              <TableCell>Use for positive balances</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Balance (red)</TableCell>
              <TableCell>
                <Badge variant="balance" balanceTone="red">$56,458.16 -12.5%</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="balance" balanceTone="red" className="ring-[3px] ring-red-500/40">$56,458.16 -12.5%</Badge>
              </TableCell>
              <TableCell>Use for negative balances</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
    </div>
  )
}

