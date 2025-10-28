import type { Portfolio, Holding } from '@/lib/portfolio'
import { Address, Commitment, createSolanaRpc } from '@solana/kit'

// Thin abstraction to prepare for swapping in real APIs/websockets later.
export interface PortfolioService {
  getPortfolioByOwner(owner: string): Promise<Portfolio | undefined>
  listHoldings(owner: string): Promise<Holding[]>
  getHoldingBySymbol(owner: string, symbol: string): Promise<Holding | undefined>
}

class SolanaPortfolioService implements PortfolioService {
  private rpc = createSolanaRpc('https://api.mainnet-beta.solana.com')

  private async fetchSolBalance(address: string): Promise<{ amount: number; priceUsd: number }> {
    const { value } = await this.rpc
      .getBalance(address as Address, { commitment: 'confirmed' as Commitment })
      .send()
    const lamports = Number(value)
    const amount = lamports / 1_000_000_000
    // Placeholder pricing; integrate a real price feed later
    const priceUsd = 1
    return { amount, priceUsd }
  }

  async getPortfolioByOwner(owner: string): Promise<Portfolio | undefined> {
    const { amount, priceUsd } = await this.fetchSolBalance(owner)
    const valueUsd = Number((amount * priceUsd).toFixed(2))
    const holdings: Holding[] = [
      {
        chain: 'solana',
        address: owner,
        mint: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        amountRaw: String(Math.round(amount * 1_000_000_000)),
        amount,
        priceUsd,
        valueUsd,
        avgCostUsd: undefined,
        unrealizedPnlUsd: undefined,
        realizedPnlUsd: 0,
      },
    ]
    return {
      owner,
      holdings,
      totalValueUsd: valueUsd,
    }
  }

  async listHoldings(owner: string): Promise<Holding[]> {
    const p = await this.getPortfolioByOwner(owner)
    return p?.holdings ?? []
  }

  async getHoldingBySymbol(owner: string, symbol: string): Promise<Holding | undefined> {
    const holdings = await this.listHoldings(owner)
    return holdings.find((h) => h.symbol.toLowerCase() === symbol.toLowerCase())
  }
}

export const portfolioService: PortfolioService = new SolanaPortfolioService()


