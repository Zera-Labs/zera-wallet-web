import * as React from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowUpRight, Copy, AlertTriangle } from "lucide-react"
import { useUser } from "@/hooks/useUser"
import TokenSelect from "@/components/TokenSelect"
import QRCode from "react-qr-code"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

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
            </div>
          </div>
        </DialogHeader>
        {mode === "send" ? <SendView /> : <ReceiveView />}
      </DialogContent>
    </Dialog>
  )
}

// Formats a string of digits as an amount with 2 decimal places using implied cents
function formatCents(digits: string) {
  const onlyDigits = digits.replace(/\D/g, "")
  if (!onlyDigits) return ""
  const padded = onlyDigits.padStart(3, "0")
  const integer = padded.slice(0, -2).replace(/^0+/, "") || "0"
  const fractional = padded.slice(-2)
  return `${integer}.${fractional}`
}

function sanitizeDigits(value: string) {
  return value.replace(/\D/g, "")
}

function SendView() {
  const [token, setToken] = React.useState<string | undefined>(undefined)
  const [amountCents, setAmountCents] = React.useState("")
  const [recipient, setRecipient] = React.useState("")

  const formattedAmount = React.useMemo(() => formatCents(amountCents), [amountCents])

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm text-[var(--text-primary)]">Select token</label>
        <TokenSelect value={token} onChange={setToken} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-[var(--text-primary)]">Amount ({token})</label>
        <div className="relative">
          <Input
            inputMode="numeric" 
            pattern="\\d*"
            value={formattedAmount}
            onChange={(e) => setAmountCents(sanitizeDigits(e.target.value))}
            placeholder="0.00"
          />
          <Button
            variant="ghost"
            onClick={() => setAmountCents("0")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--brand-green-500)] text-sm"
          >
            MAX
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-[var(--text-primary)]">Recipient Wallet Address</label>
        <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="" />
      </div>

      <Card variant="outline" tone="green" className="rounded-md">
        <div className="flex flex-col gap-2 text-[var(--text-primary)]">
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
  // Amount request inputs can be added later if needed
  const [copied, setCopied] = React.useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {}
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm text-[var(--text-primary)]">Select token</label>
        <TokenSelect value={token} onChange={setToken} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-[var(--text-primary)]">Your wallet address</label>
        <div className="relative">
          <Input readOnly value={address} className="pr-8" />
          <Tooltip open={copied}>
            <TooltipTrigger asChild>
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 hover:opacity-80 hover:cursor-pointer" onClick={copy} aria-label="Copy">
                <Copy className="size-4 text-[var(--brand-green-500)]" />
              </button>
            </TooltipTrigger>
            <TooltipContent sideOffset={6}>Copied</TooltipContent>
          </Tooltip>
        </div>
        <Card variant="outline" tone="green" className="rounded-md">
          <div className="flex items-center justify-center h-[190px]">
            <div className="bg-white p-2 rounded">
              <QRCode value={`solana:${address}`} size={164} />
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
      </DialogFooter>
    </div>
  )
}


