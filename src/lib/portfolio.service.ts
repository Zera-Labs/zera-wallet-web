import type { Portfolio, Holding } from '@/lib/portfolio'
import { mockPortfolio } from '@/data/privy.mock'

// Thin abstraction to prepare for swapping in real APIs/websockets later.
export interface PortfolioService {
  getPortfolioByOwner(owner: string): Promise<Portfolio | undefined>
  listHoldings(owner: string): Promise<Holding[]>
  getHoldingBySymbol(owner: string, symbol: string): Promise<Holding | undefined>
}

class MockPortfolioService implements PortfolioService {
  async getPortfolioByOwner(owner: string): Promise<Portfolio | undefined> {
    return owner === mockPortfolio.owner ? mockPortfolio : undefined
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

export const portfolioService: PortfolioService = new MockPortfolioService()


