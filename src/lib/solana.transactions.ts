import { Address, Commitment, createSolanaRpc } from '@solana/kit'

export type TransactionsResponse = {
  transactions: Array<{
    caip2: string
    transaction_hash: string
    status: 'broadcasted' | 'confirmed' | 'execution_reverted' | 'failed' | 'replaced' | 'finalized' | 'provider_error' | 'pending'
    created_at: number
    privy_transaction_id: string
    wallet_id: string
    details: {
      type: 'transfer_sent' | 'transfer_received'
      chain: string
      asset: string
      sender: string
      recipient: string
      raw_value: string
      raw_value_decimals: number
      display_values: Record<string, string>
    }
  }>
  next_cursor: string | null
}

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com')

export async function getTransactionsForAddress(address: string, limit = 20): Promise<TransactionsResponse> {
  const sigs = await rpc.getSignaturesForAddress(address as Address, { limit }).send()
  const txs = sigs.map((s, i) => ({
    caip2: 'solana:mainnet',
    transaction_hash: s.signature,
    status: s.confirmationStatus === 'finalized' ? 'finalized' : 'confirmed',
    created_at: (Number(s.blockTime ?? 0)) * 1000,
    privy_transaction_id: `sig_${i}_${s.signature.slice(0, 8)}`,
    wallet_id: address,
    details: {
      type: 'transfer_received',
      chain: 'solana',
      asset: 'sol',
      sender: '',
      recipient: '',
      raw_value: '0',
      raw_value_decimals: 9,
      display_values: { sol: '' },
    },
  }))
  return { transactions: txs, next_cursor: null }
}


