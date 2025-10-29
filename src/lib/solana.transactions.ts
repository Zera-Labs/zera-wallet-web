// Using Helius Enhanced Transactions API to fetch history and parsed transfers
import axios from 'axios'

export type TransactionsResponse = {
  transactions: Array<{
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
    details: {
      type: 'transfer_sent' | 'transfer_received'
      chain: string
      asset: string // 'sol' or mint address for SPL
      sender: string
      recipient: string
      raw_value: string // lamports for SOL; raw token amount (no decimals) for SPL
      raw_value_decimals: number
      display_values: Record<string, string> // e.g., { sol: '0.1234' } or { spl: '10.5' }
    }
  }>
  next_cursor: string | null
}

type HeliusTransaction = {
  signature: string
  timestamp?: number
  type?: string
  nativeTransfers?: Array<{
    fromUserAccount?: string
    toUserAccount?: string
    amount?: number // lamports
  }>
  tokenTransfers?: Array<{
    mint?: string
    fromUserAccount?: string
    toUserAccount?: string
    tokenAmount?: string | number // may be raw or ui per provider variant
    amount?: string | number
    decimals?: number
  }>
  events?: any
}

function getHeliusApiKey(): string {
  const key = process.env.HELIUS_API_KEY as string | undefined
  if (!key) throw new Error('Missing HELIUS_API_KEY env var')
  return key
}

export async function fetchHeliusAddressTransactions(address: string, params: { before?: string; limit?: number; type?: string }) {
  const key = getHeliusApiKey()
  const base = `https://api.helius.xyz/v0/addresses/${encodeURIComponent(address)}/transactions?api-key=${encodeURIComponent(key)}`
  const url = new URL(base)
  if (params.limit) url.searchParams.set('limit', String(params.limit))
  if (params.before) url.searchParams.set('before', params.before)
  if (params.type) url.searchParams.set('type', params.type)
  try {
    const res = await axios.get<HeliusTransaction[]>(url.toString(), {
      validateStatus: () => true,
      timeout: 20000,
    })
    if (res.status >= 200 && res.status < 300) {
      return Array.isArray(res.data) ? res.data : []
    }
    const body = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
    throw new Error(`Helius request failed ${res.status}: ${body}`)
  } catch (err: any) {
    const code = err?.code ? ` code=${err.code}` : ''
    const msg = err?.message || 'Unknown axios error'
    throw new Error(`Helius axios error${code}: ${msg}`)
  }
}

function mapHeliusTxToDetails(address: string, tx: HeliusTransaction): TransactionsResponse['transactions'][number] | null {
  // Prefer native SOL transfer involving the address
  const native = (tx.nativeTransfers || []).find(nt => nt && (nt.fromUserAccount === address || nt.toUserAccount === address) && (nt.amount ?? 0) !== 0)
  if (native && typeof native.amount === 'number') {
    const sent = native.fromUserAccount === address
    return {
      transaction_hash: tx.signature,
      status: 'finalized',
      created_at: (tx.timestamp ? tx.timestamp * 1000 : Date.now()),
      privy_transaction_id: `helius_${tx.signature.slice(0, 10)}`,
      details: {
        type: sent ? 'transfer_sent' : 'transfer_received',
        chain: 'solana',
        asset: 'sol',
        sender: native.fromUserAccount || '',
        recipient: native.toUserAccount || '',
        raw_value: String(native.amount),
        raw_value_decimals: 9,
        display_values: { sol: (native.amount / 1_000_000_000).toString() },
      },
    }
  }

  // Fallback: events.sol structure
  const solEvent = (tx as any)?.events?.sol as { from?: string; to?: string; amount?: number } | undefined
  if (solEvent && (solEvent.from === address || solEvent.to === address) && typeof solEvent.amount === 'number' && solEvent.amount !== 0) {
    const sent = solEvent.from === address
    const lamports = Math.round(solEvent.amount * 1_000_000_000)
    return {
      transaction_hash: tx.signature,
      status: 'finalized',
      created_at: (tx.timestamp ? tx.timestamp * 1000 : Date.now()),
      privy_transaction_id: `helius_${tx.signature.slice(0, 10)}`,
      details: {
        type: sent ? 'transfer_sent' : 'transfer_received',
        chain: 'solana',
        asset: 'sol',
        sender: solEvent.from || '',
        recipient: solEvent.to || '',
        raw_value: String(lamports),
        raw_value_decimals: 9,
        display_values: { sol: String(solEvent.amount) },
      },
    }
  }

  // Then try token transfers
  const token = (tx.tokenTransfers || (tx as any).events?.tokenTransfers || (tx as any).events?.fungibleTokenTransfers || [])
    .find((tt: any) => tt && (tt.fromUserAccount === address || tt.toUserAccount === address))
  if (token) {
    const decimals = typeof token.decimals === 'number' ? token.decimals : 0
    const rawStr = token.tokenAmount != null ? String(token.tokenAmount) : (token.amount != null ? String(token.amount) : '0')
    // If `amount` looks non-integer while decimals known, compute raw as ui * 10^decimals
    let rawValue = rawStr
    if (rawStr.includes('.') && decimals > 0) {
      const ui = Number(rawStr)
      if (Number.isFinite(ui)) rawValue = Math.round(ui * 10 ** decimals).toString()
    }
    const absRaw = (() => { try { const b = BigInt(rawValue); return b < 0n ? (-b).toString() : b.toString() } catch { return rawValue } })()
    const sent = token.fromUserAccount === address
    const display = (() => {
      const n = Number(absRaw)
      return decimals > 0 && Number.isFinite(n) ? (n / 10 ** decimals).toString() : absRaw
    })()
    return {
      transaction_hash: tx.signature,
      status: 'finalized',
      created_at: (tx.timestamp ? tx.timestamp * 1000 : Date.now()),
      privy_transaction_id: `helius_${tx.signature.slice(0, 10)}`,
      details: {
        type: sent ? 'transfer_sent' : 'transfer_received',
        chain: 'solana',
        asset: String(token.mint || 'spl'),
        sender: token.fromUserAccount || '',
        recipient: token.toUserAccount || '',
        raw_value: absRaw,
        raw_value_decimals: decimals,
        display_values: { spl: display },
      },
    }
  }
  return null
}

export async function getTransactionsForAddress(
  address: string,
  limit = 25,
  opts?: { before?: string; fetchAll?: boolean; maxPages?: number; dropZero?: boolean }
): Promise<TransactionsResponse> {
  // Fetch Helius transactions with pagination
  const pageLimit = Math.min(10, Math.max(1, limit))
  const maxPages = Math.max(1, opts?.maxPages ?? (opts?.fetchAll ? 100 : 1))
  let before = opts?.before
  const heliusTxs: HeliusTransaction[] = []
  for (let page = 0; page < maxPages; page++) {
    const batch = await fetchHeliusAddressTransactions(address, { before, limit: pageLimit })
    if (!Array.isArray(batch) || batch.length === 0) break
    heliusTxs.push(...batch)
    before = batch[batch.length - 1]?.signature
    if (!opts?.fetchAll) break
    if (batch.length < pageLimit) break
  }

  // Map to our response shape
  const out: Array<TransactionsResponse['transactions'][number]> = []
  for (const t of heliusTxs) {
    const mapped = mapHeliusTxToDetails(address, t)
    if (!mapped) {
      if (opts?.dropZero === false) {
        out.push({
          transaction_hash: t.signature,
          status: 'finalized',
          created_at: (t.timestamp ? t.timestamp * 1000 : Date.now()),
          privy_transaction_id: `helius_${t.signature.slice(0, 10)}`,
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
        })
      }
      continue
    }
    if (opts?.dropZero !== false) {
      try { if (BigInt(mapped.details.raw_value) === 0n) continue } catch { if (mapped.details.raw_value === '0') continue }
    }
    out.push(mapped)
  }

  const nextCursor = heliusTxs.length > 0 ? String(heliusTxs[heliusTxs.length - 1].signature) : null
  return { transactions: out, next_cursor: nextCursor }
}
