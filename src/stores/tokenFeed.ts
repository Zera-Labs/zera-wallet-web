import { create } from 'zustand'

type LiveToken = {
  id: string
  price: number
  pnl: number
}

type State = {
  tokens: Record<string, LiveToken | undefined>
  listeners: Record<string, number>
  setToken: (id: string, data: LiveToken) => void
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
  const { listeners, setToken, tokens } = useTokenFeed.getState()
  const count = (listeners[id] ?? 0) + 1
  useTokenFeed.setState({ listeners: { ...listeners, [id]: count } })
  if (count > 1) return
  const current = tokens[id] ?? { id, price: 0, pnl: 0 }
  setToken(id, current)
}

export function releaseFeed(id: string) {
  const { listeners } = useTokenFeed.getState()
  const count = Math.max(0, (listeners[id] ?? 0) - 1)
  useTokenFeed.setState({ listeners: { ...listeners, [id]: count } })
}
