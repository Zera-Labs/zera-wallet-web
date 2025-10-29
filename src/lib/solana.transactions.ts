// Using Helius Enhanced Transactions API to fetch history and parsed transfers
import axios from 'axios'

export type SolanaTransactionsResponse = {
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
    transaction_id: string
    details: {
      type: 'transfer_sent' | 'transfer_received'
      chain: string
      asset: string // 'sol' or mint address for SPL
      mint: string
      sender: string
      recipient: string
      raw_value: string // lamports for SOL; raw token amount (no decimals) for SPL
      raw_value_decimals: number
      display_values: Record<string, string> // e.g., { sol: '0.1234' } or { spl: '10.5' }
    }
  }>
  next_cursor: string | null
}

export type HeliusTokenTransfer = {
  mint?: string
  fromUserAccount?: string
  toUserAccount?: string
  tokenAmount?: string | number
  amount?: string | number
  decimals?: number
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
  tokenTransfers?: HeliusTokenTransfer[]
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

function mapHeliusTxToDetails(address: string, tx: HeliusTransaction): SolanaTransactionsResponse['transactions'][number][] {
  const results: SolanaTransactionsResponse['transactions'][number][] = []

  // 1) All native SOL transfers involving the address
  const natives = (tx.nativeTransfers || []).filter(nt => nt && (nt.fromUserAccount === address || nt.toUserAccount === address) && (nt.amount ?? 0) !== 0)
  for (const native of natives) {
    if (typeof native.amount !== 'number') continue
    const sent = native.fromUserAccount === address
    results.push({
      transaction_hash: tx.signature,
      status: 'finalized',
      created_at: (tx.timestamp ? tx.timestamp * 1000 : Date.now()),
      transaction_id: `helius_${tx.signature.slice(0, 10)}`,
      details: {
        type: sent ? 'transfer_sent' : 'transfer_received',
        chain: 'solana',
        asset: 'sol',
        mint: 'sol11111111111111111111111111111111111111112',
        sender: native.fromUserAccount || '',
        recipient: native.toUserAccount || '',
        raw_value: String(native.amount),
        raw_value_decimals: 9,
        display_values: { sol: (native.amount / 1_000_000_000).toString() },
      },
    })
  }

  // 2) Fallback single SOL event if no nativeTransfers parsed
  if (results.length === 0) {
    const solEvent = (tx as any)?.events?.sol as { from?: string; to?: string; amount?: number } | undefined
    if (solEvent && (solEvent.from === address || solEvent.to === address) && typeof solEvent.amount === 'number' && solEvent.amount !== 0) {
      const sent = solEvent.from === address
      const lamports = Math.round(solEvent.amount * 1_000_000_000)
      results.push({
        transaction_hash: tx.signature,
        status: 'finalized',
        created_at: (tx.timestamp ? tx.timestamp * 1000 : Date.now()),
        transaction_id: `helius_${tx.signature.slice(0, 10)}`,
        details: {
          type: sent ? 'transfer_sent' : 'transfer_received',
          chain: 'solana',
          asset: 'sol',
          mint: 'sol11111111111111111111111111111111111111112',
          sender: solEvent.from || '',
          recipient: solEvent.to || '',
          raw_value: String(lamports),
          raw_value_decimals: 9,
          display_values: { sol: String(solEvent.amount) },
        },
      })
    }
  }

  // 3) All SPL token transfers involving the address (e.g., swaps)
  const tokenList = (tx.tokenTransfers || (tx as any).events?.tokenTransfers || (tx as any).events?.fungibleTokenTransfers || []) as HeliusTokenTransfer[]
  const tokenTransfers = tokenList.filter((tt) => tt && (tt.fromUserAccount === address || tt.toUserAccount === address))
  for (const token of tokenTransfers) {
    const inputDecimals = typeof token.decimals === 'number' ? token.decimals : undefined
    let uiStr: string | undefined = token.tokenAmount != null ? String(token.tokenAmount) : undefined
    const amtStr = token.amount != null ? String(token.amount) : undefined
    if (!uiStr && amtStr && amtStr.includes('.')) uiStr = amtStr
    let decimalsUsed = inputDecimals
    let rawValue: string | undefined = (!amtStr || (amtStr && amtStr.includes('.'))) ? undefined : amtStr
    if (!rawValue) {
      const inferred = decimalsUsed ?? (uiStr && uiStr.includes('.') ? Math.min(12, uiStr.split('.')[1].length) : 0)
      decimalsUsed = inferred
      const ui = Number(uiStr ?? '0')
      const mult = Math.pow(10, inferred)
      rawValue = Number.isFinite(ui) ? String(Math.round(ui * mult)) : '0'
    }
    const absRaw = (() => { try { const b = BigInt(rawValue!); return b < 0n ? (-b).toString() : b.toString() } catch { return rawValue! } })()
    const sent = token.fromUserAccount === address
    const display = (() => {
      const n = Number(absRaw)
      return (decimalsUsed ?? 0) > 0 && Number.isFinite(n) ? (n / 10 ** (decimalsUsed ?? 0)).toString() : (uiStr ?? absRaw)
    })()
    results.push({
      transaction_hash: tx.signature,
      status: 'finalized',
      created_at: (tx.timestamp ? tx.timestamp * 1000 : Date.now()),
      transaction_id: `helius_${tx.signature.slice(0, 10)}`,
      details: {
        type: sent ? 'transfer_sent' : 'transfer_received',
        chain: 'solana',
        asset: String(token.mint || 'spl'),
        mint: token.mint || '',
        sender: token.fromUserAccount || '',
        recipient: token.toUserAccount || '',
        raw_value: absRaw,
        raw_value_decimals: decimalsUsed ?? 0,
        display_values: { spl: display },
      },
    })
  }

  return results
}

export async function getTransactionsForAddress(
  address: string,
  limit = 25,
  opts?: { before?: string; fetchAll?: boolean; maxPages?: number; dropZero?: boolean }
): Promise<SolanaTransactionsResponse> {
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
  const out: Array<SolanaTransactionsResponse['transactions'][number]> = []
  for (const t of heliusTxs) {
    const mappedList = mapHeliusTxToDetails(address, t)
    if (!mappedList || mappedList.length === 0) {
      if (opts?.dropZero === false) {
        out.push({
          transaction_hash: t.signature,
          status: 'finalized',
          created_at: (t.timestamp ? t.timestamp * 1000 : Date.now()),
          transaction_id: `helius_${t.signature.slice(0, 10)}`,
          details: {
            type: 'transfer_received',
            chain: 'solana',
            asset: 'sol',
            mint: 'sol11111111111111111111111111111111111111112',
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
    for (const mapped of mappedList) {
      if (opts?.dropZero !== false) {
        try { if (BigInt(mapped.details.raw_value) === 0n) continue } catch { if (mapped.details.raw_value === '0') continue }
      }
      out.push(mapped)
    }
  }

  // Deduplicate by transaction_hash: prefer SPL over SOL when both exist
  function pickBetter(existing: SolanaTransactionsResponse['transactions'][number], candidate: SolanaTransactionsResponse['transactions'][number]) {
    const exIsSol = existing.details.asset.toLowerCase() === 'sol'
    const caIsSol = candidate.details.asset.toLowerCase() === 'sol'
    if (exIsSol && !caIsSol) return candidate
    if (!exIsSol && caIsSol) return existing
    const exRecv = existing.details.type === 'transfer_received'
    const caRecv = candidate.details.type === 'transfer_received'
    if (!exRecv && caRecv) return candidate
    if (exRecv && !caRecv) return existing
    try {
      const exRaw = BigInt(existing.details.raw_value)
      const caRaw = BigInt(candidate.details.raw_value)
      if (caRaw > exRaw) return candidate
    } catch {}
    return existing
  }
  const seenByHash = new Map<string, SolanaTransactionsResponse['transactions'][number]>()
  for (const item of out) {
    const key = item.transaction_hash
    const existing = seenByHash.get(key)
    if (!existing) { seenByHash.set(key, item); continue }
    seenByHash.set(key, pickBetter(existing, item))
  }
  const deduped = Array.from(seenByHash.values())

  const nextCursor = heliusTxs.length > 0 ? String(heliusTxs[heliusTxs.length - 1].signature) : null
  return { transactions: deduped, next_cursor: nextCursor }
}
