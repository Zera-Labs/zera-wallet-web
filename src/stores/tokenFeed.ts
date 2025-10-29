import { create } from 'zustand'
import type { PriceMessageData } from '@/lib/priceSocket.schema'

type State = {
  tokens: Record<string, PriceMessageData | undefined>
  listeners: Record<string, number>
  setToken: (id: string, data: PriceMessageData) => void
}

export const useTokenFeed = create<State>((set) => ({
  tokens: {},
  listeners: {},
  setToken: (id, data) => set((s) => ({ tokens: { ...s.tokens, [id]: data } })),
}))

export function useLiveToken(id: string) {
  return useTokenFeed((s) => s.tokens[id])
}

export function ensureFeed(id: string) {
  const { listeners } = useTokenFeed.getState()
  const count = (listeners[id] ?? 0) + 1
  useTokenFeed.setState({ listeners: { ...listeners, [id]: count } })
  // No-op beyond tracking listeners; token data will be populated by the websocket
}

export function releaseFeed(id: string) {
  const { listeners } = useTokenFeed.getState()
  const count = Math.max(0, (listeners[id] ?? 0) - 1)
  useTokenFeed.setState({ listeners: { ...listeners, [id]: count } })
}
