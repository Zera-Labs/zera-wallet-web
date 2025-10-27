// Mock Privy transactions data matching https://docs.privy.io/api-reference/wallets/get-transactions

export type PrivyTransactionDetails = {
  type: 'transfer_sent' | 'transfer_received'
  chain: 'base' | 'solana' | string
  asset: 'eth' | 'usdc' | 'usdt' | 'sol' | 'pol' | string
  sender: string
  sender_privy_user_id?: string
  recipient: string
  recipient_privy_user_id?: string
  raw_value: string
  raw_value_decimals: number
  display_values: Record<string, string>
}

export type PrivyTransaction = {
  caip2: string
  transaction_hash: string
  status:
    | 'broadcasted'
    | 'confirmed'
    | 'execution_reverted'
    | 'failed'
    | 'replaced'
    | 'finalized'
    | 'provider_error'
    | 'pending'
  created_at: number
  privy_transaction_id: string
  wallet_id: string
  details: PrivyTransactionDetails
}

export type PrivyTransactionsResponse = {
  transactions: PrivyTransaction[]
  next_cursor: string | null
}

function randomHex(len: number): string {
  const chars = 'abcdef0123456789'
  let out = '0x'
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

function shortAddress(prefix = '0x'): string {
  return `${prefix}${randomHex(6).slice(2)}${randomHex(6).slice(2)}`
}

export function buildMockTransactions(walletId: string, count = 12): PrivyTransactionsResponse {
  const now = Date.now()
  const chains = [
    { caip2: 'eip155:8453', chain: 'base', asset: 'eth', decimals: 18 },
    { caip2: 'solana:mainnet', chain: 'solana', asset: 'sol', decimals: 9 },
  ] as const

  const statusCycle: PrivyTransaction['status'][] = [
    'pending',
    'confirmed',
    'failed',
    'broadcasted',
    'execution_reverted',
    'replaced',
    'finalized',
    'provider_error',
  ]

  const transactions: PrivyTransaction[] = Array.from({ length: count }).map((_, i) => {
    const which = chains[i % chains.length]
    const sent = i % 2 === 0
    const value = sent ? 0.00042 + i * 0.00003 : 0.0007 + i * 0.00004
    const display = value.toFixed(which.decimals > 12 ? 18 : 9)
    const assetKey = which.asset
    return {
      caip2: which.caip2,
      transaction_hash: randomHex(64),
      status: statusCycle[i % statusCycle.length],
      created_at: now - i * 60 * 60 * 1000,
      privy_transaction_id: `tx_${i.toString().padStart(4, '0')}`,
      wallet_id: walletId,
      details: {
        type: sent ? 'transfer_sent' : 'transfer_received',
        chain: which.chain,
        asset: which.asset,
        sender: sent ? shortAddress() : shortAddress(),
        recipient: sent ? shortAddress() : shortAddress(),
        raw_value: `${Math.round(value * 10 ** which.decimals)}`,
        raw_value_decimals: which.decimals,
        display_values: { [assetKey]: display },
      },
    }
  })

  return { transactions, next_cursor: null }
}


