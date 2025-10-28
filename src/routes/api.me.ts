import { createFileRoute } from '@tanstack/react-router'
import { verifyRequestAndGetUser } from '@/lib/privy.server'

export const Route = createFileRoute('/api/me')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await verifyRequestAndGetUser(request)
        return Response.json(user)
      },
    },
  },
})

