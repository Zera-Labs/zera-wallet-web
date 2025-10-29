import * as React from 'react'
import { Button } from '@/components/ui/button'
import { useNavigate } from '@tanstack/react-router'
//
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { usePrivy } from '@privy-io/react-auth'

function shortenAddress(address: string) {
	if (!address) return ''
	return address.length > 10 ? `${address.slice(0, 4)}…${address.slice(-4)}` : address
}

function getFirstSolanaAddress(user: any): string | undefined {
	if (!user) return undefined
	const wallets = (user as any).wallets as any[] | undefined
	if (Array.isArray(wallets)) {
		const sol = wallets.find((w) => w?.chainType === 'solana' || w?.chain === 'solana')
		if (sol?.address) return sol.address as string
	}
	const linked = (user as any).linkedAccounts as any[] | undefined
	if (Array.isArray(linked)) {
		const sol = linked.find((acc) => acc?.type === 'wallet' && (acc?.chainType === 'solana' || acc?.chain === 'solana'))
		if (sol?.address) return sol.address as string
	}
	return undefined
}

export default function WalletAuthButtonClient() {
    const { ready, authenticated, login, logout, user } = usePrivy()
    const navigate = useNavigate()
    const [open, setOpen] = React.useState(false)

	const address = getFirstSolanaAddress(user)
	const label = address ? shortenAddress(address) : 'Account'

    if (!authenticated) {
		return (
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Button
						variant="outline"
						className={'w-full h-11 rounded-[12px]'}
					>
                        Sign in with Solana
					</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-md rounded-2xl border border-sidebar-border bg-background p-6 shadow-xl">
					<DialogHeader className="flex flex-col items-start gap-2 px-0 py-0">
						<DialogTitle className="text-lg">Connect your wallet</DialogTitle>
						<DialogDescription className="text-sm">
							Connect a Solana wallet, then authenticate to continue.
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-3 mt-4">
						<Button
							variant="default"
							className="w-full h-11 rounded-[12px]"
                            disabled={!ready}
                            onClick={async () => {
                                try {
                                    await login?.()
                                    setOpen(false)
                                } catch {}
                            }}
						>
                            Sign in with Solana
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		)
	}

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className={'w-full h-11 rounded-[12px]'}
                >
                    {label}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl border border-sidebar-border bg-background p-6 shadow-xl">
                <DialogHeader className="flex flex-col items-start gap-2 px-0 py-0">
                    <DialogTitle className="text-lg">Account</DialogTitle>
                    <DialogDescription className="text-sm">{label}</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 mt-4">
                    <Button
                        variant="default"
                        className="w-full h-11 rounded-[12px]"
                        onClick={async () => {
                            try { await logout?.() } catch {}
                            setOpen(false)
                            navigate({ to: '/login' })
                        }}
                    >
                        Log out
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
