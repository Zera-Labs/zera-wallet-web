import { createFileRoute } from '@tanstack/react-router'
import { verifyRequestAndGetUser } from '@/lib/privy.server'
import axios from 'axios'

export const Route = createFileRoute('/api/token/$tokenId/asset')({
  params: {
    parse: (p: Record<string, string>) => ({ tokenId: p.tokenId }),
    stringify: ({ tokenId }: { tokenId: string }) => ({ tokenId }),
  },
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        await verifyRequestAndGetUser(request)
        const mint = (params as { tokenId: string }).tokenId
        const key = process.env.HELIUS_API_KEY as string | undefined
        if (!key) return new Response('Missing HELIUS_API_KEY', { status: 500 })

        const url = `https://mainnet.helius-rpc.com/?api-key=${encodeURIComponent(key)}`
        try {
          const res = await axios.post(url, {
            jsonrpc: '2.0',
            id: '1',
            method: 'getAsset',
            params: { id: mint },
          }, { validateStatus: () => true, timeout: 20000 })

          if (res.status < 200 || res.status >= 300) {
            const body = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
            return new Response(`Helius DAS error ${res.status}: ${body}`, { status: 502 })
          }

          const content = res.data?.result?.content
          const files: Array<{ uri?: string; cdn_uri?: string; mime?: string }> = content?.files ?? []
          const firstImage = files.find((f) => typeof f?.mime === 'string' && f.mime.startsWith('image/'))
          const image = firstImage?.cdn_uri || firstImage?.uri || null
          const name: string | undefined = content?.metadata?.name || content?.metadata?.symbol
          const symbol: string | undefined = content?.metadata?.symbol || content?.metadata?.name
          const body = { image, name, symbol }
          return Response.json(body, {
            headers: {
              // Cache at browser and edge; images change rarely
              'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
            },
          })
        } catch (err: any) {
          const msg = err?.message || 'axios error'
          return new Response(`Helius axios error: ${msg}`, { status: 502 })
        }
      },
    },
  },
})

