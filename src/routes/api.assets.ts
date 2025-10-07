import { createFileRoute } from '@tanstack/react-router'

type Asset = {
  id: string
  name: string
  symbol: string
  chain: string
  price: number
  amount: number
  value: number
  pnl: number
}

// Simple in-memory dummy data so we can iterate on the UI
const assets: Asset[] = [
  {
    id: 'zera',
    name: 'ZERA',
    symbol: 'ZERA',
    chain: 'SOL',
    price: 0.01802379554,
    amount: 783760,
    value: 14126.23,
    pnl: 318.58,
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    chain: 'ETH',
    price: 129.01,
    amount: 129.01,
    value: 576640.32,
    pnl: 4478.31,
  },
  {
    id: 'sol',
    name: 'Solana',
    symbol: 'SOL',
    chain: 'SOL',
    price: 313.67,
    amount: 313.67,
    value: 354938.18,
    pnl: 71213.89,
  },
]

export const Route = createFileRoute('/api/assets')({
  server: {
    handlers: {
      GET: () => Response.json(assets),
    },
  },
})

