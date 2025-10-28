import { createFileRoute } from '@tanstack/react-router'

const JUP_PRICE_URL = 'https://price.jup.ag/v6/price'

function parseMints(url: URL): string[] {
  const raw = url.searchParams.get('mints') || url.searchParams.get('ids') || ''
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export const Route = createFileRoute('/api/prices')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const mints = parseMints(url)
        if (mints.length === 0) return Response.json({ data: {} })

        const upstream = new URL(JUP_PRICE_URL)
        upstream.searchParams.set('ids', mints.join(','))

        try {
          const res = await fetch(upstream.toString(), {
            headers: { 'accept': 'application/json' },
          })
          if (!res.ok) throw new Error('Upstream error')
          const json = await res.json()
          return new Response(JSON.stringify(json), {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=10',
            },
          })
        } catch {
          // Graceful degradation: return empty map so callers display 0s
          return new Response(JSON.stringify({ data: {} }), {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=10',
            },
          })
        }
      },
    },
  },
})

