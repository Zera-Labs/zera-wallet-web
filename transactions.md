# Transactions: Ultra‑Low Latency Trading with Helius Sender

This document outlines how Zera builds and submits Solana transactions for traders with ultra‑low latency using Helius Sender, while safely adding a transparent platform fee. It covers architecture, required settings, fee design, best practices, endpoints, and example snippets.

## Goals

- Lowest possible end‑to‑end latency for swaps, trades, and sends
- High inclusion probability via dual routing (validators + Jito)
- Clear, consented platform fee collection
- Robustness under load with retries, dynamic fees, and connection warming

## Architecture Overview

1. Auth: Users authenticate via Privy and connect a browser extension wallet. We never custody private keys.
2. Build: Our app constructs a Versioned Transaction (v0) with:
   - User’s intended instructions (swap/trade/send)
   - Platform fee instruction (SOL or SPL)
   - Compute Budget instructions (limit + priority price)
   - Jito tip transfer to designated tip accounts
3. Sign: The user’s wallet signs the transaction.
4. Submit: We submit the base64‑encoded, signed wire transaction to Helius Sender.
5. Confirm: We track confirmation via RPC signature status checks.

Notes:
- All instructions are atomic: the whole transaction either lands or none does. Our fee instruction is included in the same transaction so we only collect if the user’s transaction succeeds.
- For best UX, we disclose and itemize fees in the UI and in wallet confirmation.

## Mandatory Settings (Helius Sender)

- skipPreflight: true (Sender optimized for speed over preflight)
- Tip: Minimum 0.001 SOL to a designated tip account (or 0.0005 SOL for SWQOS‑only)
- Priority Fee: Compute unit price via `ComputeBudgetProgram.setComputeUnitPrice`
- Compute Unit Limit: Set an appropriate limit (recommend simulation + 10% margin)

## Platform Fee Design

We support multiple fee models and ensure transparency in the UI and wallet prompt.

- Fixed SOL fee: Add a `SystemProgram.transfer` from user to our fee vault
- Percentage SOL fee: Compute lamports from user amount; transfer to fee vault
- SPL token fee: Add an additional SPL Token transfer to our token fee account (or use DEX aggregator’s platform fee mechanism when available)
- Hybrid: Gas + service fee combinations

Best practices:
- Place Compute Budget instructions first
- Place user instructions next
- Place platform fee instruction
- Place tip transfer last

This ordering keeps fee/tip most visible in wallet UIs and ensures all-or-nothing semantics remain intuitive.

## Dynamic Optimization

- Tip Sizing: Query Jito’s tip floor endpoint and use the 75th percentile with a minimum of 0.001 SOL
- Priority Fee: Use Helius Priority Fee API with `recommended: true`, add a safety multiplier (e.g., 1.2x)
- Compute Units: Simulate with a high limit (e.g., 1,400,000 CU), read `unitsConsumed`, then set limit to `max(1000, ceil(unitsConsumed * 1.1))`
- Retry Logic: Implement client‑side retry with backoff; set `maxRetries: 0` at submit time and manage retries ourselves
- Blockhash Freshness: Verify `lastValidBlockHeight` before each send attempt

## Endpoints

- Frontend/Browser: `https://sender.helius-rpc.com/fast` (global HTTPS; solves CORS preflight)
- Backend/Server (choose nearest region):
  - `http://slc-sender.helius-rpc.com/fast` (Salt Lake City)
  - `http://ewr-sender.helius-rpc.com/fast` (Newark)
  - `http://lon-sender.helius-rpc.com/fast` (London)
  - `http://fra-sender.helius-rpc.com/fast` (Frankfurt)
  - `http://ams-sender.helius-rpc.com/fast` (Amsterdam)
  - `http://sg-sender.helius-rpc.com/fast` (Singapore)
  - `http://tyo-sender.helius-rpc.com/fast` (Tokyo)

SWQOS‑only (cost‑optimized): append `?swqos_only=true` to any endpoint. Requires minimum 0.0005 SOL tip.

## Connection Warming

When idle > 1 minute between submissions, ping to keep connections warm and reduce cold‑start latency.

- HTTPS: `https://sender.helius-rpc.com/ping`
- Regional HTTP: `http://<region>-sender.helius-rpc.com/ping`

## Example: Building, Signing, and Submitting with Platform Fee

The following minimal example illustrates how to include platform fee, compute budget, priority fee, and tip in one atomic transaction. Adapt the `userInstruction` for swaps/trades/sends, and compute the platform fee per your model.

```typescript
import {
  Connection,
  TransactionMessage,
  VersionedTransaction,
  SystemProgram,
  PublicKey,
  ComputeBudgetProgram,
  Keypair,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

// Example: dynamic helpers (implement using Helius Priority Fee API + Jito tip API)
async function getPriorityFeeMicroLamports(): Promise<number> { /* ... */ return 50_000; }
async function getTipAmountSOL(): Promise<number> { /* 75th percentile w/ min 0.001 */ return 0.001; }

const TIP_ACCOUNTS = [
  '4ACfpUFoaSD9bfPdeu6DBt89gB6ENTeHBXCAi87NhDEE',
  'D2L6yPZ2FmmmTKPgzaMKdhu6EWZcTpLy1Vhx8uvZe7NZ',
  '9bnz4RShgq1hAnLnZbP8kbgBg1kEmcJBYQq3gQbmnSta',
];

export async function buildAndSend({
  connection,
  payer,
  userInstruction,
  platformFeeLamports,
  recipientForTip,
}: {
  connection: Connection;
  payer: Keypair; // for demo; in prod, use extension wallet signer
  userInstruction: any; // e.g., swap/trade/send instruction
  platformFeeLamports: number; // computed per our fee model
  recipientForTip?: string; // optional override tip account
}): Promise<string> {
  const { value: { blockhash, lastValidBlockHeight } } =
    await connection.getLatestBlockhashAndContext('confirmed');

  // Compute settings
  const priorityFee = await getPriorityFeeMicroLamports();
  const tipSOL = await getTipAmountSOL();
  const tipAccount = new PublicKey(
    recipientForTip ?? TIP_ACCOUNTS[Math.floor(Math.random() * TIP_ACCOUNTS.length)]
  );

  // Estimate compute (optional fast path: use cached typical values per action)
  const computeUnitLimit = 200_000; // or simulate and add 10% margin

  // Build instruction list in recommended order
  const instructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnitLimit }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityFee }),
    userInstruction,
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: new PublicKey('YOUR_FEE_VAULT_ADDRESS'),
      lamports: platformFeeLamports,
    }),
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: tipAccount,
      lamports: Math.floor(tipSOL * LAMPORTS_PER_SOL),
    }),
  ];

  const tx = new VersionedTransaction(
    new TransactionMessage({
      instructions,
      payerKey: payer.publicKey,
      recentBlockhash: blockhash,
    }).compileToV0Message()
  );

  tx.sign([payer]);

  const SENDER_ENDPOINT = 'https://sender.helius-rpc.com/fast';
  const res = await fetch(SENDER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now().toString(),
      method: 'sendTransaction',
      params: [
        Buffer.from(tx.serialize()).toString('base64'),
        { encoding: 'base64', skipPreflight: true, maxRetries: 0 },
      ],
    }),
  });

  const { result: signature, error } = await res.json();
  if (error) throw new Error(error.message);

  // Optional: poll for confirmation
  // await connection.confirmTransaction(signature, 'confirmed');
  return signature;
}
```

Notes:
- In production, delegate signing to the connected wallet instead of using a `Keypair` in app code.
- For SPL tokens, replace the SOL fee instruction with an SPL token transfer to the platform’s associated token account, or use the DEX/aggregator’s built‑in platform fee if supported.

## UX, Legal, and Safety

- Fee Transparency: Clearly display platform fee, tip, and any priority fee to users before signing. Show fiat equivalents when possible.
- Consent: Make platform fee opt‑in per jurisdictional requirements; log user acceptance.
- Limits & Safeguards: Cap maximum fee percentages and absolute values; prevent fee execution without the primary instruction present.
- Security: Never custody keys; minimize sensitive data; validate inputs; use allowlists for fee vaults.

## Operational Practices

- Rate Limits: Default ~15 TPS. For higher throughput, request upgrades (Professional plan).
- Monitoring: Track submission latency, inclusion times, and error rates by endpoint region.
- Fallbacks: If dual routing fails, support SWQOS‑only as an alternative mode.
- Caching: Cache priority fee and tip recommendations for short intervals (e.g., 1–3s) to reduce overhead under bursty load.

## Environment & Configuration

- Helius API Key: Store in env (e.g., `VITE_HELIUS_API_KEY`) and inject at build time.
- Regional Selection: Allow manual region override per user or per deployment.
- Feature Flags: Toggle SWQOS‑only mode, dynamic tip/priority fee, and connection warming.

## Quick Checklist

- [ ] Use Sender endpoint (global HTTPS for browser, regional HTTP for backend)
- [ ] Set `skipPreflight: true`, `maxRetries: 0`
- [ ] Include Compute Budget limit and priority price
- [ ] Add platform fee instruction (SOL or SPL) with clear UI disclosure
- [ ] Add Jito tip (>= 0.001 SOL; 0.0005 SOL for SWQOS‑only)
- [ ] Implement retries with blockhash freshness checks
- [ ] Warm connections during idle periods
- [ ] Monitor and tune dynamic tip/priority fee strategies

---

For questions or scaling support (higher TPS), contact Helius support and our team to coordinate endpoint selection and rate‑limit expansion.


