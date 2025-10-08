import { createFileRoute } from '@tanstack/react-router'

type Tx = {
  id: string
  fromSymbol: string
  toSymbol: string
  fromValue: number
  toValue: number
  at: string
}

function generateDummyTx(assetId: string): Tx[] {
  const now = Date.now()
  const map: Record<string, { symbol: string; pair: string }> = {
    zera: { symbol: 'ZERA', pair: 'SOL' },
    sol: { symbol: 'SOL', pair: 'USDC' },
    eth: { symbol: 'ETH', pair: 'USDT' },
  }
  const info = map[assetId] ?? { symbol: assetId.toUpperCase(), pair: 'USDC' }
  return Array.from({ length: 8 }).map((_, i) => ({
    id: `${assetId}-${i}`,
    fromSymbol: info.symbol,
    toSymbol: info.pair,
    fromValue: Math.round(100 * (1 + i * 0.13) * 100) / 100,
    toValue: Math.round(90 * (1 + i * 0.11) * 100) / 100,
    at: new Date(now - i * 36e5).toISOString(),
  }))
}

export const Route = createFileRoute('/api/assets/$assetId/transactions')({
  params: {
    parse: (p: Record<string, string>) => ({ assetId: p.assetId }),
    stringify: ({ assetId }: { assetId: string }) => ({ assetId }),
  },
  server: {
    handlers: {
      GET: ({ params }) => {
        const rows = generateDummyTx(params.assetId)
        return Response.json(rows)
      },
    },
  },
})


