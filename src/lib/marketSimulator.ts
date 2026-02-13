import type { Candle, TimeFrame } from '@/types'
import { randomNormal } from '@/lib/utils'

export class MarketSimulator {
  private currentPrice: number
  private initialPrice: number
  private volatility: number
  private volatilityState: number
  private drift: number
  private lastUpdate: number
  private candles: Map<TimeFrame, Candle[]> = new Map()
  private currentCandle: Map<TimeFrame, Candle> = new Map()
  private lastCandleTime: Map<TimeFrame, number> = new Map()
  private shockEvent: {
    active: boolean
    intensity: number
    duration: number
    elapsed: number
    direction: 1 | -1
  } | null = null
  private microTrend: number = 0
  private trendStrength: number = 0
  private momentumBias: number = 0
  private lastPriceChange: number = 0
  private orderFlowImbalance: number = 0

  constructor(startPrice: number) {
    this.currentPrice = startPrice
    this.initialPrice = startPrice
    this.volatility = 0.00015 + Math.random() * 0.0003 // Random base volatility 0.015-0.045%
    this.volatilityState = 0
    this.drift = (Math.random() - 0.5) * 0.00004 // Random drift -0.002% to +0.002%
    this.lastUpdate = Date.now()

    // Initialize candles for all timeframes
    const timeframes: TimeFrame[] = ['1s', '10s', '30s', '1m', '5m', '15m']
    const now = Date.now()
    
    timeframes.forEach(tf => {
      const interval = this.getTimeframeMs(tf)
      const candleList = this.generateInitialCandles(tf, startPrice)
      this.candles.set(tf, candleList)
      this.lastCandleTime.set(tf, now)
      
      // Initialize current candle to ensure continuity with last historical candle
      const currentInterval = Math.floor(now / interval) * interval
      const lastCandle = candleList[candleList.length - 1]
      
      // Current candle starts where the last historical candle ended
      this.currentCandle.set(tf, {
        time: currentInterval,
        open: lastCandle.close,
        high: Math.max(lastCandle.close, startPrice),
        low: Math.min(lastCandle.close, startPrice),
        close: startPrice,
        volume: Math.random() * 2
      })
    })
  }

  private generateInitialCandles(timeframe: TimeFrame, startPrice: number): Candle[] {
    const candles: Candle[] = []
    const now = Date.now()
    const interval = this.getTimeframeMs(timeframe)
    
    let price = startPrice
    let localTrend = 0
    let localVol = this.volatility
    
    // Generate 200 historical candles working backwards with realistic patterns
    for (let i = 200; i > 0; i--) {
      const time = now - i * interval
      
      // Evolve local trend randomly
      if (Math.random() < 0.1) {
        localTrend = (Math.random() - 0.5) * 0.002
      }
      localTrend *= 0.95 // Decay
      
      // Evolve volatility
      localVol = localVol * 0.98 + (0.0002 + Math.random() * 0.0003) * 0.02
      
      // Random walk with trend
      const baseChange = (Math.random() - 0.5 + localTrend) * localVol * (5 + Math.random() * 5)
      
      // Occasional larger moves (fat tails)
      const largeMove = Math.random() < 0.05 ? (Math.random() - 0.5) * localVol * 20 : 0
      
      const close = price
      const open = price * (1 - baseChange - largeMove)
      
      // More realistic wick generation
      const wickRange = Math.abs(open - close) * (1 + Math.random() * 2)
      const wickBias = Math.random() - 0.5
      const high = Math.max(open, close) + wickRange * Math.max(0, wickBias) * Math.random()
      const low = Math.min(open, close) - wickRange * Math.max(0, -wickBias) * Math.random()
      
      // Volume varies realistically
      const volumeBase = 2 + Math.random() * 8
      const volumeSpike = Math.abs(baseChange + largeMove) > 0.001 ? 1 + Math.random() * 5 : 1
      const volume = volumeBase * volumeSpike

      candles.push({
        time,
        open: Math.max(1000, open),
        high: Math.max(1000, high),
        low: Math.max(1000, low),
        close: Math.max(1000, close),
        volume
      })
      
      price = open
    }

    this.currentPrice = startPrice
    return candles
  }

  private getTimeframeMs(tf: TimeFrame): number {
    const map: Record<TimeFrame, number> = {
      '1s': 1000,
      '10s': 10000,
      '30s': 30000,
      '1m': 60000,
      '5m': 300000,
      '15m': 900000
    }
    return map[tf]
  }

  public tick(): number {
    const now = Date.now()
    const dt = (now - this.lastUpdate) / 1000 // Time delta in seconds

    // Micro trend evolution - trends persist but randomly change
    if (Math.random() < 0.02 * dt) {
      this.microTrend = (Math.random() - 0.5) * 0.0001
      this.trendStrength = Math.random()
    }
    this.microTrend *= (1 - 0.1 * dt) // Decay over time
    this.trendStrength *= (1 - 0.05 * dt)

    // Momentum from previous price changes
    this.momentumBias = this.momentumBias * 0.95 + this.lastPriceChange * 0.05

    // Order flow simulation - simulates buying/selling pressure
    this.orderFlowImbalance += (Math.random() - 0.5) * 0.2
    this.orderFlowImbalance *= 0.98 // Decay

    // Random shock event (0.3% chance per second) - rare but impactful
    if (!this.shockEvent && Math.random() < 0.003 * dt) {
      const isPump = Math.random() > 0.5
      this.shockEvent = {
        active: true,
        intensity: 1.5 + Math.random() * 4, // 1.5-5.5x volatility
        duration: 2000 + Math.random() * 8000, // 2-10 seconds
        elapsed: 0,
        direction: isPump ? 1 : -1
      }
    }

    // Calculate volatility multiplier
    let volMult = 1
    let shockDrift = 0
    if (this.shockEvent) {
      this.shockEvent.elapsed += dt * 1000
      const progress = this.shockEvent.elapsed / this.shockEvent.duration
      // Smooth fade in/out with asymmetry
      volMult = 1 + this.shockEvent.intensity * Math.sin(progress * Math.PI)
      shockDrift = this.shockEvent.direction * 0.0001 * Math.sin(progress * Math.PI)

      if (this.shockEvent.elapsed >= this.shockEvent.duration) {
        this.shockEvent = null
      }
    }

    // GARCH-like volatility clustering - more realistic volatility
    const volShock = (Math.random() - 0.5) * 2
    this.volatilityState = 0.92 * this.volatilityState + 0.08 * volShock
    const currentVol = this.volatility * volMult * (1 + Math.abs(this.volatilityState) * 0.6)

    // Weak mean reversion to initial price (realistic markets don't strongly revert)
    const priceRatio = this.currentPrice / this.initialPrice
    const meanReversion = (1 - priceRatio) * 0.000005

    // Combined drift from multiple sources
    const totalDrift = this.drift + meanReversion + this.microTrend * this.trendStrength + 
                       shockDrift + this.orderFlowImbalance * 0.00001

    // GBM formula with enhancements: dS = S * (μ*dt + σ*dW)
    const dW = randomNormal(0, Math.sqrt(dt))
    let priceChange = this.currentPrice * (totalDrift * dt + currentVol * dW)
    
    // Add momentum component
    priceChange += this.momentumBias * this.currentPrice * 0.3

    // Add jump component during shock events (less predictable)
    let jump = 0
    if (this.shockEvent && Math.random() < 0.15 * dt) {
      const jumpSize = 0.0005 + Math.random() * 0.002 // 0.05-0.25%
      jump = this.currentPrice * jumpSize * this.shockEvent.direction
    }

    // Occasional micro-jumps even without shock events (realistic order book dynamics)
    if (!this.shockEvent && Math.random() < 0.05 * dt) {
      jump = this.currentPrice * (Math.random() - 0.5) * 0.0003
    }

    const totalChange = priceChange + jump
    this.lastPriceChange = totalChange / this.currentPrice
    this.currentPrice = Math.max(1000, this.currentPrice + totalChange)
    this.lastUpdate = now

    // Dynamic volatility adjustment (mean revert to random base level)
    const baseVol = 0.0002 + Math.random() * 0.0002
    this.volatility = Math.max(0.0001, Math.min(0.004, 
      this.volatility * 0.995 + baseVol * 0.005
    ))

    // Update candles
    this.updateCandles()

    return this.currentPrice
  }

  private updateCandles(): void {
    const now = Date.now()

    this.candles.forEach((candleList, timeframe) => {
      const interval = this.getTimeframeMs(timeframe)
      // Align candle time to interval boundaries (e.g., :00, :01, :02 for minutes)
      const currentInterval = Math.floor(now / interval) * interval

      let current = this.currentCandle.get(timeframe)

      // Check if we need to start a new candle
      if (!current || current.time !== currentInterval) {
        // Push completed candle to history
        if (current) {
          candleList.push(current)
          if (candleList.length > 500) {
            candleList.shift()
          }
        }

        // Start new candle at the correct interval boundary
        const previousCandle = candleList.length > 0 ? candleList[candleList.length - 1] : null
        const openPrice = previousCandle ? previousCandle.close : this.currentPrice

        current = {
          time: currentInterval,
          open: openPrice,
          high: Math.max(openPrice, this.currentPrice),
          low: Math.min(openPrice, this.currentPrice),
          close: this.currentPrice,
          volume: Math.abs(this.currentPrice - openPrice) * (0.5 + Math.random() * 1.5)
        }
        
        this.lastCandleTime.set(timeframe, currentInterval)
      } else {
        // Update current candle
        current.high = Math.max(current.high, this.currentPrice)
        current.low = Math.min(current.low, this.currentPrice)
        current.close = this.currentPrice
        // Volume increases with price movement
        const priceMove = Math.abs(this.currentPrice - this.lastUpdate)
        current.volume += priceMove * (0.01 + Math.random() * 0.05)
      }

      if (current) {
        this.currentCandle.set(timeframe, current)
      }
    })
  }

  public getCurrentPrice(): number {
    return this.currentPrice
  }

  public getInitialPrice(): number {
    return this.initialPrice
  }

  public getCandles(timeframe: TimeFrame): Candle[] {
    const list = this.candles.get(timeframe) || []
    const current = this.currentCandle.get(timeframe)
    if (current) {
      return [...list, current]
    }
    return list
  }

  public isShockEvent(): boolean {
    return this.shockEvent !== null
  }

  public getVolatility(): number {
    return this.volatility
  }
}