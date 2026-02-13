import type { Candle, Pattern } from '@/types'
import { calculateRSI, getTrend, linearRegression } from '@/lib/utils'

export class PatternDetector {
  private patterns: Pattern[] = []
  private lastDetectionTime = 0
  private readonly detectionInterval = 5000 // Detect every 5 seconds

  public detect(candles: Candle[]): Pattern[] {
    const now = Date.now()
    if (now - this.lastDetectionTime < this.detectionInterval) {
      return this.patterns
    }
    this.lastDetectionTime = now

    // Clear old patterns if too many
    if (this.patterns.length > 10) {
      this.patterns = this.patterns.slice(-5)
    }

    if (candles.length < 20) {
      return this.patterns
    }

    const recent = candles.slice(-30)

    // Detect candlestick patterns
    this.detectHammer(recent)
    this.detectEngulfing(recent)
    this.detectDoji(recent)

    // Detect chart patterns (less frequently - only check every other time)
    if (now % 10000 < 5000) {
      this.detectBullFlag(recent)
      this.detectBearFlag(recent)
      this.detectTriangle(recent)
      this.detectChannel(recent)
    }

    // Detect RSI conditions
    this.detectRSIConditions(recent)

    return this.patterns
  }

  private addPattern(pattern: Omit<Pattern, 'confidence'> & { confidence?: number }): void {
    this.patterns.push({
      ...pattern,
      confidence: pattern.confidence || 0.7
    })
  }

  private detectHammer(candles: Candle[]): void {
    if (candles.length < 3) return

    const current = candles[candles.length - 1]

    const bodySize = Math.abs(current.close - current.open)
    const lowerShadow = Math.min(current.open, current.close) - current.low
    const upperShadow = current.high - Math.max(current.open, current.close)
    const range = current.high - current.low

    // Hammer: small body, long lower shadow (2x body), little/no upper shadow
    if (lowerShadow > bodySize * 2 && upperShadow < bodySize * 0.5 && bodySize > 0 && bodySize < range * 0.3) {
      const isBullish = current.close > current.open
      const prevTrend = getTrend(candles.slice(-5, -1))

      if (prevTrend.slope < 0) {
        this.addPattern({
          type: 'hammer',
          startTime: current.time,
          endTime: current.time,
          startPrice: current.low,
          endPrice: current.high,
          confidence: 0.75,
          message: isBullish
            ? '🔨 Bullish Hammer - Potential reversal after downtrend'
            : '🔨 Inverted Hammer - Watch for confirmation'
        })
      }
    }
  }

  private detectEngulfing(candles: Candle[]): void {
    if (candles.length < 2) return

    const current = candles[candles.length - 1]
    const previous = candles[candles.length - 2]

    const prevBody = Math.abs(previous.close - previous.open)
    const currBody = Math.abs(current.close - current.open)

    const isBullishEngulfing =
      previous.close < previous.open && // Previous bearish
      current.close > current.open && // Current bullish
      current.open < previous.close && // Open below prev close
      current.close > previous.open // Close above prev open

    const isBearishEngulfing =
      previous.close > previous.open && // Previous bullish
      current.close < current.open && // Current bearish
      current.open > previous.close && // Open above prev close
      current.close < previous.open // Close below prev open

    if (isBullishEngulfing && currBody > prevBody * 1.1) {
      this.addPattern({
        type: 'engulfing',
        startTime: previous.time,
        endTime: current.time,
        startPrice: Math.min(previous.open, previous.close),
        endPrice: Math.max(current.open, current.close),
        confidence: 0.8,
        message: '📈 Bullish Engulfing - Strong buy signal, momentum shifting up'
      })
    } else if (isBearishEngulfing && currBody > prevBody * 1.1) {
      this.addPattern({
        type: 'engulfing',
        startTime: previous.time,
        endTime: current.time,
        startPrice: Math.max(previous.open, previous.close),
        endPrice: Math.min(current.open, current.close),
        confidence: 0.8,
        message: '📉 Bearish Engulfing - Strong sell signal, momentum shifting down'
      })
    }
  }

  private detectDoji(candles: Candle[]): void {
    const current = candles[candles.length - 1]
    const bodySize = Math.abs(current.close - current.open)
    const range = current.high - current.low

    if (range > 0 && bodySize < range * 0.1) {
      this.addPattern({
        type: 'wedge',
        startTime: current.time,
        endTime: current.time,
        startPrice: current.low,
        endPrice: current.high,
        confidence: 0.6,
        message: '⚖️ Doji Pattern - Market indecision, potential reversal ahead'
      })
    }
  }

  private detectBullFlag(candles: Candle[]): void {
    if (candles.length < 15) return

    const firstHalf = candles.slice(0, 10)
    const secondHalf = candles.slice(10)

    const firstTrend = getTrend(firstHalf)
    if (firstTrend.slope <= 0 || firstTrend.strength < 0.6) return

    const secondTrend = getTrend(secondHalf)
    if (Math.abs(secondTrend.slope) > Math.abs(firstTrend.slope) * 0.4) return

    const range = this.getPriceRange(secondHalf)
    const flagHeight = range.high - range.low
    const poleHeight = firstHalf[firstHalf.length - 1].close - firstHalf[0].open

    if (flagHeight < poleHeight * 0.5 && poleHeight > 0) {
      this.addPattern({
        type: 'bullFlag',
        startTime: firstHalf[0].time,
        endTime: secondHalf[secondHalf.length - 1].time,
        startPrice: firstHalf[0].open,
        endPrice: secondHalf[secondHalf.length - 1].close,
        confidence: 0.7,
        message: '🚩 Bull Flag Pattern - Continuation likely, consider adding to long'
      })
    }
  }

  private detectBearFlag(candles: Candle[]): void {
    if (candles.length < 15) return

    const firstHalf = candles.slice(0, 10)
    const secondHalf = candles.slice(10)

    const firstTrend = getTrend(firstHalf)
    if (firstTrend.slope >= 0 || firstTrend.strength < 0.6) return

    const secondTrend = getTrend(secondHalf)
    if (Math.abs(secondTrend.slope) > Math.abs(firstTrend.slope) * 0.4) return

    const range = this.getPriceRange(secondHalf)
    const flagHeight = range.high - range.low
    const poleHeight = firstHalf[0].open - firstHalf[firstHalf.length - 1].close

    if (flagHeight < poleHeight * 0.5 && poleHeight > 0) {
      this.addPattern({
        type: 'bearFlag',
        startTime: firstHalf[0].time,
        endTime: secondHalf[secondHalf.length - 1].time,
        startPrice: firstHalf[0].open,
        endPrice: secondHalf[secondHalf.length - 1].close,
        confidence: 0.7,
        message: '🚩 Bear Flag Pattern - Downside continuation likely'
      })
    }
  }

  private detectTriangle(candles: Candle[]): void {
    if (candles.length < 15) return

    const highs: number[] = []
    const lows: number[] = []
    const times: number[] = []

    candles.forEach(c => {
      highs.push(c.high)
      lows.push(c.low)
      times.push(c.time)
    })

    const highTrend = linearRegression(times, highs)
    const lowTrend = linearRegression(times, lows)

    const isConverging = highTrend.slope < 0 && lowTrend.slope > 0
    const convergence = Math.abs(highTrend.slope - lowTrend.slope)

    if (isConverging && convergence > 0.000001) {
      const lastCandle = candles[candles.length - 1]

      this.addPattern({
        type: 'triangle',
        startTime: times[0],
        endTime: lastCandle.time,
        startPrice: (highs[0] + lows[0]) / 2,
        endPrice: lastCandle.close,
        confidence: 0.65,
        message: '🔺 Symmetrical Triangle - Breakout imminent, watch for direction'
      })
    }
  }

  private detectChannel(candles: Candle[]): void {
    if (candles.length < 10) return

    const highs: number[] = []
    const lows: number[] = []
    const times: number[] = []

    candles.forEach(c => {
      highs.push(c.high)
      lows.push(c.low)
      times.push(c.time)
    })

    const highTrend = linearRegression(times, highs)
    const lowTrend = linearRegression(times, lows)

    const slopeDiff = Math.abs(highTrend.slope - lowTrend.slope)
    const isParallel = slopeDiff < Math.abs(highTrend.slope) * 0.3

    if (isParallel && Math.abs(highTrend.slope) > 0.000001) {
      const isAscending = highTrend.slope > 0

      this.addPattern({
        type: 'channel',
        startTime: times[0],
        endTime: times[times.length - 1],
        startPrice: (highs[0] + lows[0]) / 2,
        endPrice: (highs[highs.length - 1] + lows[lows.length - 1]) / 2,
        confidence: 0.7,
        message: isAscending
          ? '📈 Ascending Channel - Buy dips, sell at resistance'
          : '📉 Descending Channel - Sell rallies, buy at support'
      })
    }
  }

  private detectRSIConditions(candles: Candle[]): void {
    if (candles.length < 15) return

    const closes = candles.map(c => c.close)
    const rsi = calculateRSI(closes, 14)

    if (rsi < 30) {
      this.addPattern({
        type: 'oversold',
        startTime: candles[candles.length - 1].time,
        endTime: candles[candles.length - 1].time,
        startPrice: candles[candles.length - 1].low,
        endPrice: candles[candles.length - 1].high,
        confidence: Math.min(0.9, (30 - rsi) / 30 * 0.8 + 0.5),
        message: `🟢 RSI Oversold (${rsi.toFixed(1)}) - Potential bounce incoming`
      })
    } else if (rsi > 70) {
      this.addPattern({
        type: 'overbought',
        startTime: candles[candles.length - 1].time,
        endTime: candles[candles.length - 1].time,
        startPrice: candles[candles.length - 1].low,
        endPrice: candles[candles.length - 1].high,
        confidence: Math.min(0.9, (rsi - 70) / 30 * 0.8 + 0.5),
        message: `🔴 RSI Overbought (${rsi.toFixed(1)}) - Potential pullback likely`
      })
    }
  }

  private getPriceRange(candles: Candle[]): { high: number; low: number } {
    return {
      high: Math.max(...candles.map(c => c.high)),
      low: Math.min(...candles.map(c => c.low))
    }
  }
}