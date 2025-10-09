import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-[8px] border px-[6px] py-[4px] text-sm leading-[1.25] font-medium w-fit whitespace-nowrap shrink-0 min-h-[20px] gap-1.5 [&>svg]:size-3 [&>svg]:pointer-events-none transition-[color,background-color,border-color,box-shadow] focus-visible:outline-none overflow-hidden",
  {
    variants: {
      variant: {
        // Primary (filled green)
        default:
          "border-transparent bg-[var(--brand-green)] text-[var(--primary-foreground)] focus-visible:ring-[3px] focus-visible:ring-[var(--brand-light-green)]",
        // Secondary (neutral/subtle)
        secondary:
          "border-transparent bg-white/10 text-foreground/75 focus-visible:ring-[3px] focus-visible:ring-[var(--brand-light-green)]",
        // Destructive (filled red)
        destructive:
          "border-transparent bg-destructive text-white focus-visible:ring-[3px] focus-visible:ring-red-500/40",
        // Outline (transparent with border and green text)
        outline:
          "bg-[var(--brand-green-900)] border-[var(--brand-green-300)] text-[var(--brand-green)] focus-visible:ring-[3px] focus-visible:ring-[var(--brand-light-green)]",
        // Ghost (text only)
        ghost:
          "border-transparent bg-transparent text-foreground focus-visible:ring-[3px] focus-visible:ring-[var(--brand-light-green)]",
        // Balance badge; tone applied via compound variants
        balance: "border-transparent",
      },
      tone: {
        green: null,
        red: null,
      },
    },
    compoundVariants: [
      {
        variant: "balance",
        tone: "green",
        class:
          "bg-[var(--brand-dark-green)] text-[var(--brand-green)] focus-visible:ring-[3px] focus-visible:ring-[var(--brand-light-green)]",
      },
      {
        variant: "balance",
        tone: "red",
        class:
          "bg-[rgba(62,34,34,0.5)] text-[#ff8d8d] focus-visible:ring-[3px] focus-visible:ring-red-500/40",
      },
    ],
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  balanceTone,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean; balanceTone?: "green" | "red" }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, tone: balanceTone }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
