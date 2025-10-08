import * as React from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowUpRight, X, Copy, AlertTriangle, ArrowRight } from "lucide-react"
import { useUser } from "@/hooks/useUser"
import TokenSelect from "@/components/TokenSelect"

type Recipient = { id: string; name: string; address: string }

type TransfersModalProps = {
  open: boolean
  onOpenChange: (v: boolean) => void
  initialMode?: "send" | "receive"
}

export default function TransfersModal({ open, onOpenChange, initialMode = "send" }: TransfersModalProps) {
  const [mode, setMode] = React.useState<"send" | "receive">(initialMode)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[440px]">
        <DialogHeader className="px-4 py-4">
          <div className="flex w-full items-center gap-2">
            <DialogTitle>{mode === "send" ? "Send" : "Receive"}</DialogTitle>
            <div className="ml-auto flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMode((m) => (m === "send" ? "receive" : "send"))}
              >
                {mode === "send" ? "Receive" : "Send"}
              </Button>
              <DialogClose className="opacity-70 hover:opacity-100" aria-label="Close">
                <X className="size-4" />
              </DialogClose>
            </div>
          </div>
        </DialogHeader>
        {mode === "send" ? <SendView /> : <ReceiveView />}
      </DialogContent>
    </Dialog>
  )
}

function SendView() {
  const [token, setToken] = React.useState<string | undefined>(undefined)
  const [amount, setAmount] = React.useState("")
  const [recipient, setRecipient] = React.useState("")

  const recent: Recipient[] = [
    { id: "a", name: "Alice", address: "Dyw8....NSKK" },
    { id: "b", name: "Bob", address: "Dyw8....NSKK" },
    { id: "c", name: "Charlie", address: "Dyw8....NSKK" },
  ]

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm text-[var(--text-primary)]">Select token</label>
        <TokenSelect value={token} onChange={setToken} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-[var(--text-primary)]">Amount</label>
        <div className="relative">
          <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          <Button
            variant="ghost"
            onClick={() => setAmount("MAX")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--brand-green-500)] text-sm"
          >
            MAX
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-[var(--text-primary)]">Recipient</label>
        <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="" />

        <Card variant="outline" tone="green" className="bg-black/40 rounded-md border-[var(--brand-green-50]/20">
          <div className="px-4 pt-2 pb-1 text-xs text-[var(--text-primary)]">Recent recipients</div>
          <div className="flex flex-col gap-2">
            {recent.map((r) => (
              <Button
                key={r.id}
                onClick={() => setRecipient(r.address)}
                className="flex items-center gap-3 px-2 py-2 text-left hover:bg-input/20"
                variant="ghost"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-green-900)] text-[var(--text-primary)]">
                  {r.name[0]}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.address}</div>
                </div>
                <div className="flex items-center gap-2 text-[var(--brand-green-500)]">
                  Send again <ArrowRight className="size-4" />
                </div>
              </Button>
            ))}
          </div>
        </Card>
      </div>

      <Card variant="outline" tone="green" className="rounded-md">
        <div className="flex flex-col gap-2 px-4 py-2 text-[var(--text-primary)]">
          <div className="flex items-center justify-between text-sm">
            <span>Network Fee</span>
            <span>0.000005 SOL</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Priority Fee</span>
            <span>0.0001 SOL</span>
          </div>
          <div className="h-px w-full bg-[var(--brand-green-300)]/40" />
          <div className="flex items-center justify-between text-base font-medium">
            <span>Total</span>
            <span>0.00 SOL</span>
          </div>
        </div>
      </Card>

      <DialogFooter className="px-0">
        <Button variant="outline" className="flex-1 uppercase border-[var(--brand-green-300)]/50 bg-[var(--brand-green-500)]/10 text-[var(--text-primary)]">
          Cancel
        </Button>
        <Button className="flex-1 uppercase bg-[var(--brand-green-500)] text-[var(--brand-green-950)]">
          <ArrowUpRight className="size-4" />
          Send
        </Button>
      </DialogFooter>
    </div>
  )
}

function ReceiveView() {
  const { data: user } = useUser()
  const [token, setToken] = React.useState<string | undefined>(undefined)
  const sol = user?.linkedAccounts.find((a: any) => a.type === "wallet" && a.chainType === "solana") as any
  const address = sol?.address ?? "YourSolAddressHere..."
  const [amount, setAmount] = React.useState("")

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address)
    } catch {}
  }

  const share = async () => {
    const text = `Receive ${token}${amount ? ` (${amount})` : ""} at ${address}`
    // Fire and forget; not all environments support it
    try {
      if (navigator?.share) await navigator.share({ title: `Receive ${token}`, text })
    } catch {}
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm text-[var(--text-primary)]">Select token</label>
        <TokenSelect value={token} onChange={setToken} />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-[var(--text-primary)]">Amount (Optional)</label>
        <div className="relative">
          <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          <Button
            variant="ghost"
            onClick={() => setAmount("MAX")}
            className="text-[var(--brand-green-500)]"
          >
            MAX
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">Leave blank to receive any amount</div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-[var(--text-primary)]">Your wallet address</label>
        <div className="relative">
          <Input readOnly value={address} className="pr-8" />
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={copy} aria-label="Copy">
            <Copy className="size-4 text-[var(--brand-green-500)]" />
          </button>
        </div>
        <Card variant="outline" tone="green" className="rounded-md">
          <div className="flex items-center justify-center h-[190px] text-[var(--brand-green-500)]">
            {/* Placeholder for QR - integrate real QR later */}
            <div className="grid grid-cols-5 grid-rows-5 gap-2 p-4">
              {Array.from({ length: 25 }).map((_, i) => (
                <div key={i} className="size-4 bg-[var(--brand-green-500)]/30 rounded-[2px]" />
              ))}
            </div>
          </div>
          <div className="pb-3 text-center text-xs text-[var(--text-primary)]">Your SOL QR</div>
        </Card>
      </div>

      <Card variant="info" className="rounded-md">
        <div className="flex items-start gap-3 px-4 py-3 text-[var(--text-primary)]">
          <AlertTriangle className="mt-0.5 size-4 text-[var(--corange-400)]" />
          <div className="text-xs">
            <span className="font-medium">Only send SOL tokens to this address.</span> Sending other tokens may result in permanent loss.
          </div>
        </div>
      </Card>

      <DialogFooter className="px-0">
        <Button variant="outline" className="flex-1 uppercase border-[var(--brand-green-300)]/50 bg-[var(--brand-green-500)]/10 text-[var(--text-primary)]">
          Close
        </Button>
        <Button onClick={share} className="flex-1 uppercase bg-[var(--brand-green-500)] text-[var(--brand-green-950)]">
          Share
        </Button>
      </DialogFooter>
    </div>
  )
}


