import type { Position, Order, TradeHistory, Account, PositionSide } from '@/types'

export class TradingEngine {
  private account: Account
  private positions: Position[] = []
  private orders: Order[] = []
  private history: TradeHistory[] = []
  private positionCounter = 0
  private orderCounter = 0

  constructor(initialBalance: number = 10) {
    this.account = {
      balance: initialBalance,
      equity: initialBalance,
      availableMargin: initialBalance,
      usedMargin: 0
    }
  }

  public getAccount(): Account {
    return { ...this.account }
  }

  public getPositions(): Position[] {
    return [...this.positions]
  }

  public getOrders(): Order[] {
    return [...this.orders]
  }

  public getHistory(): TradeHistory[] {
    return [...this.history]
  }

  public openMarketPosition(
    side: PositionSide,
    size: number,
    leverage: number,
    currentPrice: number,
    stopLoss?: number,
    takeProfit?: number
  ): Position | null {
    // Validate inputs
    if (size <= 0 || leverage < 1 || leverage > 100 || currentPrice <= 0) {
      console.warn('Invalid position parameters')
      return null
    }

    const notional = size * currentPrice
    const margin = notional / leverage / currentPrice // Margin in BTC

    if (margin > this.account.availableMargin || !isFinite(margin)) {
      return null // Insufficient margin or invalid calculation
    }

    // Calculate liquidation price
    let liquidationPrice: number
    if (side === 'long') {
      liquidationPrice = currentPrice * (1 - 0.995 / leverage)
      if (stopLoss && stopLoss > liquidationPrice) {
        liquidationPrice = stopLoss
      }
    } else {
      liquidationPrice = currentPrice * (1 + 0.995 / leverage)
      if (stopLoss && stopLoss < liquidationPrice) {
        liquidationPrice = stopLoss
      }
    }

    const position: Position = {
      id: `pos_${++this.positionCounter}`,
      side,
      entryPrice: currentPrice,
      size,
      leverage,
      margin,
      stopLoss,
      takeProfit,
      openTime: Date.now(),
      unrealizedPnl: 0,
      unrealizedPnlPercent: 0,
      liquidationPrice
    }

    this.positions.push(position)
    this.updateAccount()

    return position
  }

  public placeLimitOrder(
    side: PositionSide,
    price: number,
    size: number,
    leverage: number,
    stopLoss?: number,
    takeProfit?: number
  ): Order | null {
    const notional = size * price
    const margin = notional / leverage / price

    if (margin > this.account.availableMargin) {
      return null
    }

    const order: Order = {
      id: `ord_${++this.orderCounter}`,
      side,
      type: 'limit',
      price,
      size,
      leverage,
      stopLoss,
      takeProfit,
      createdAt: Date.now()
    }

    this.orders.push(order)
    this.account.availableMargin -= margin

    return order
  }

  public cancelOrder(orderId: string): boolean {
    const index = this.orders.findIndex(o => o.id === orderId)
    if (index === -1) return false

    const order = this.orders[index]
    const margin = (order.size * order.price) / order.leverage / order.price
    this.account.availableMargin += margin

    this.orders.splice(index, 1)
    return true
  }

  public checkLimitOrders(currentPrice: number): Position[] {
    const filled: Position[] = []

    this.orders = this.orders.filter(order => {
      const shouldFill = order.side === 'long'
        ? currentPrice <= order.price
        : currentPrice >= order.price

      if (shouldFill) {
        const position = this.openMarketPosition(
          order.side,
          order.size,
          order.leverage,
          currentPrice,
          order.stopLoss,
          order.takeProfit
        )

        if (position) {
          filled.push(position)
        }
        return false
      }
      return true
    })

    return filled
  }

  public closePosition(
    positionId: string,
    currentPrice: number,
    reason: TradeHistory['closeReason'] = 'market'
  ): TradeHistory | null {
    const index = this.positions.findIndex(p => p.id === positionId)
    if (index === -1) return null

    const position = this.positions[index]
    const pnl = this.calculatePnL(position, currentPrice)
    const pnlPercent = (pnl / position.margin) * 100

    const trade: TradeHistory = {
      id: position.id,
      side: position.side,
      entryPrice: position.entryPrice,
      exitPrice: currentPrice,
      size: position.size,
      leverage: position.leverage,
      pnl,
      pnlPercent,
      openTime: position.openTime,
      closeTime: Date.now(),
      closeReason: reason
    }

    this.account.balance += pnl
    this.positions.splice(index, 1)
    this.history.unshift(trade)

    if (this.history.length > 100) {
      this.history.pop()
    }

    this.updateAccount()

    return trade
  }

  public updatePositions(currentPrice: number): {
    closed: TradeHistory[]
    liquidated: Position[]
  } {
    const closed: TradeHistory[] = []
    const liquidated: Position[] = []

    this.positions = this.positions.filter(position => {
      // Update unrealized PnL
      const pnl = this.calculatePnL(position, currentPrice)
      position.unrealizedPnl = pnl
      position.unrealizedPnlPercent = (pnl / position.margin) * 100

      // Check liquidation
      const isLiquidated = position.side === 'long'
        ? currentPrice <= position.liquidationPrice
        : currentPrice >= position.liquidationPrice

      if (isLiquidated) {
        liquidated.push(position)
        const trade = this.closePosition(position.id, position.liquidationPrice, 'liquidation')
        if (trade) closed.push(trade)
        return false
      }

      // Check stop loss
      if (position.stopLoss) {
        const slHit = position.side === 'long'
          ? currentPrice <= position.stopLoss
          : currentPrice >= position.stopLoss

        if (slHit) {
          const trade = this.closePosition(position.id, position.stopLoss, 'sl')
          if (trade) closed.push(trade)
          return false
        }
      }

      // Check take profit
      if (position.takeProfit) {
        const tpHit = position.side === 'long'
          ? currentPrice >= position.takeProfit
          : currentPrice <= position.takeProfit

        if (tpHit) {
          const trade = this.closePosition(position.id, position.takeProfit, 'tp')
          if (trade) closed.push(trade)
          return false
        }
      }

      return true
    })

    this.updateAccount()

    return { closed, liquidated }
  }

  private calculatePnL(position: Position, currentPrice: number): number {
    if (currentPrice <= 0 || position.entryPrice <= 0) {
      console.error('Invalid price in PnL calculation')
      return 0
    }

    const priceDiff = position.side === 'long'
      ? currentPrice - position.entryPrice
      : position.entryPrice - currentPrice

    const pnl = (priceDiff * position.size * position.leverage) / currentPrice
    
    return isFinite(pnl) ? pnl : 0
  }

  private updateAccount(): void {
    let unrealizedPnl = 0
    let usedMargin = 0

    this.positions.forEach(pos => {
      unrealizedPnl += pos.unrealizedPnl
      usedMargin += pos.margin
    })

    this.account.usedMargin = usedMargin
    this.account.equity = this.account.balance + unrealizedPnl
    this.account.availableMargin = this.account.equity - usedMargin
  }

  public getTotalUnrealizedPnl(): number {
    return this.positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0)
  }
}