import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function formatBTC(btc: number): string {
  return btc.toFixed(6)
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

// Box-Muller transform for normal distribution
export function randomNormal(mean: number = 0, stdDev: number = 1): number {
  const u = 1 - Math.random()
  const v = Math.random()
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return z * stdDev + mean
}

// Calculate EMA
export function calculateEMA(prices: number[], period: number): number[] {
  const k = 2 / (period + 1)
  const ema: number[] = []
  
  if (prices.length === 0) return ema
  
  ema.push(prices[0])
  
  for (let i = 1; i < prices.length; i++) {
    ema.push(prices[i] * k + ema[i - 1] * (1 - k))
  }
  
  return ema
}

// Calculate RSI
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50
  
  let gains = 0
  let losses = 0
  
  for (let i = 1; i <= period; i++) {
    const change = prices[prices.length - i] - prices[prices.length - i - 1]
    if (change > 0) {
      gains += change
    } else {
      losses -= change
    }
  }
  
  const avgGain = gains / period
  const avgLoss = losses / period
  
  if (avgLoss === 0) return 100
  
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

// Linear regression for trend detection
export function linearRegression(x: number[], y: number[]): { slope: number; intercept: number; rSquared: number } {
  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  // Calculate R-squared
  const yMean = sumY / n
  const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
  const ssResidual = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept
    return sum + Math.pow(yi - predicted, 2)
  }, 0)
  const rSquared = 1 - (ssResidual / ssTotal)
  
  return { slope, intercept, rSquared }
}

// Get trend from candles
export function getTrend(candles: { close: number }[]): { slope: number; strength: number } {
  const x = candles.map((_, i) => i)
  const y = candles.map(c => c.close)
  const regression = linearRegression(x, y)
  
  return { slope: regression.slope, strength: regression.rSquared }
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}