import * as React from "react"
import { ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAssets } from "@/hooks/useAssets"

type TokenSelectProps = {
  value?: string
  onChange: (symbol: string) => void
}

export default function TokenSelect({ value, onChange }: TokenSelectProps) {
  const { data: assets = [] } = useAssets()
  const [open, setOpen] = React.useState(false)
  const symbols = React.useMemo(() => {
    const map = new Map<string, { symbol: string; name: string }>()
    for (const a of assets) {
      if (!map.has(a.symbol)) map.set(a.symbol, { symbol: a.symbol, name: a.name })
    }
    return Array.from(map.values())
  }, [assets])

  React.useEffect(() => {
    if (!value && symbols.length > 0) onChange(symbols[0].symbol)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.length])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Input readOnly value={value ?? ""} className="pr-8 text-[var(--brand-green-300)]" />
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-[var(--brand-green-500)]" />
      </button>
      {open ? (
        <div className="absolute z-50 mt-2 w-full rounded-md border border-[var(--brand-green-200)] bg-[#111] p-1 shadow-sm">
          <div className="max-h-64 overflow-auto">
            {symbols.map((t) => (
              <button
                key={t.symbol}
                type="button"
                onClick={() => {
                  onChange(t.symbol)
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm cursor-pointer hover:bg-input/20 hover:text-[var(--brand-green-300)]"
                role="option"
                aria-selected={t.symbol === value}
              >
                <span className="text-[var(--brand-green-300)]">{t.symbol}</span>
                <span className="ml-auto text-xs text-muted-foreground">{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}


