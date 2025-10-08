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

const timers = new Map<string, number>()

// This function is used to ensure that the feed is running for the given token.
// If the feed is already running, it will return early.
// If the feed is not running, it will start the feed and return the current token data.
// The feed will run every 5 seconds and update the token data
// Currently randomising the price and pnl with a small drift.
export function ensureFeed(id: string) {
  const { listeners, setToken, tokens } = useTokenFeed.getState()
  const count = (listeners[id] ?? 0) + 1
  useTokenFeed.setState({ listeners: { ...listeners, [id]: count } })
  if (count > 1) return

  const current = tokens[id] ?? { id, price: 1, pnl: 0 }
  setToken(id, current)

  const timer = window.setInterval(() => {
    useTokenFeed.setState((s) => {
      const prev = s.tokens[id] ?? { id, price: 1, pnl: 0 }
      const drift = (Math.random() - 0.5) * 0.02 * Math.max(1, prev.price)
      const nextPrice = Math.max(0, prev.price + drift)
      const nextPnl = Math.max(-99, Math.min(99, (prev.pnl + (Math.random() - 0.5) * 0.5)))
      return { tokens: { ...s.tokens, [id]: { id, price: nextPrice, pnl: nextPnl } } }
    })
  }, 5000)
  timers.set(id, timer)
}

export function releaseFeed(id: string) {
  const { listeners } = useTokenFeed.getState()
  const count = Math.max(0, (listeners[id] ?? 0) - 1)
  useTokenFeed.setState({ listeners: { ...listeners, [id]: count } })
  if (count === 0) {
    const t = timers.get(id)
    if (t) window.clearInterval(t)
    timers.delete(id)
  }
}


