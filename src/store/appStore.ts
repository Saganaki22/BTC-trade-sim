import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  MarketState,
  Position,
  Order,
  TradeHistory,
  Account,
  TimeFrame,
  Pattern,
  Toast,
  Breakpoint
} from '@/types'
import { MarketSimulator } from '@/lib/marketSimulator'
import { TradingEngine } from '@/lib/tradingEngine'
import { PatternDetector } from '@/lib/patternDetector'
import { calculateEMA, calculateRSI } from '@/lib/utils'

interface AppState extends MarketState {
  // Account
  account: Account
  positions: Position[]
  orders: Order[]
  history: TradeHistory[]

  // UI State
  timeframe: TimeFrame
  activeTab: 'trade' | 'positions' | 'history' | 'coach'
  sidebarOpen: boolean
  aiCoachEnabled: boolean
  breakpoint: Breakpoint
  isLoading: boolean
  toasts: Toast[]

  // Technical Indicators
  ema9: number[]
  ema21: number[]
  ema50: number[]
  rsi: number

  // Patterns
  patterns: Pattern[]

  // Actions
  setTimeframe: (tf: TimeFrame) => void
  setActiveTab: (tab: 'trade' | 'positions' | 'history' | 'coach') => void
  toggleSidebar: () => void
  toggleAICoach: () => void
  setBreakpoint: (bp: Breakpoint) => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void

  // Trading Actions
  openPosition: (side: 'long' | 'short', size: number, leverage: number, sl?: number, tp?: number) => boolean
  closePosition: (positionId: string) => void
  placeLimitOrder: (side: 'long' | 'short', price: number, size: number, leverage: number, sl?: number, tp?: number) => boolean
  cancelOrder: (orderId: string) => void

  // Initialize
  initialize: () => Promise<void>
  startSimulation: () => void
}

const INITIAL_BALANCE = 10 // BTC

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    currentPrice: 0,
    initialPrice: 0,
    priceChange: 0,
    priceChangePercent: 0,
    candles: [],
    timeframe: '1s',
    isShockEvent: false,
    volatility: 0.0008,
    trend: 'neutral',

    account: {
      balance: INITIAL_BALANCE,
      equity: INITIAL_BALANCE,
      availableMargin: INITIAL_BALANCE,
      usedMargin: 0
    },
    positions: [],
    orders: [],
    history: [],

    activeTab: 'trade',
    sidebarOpen: false,
    aiCoachEnabled: false,
    breakpoint: 'mobile',
    isLoading: true,
    toasts: [],

    ema9: [],
    ema21: [],
    ema50: [],
    rsi: 50,

    patterns: [],

    // Actions
    setTimeframe: (timeframe) => {
      set({ timeframe, candles: get().candles })
    },

    setActiveTab: (activeTab) => set({ activeTab }),

    toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),

    toggleAICoach: () => {
      const newState = !get().aiCoachEnabled
      set({ aiCoachEnabled: newState })
      if (newState) {
        get().addToast({
          title: '🤖 AI Coach Enabled',
          description: 'Pattern detection is now active',
          variant: 'info'
        })
      }
    },

    setBreakpoint: (breakpoint) => set({ breakpoint }),

    addToast: (toast) => {
      const id = Math.random().toString(36).substr(2, 9)
      set(state => ({
        toasts: [...state.toasts.slice(-4), { ...toast, id }] // Keep only last 5 toasts
      }))
      setTimeout(() => {
        get().removeToast(id)
      }, 3000) // Reduced to 3 seconds
    },

    removeToast: (id) => {
      set(state => ({
        toasts: state.toasts.filter(t => t.id !== id)
      }))
    },

    // Trading Actions
    openPosition: (side, size, leverage, sl, tp) => {
      const { currentPrice } = get()
      // Access engine through closure
      const engine = (window as any).tradingEngine as TradingEngine
      if (!engine) return false

      const position = engine.openMarketPosition(side, size, leverage, currentPrice, sl, tp)
      if (position) {
        set({
          positions: engine.getPositions(),
          account: engine.getAccount()
        })
        get().addToast({
          title: `${side.toUpperCase()} Position Opened`,
          description: `Size: ${size} BTC @ ${leverage}x leverage`,
          variant: 'success'
        })
        return true
      }
      get().addToast({
        title: 'Insufficient Margin',
        description: 'Reduce position size or increase leverage',
        variant: 'destructive'
      })
      return false
    },

    closePosition: (positionId) => {
      const { currentPrice } = get()
      const engine = (window as any).tradingEngine as TradingEngine
      if (!engine) return

      const trade = engine.closePosition(positionId, currentPrice)
      if (trade) {
        set({
          positions: engine.getPositions(),
          history: engine.getHistory(),
          account: engine.getAccount()
        })
        const pnlText = trade.pnl >= 0 ? `+${trade.pnl.toFixed(6)}` : trade.pnl.toFixed(6)
        get().addToast({
          title: 'Position Closed',
          description: `PnL: ${pnlText} BTC`,
          variant: trade.pnl >= 0 ? 'success' : 'warning'
        })
      }
    },

    placeLimitOrder: (side, price, size, leverage, sl, tp) => {
      const engine = (window as any).tradingEngine as TradingEngine
      if (!engine) return false

      const order = engine.placeLimitOrder(side, price, size, leverage, sl, tp)
      if (order) {
        set({
          orders: engine.getOrders(),
          account: engine.getAccount()
        })
        get().addToast({
          title: 'Limit Order Placed',
          description: `${side.toUpperCase()} @ $${price.toLocaleString()}`,
          variant: 'info'
        })
        return true
      }
      return false
    },

    cancelOrder: (orderId) => {
      const engine = (window as any).tradingEngine as TradingEngine
      if (!engine) return

      if (engine.cancelOrder(orderId)) {
        set({
          orders: engine.getOrders(),
          account: engine.getAccount()
        })
        get().addToast({
          title: 'Order Cancelled',
          variant: 'default'
        })
      }
    },

    // Initialize
    initialize: async () => {
      let livePrice: number | null = null

      // Try multiple API sources for better reliability
      const apiSources = [
        {
          name: 'CoinGecko',
          url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
          parse: (data: any) => data.bitcoin.usd
        },
        {
          name: 'Binance',
          url: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
          parse: (data: any) => parseFloat(data.price)
        },
        {
          name: 'Coinbase',
          url: 'https://api.coinbase.com/v2/prices/BTC-USD/spot',
          parse: (data: any) => parseFloat(data.data.amount)
        }
      ]

      // Try each API source until one succeeds
      for (const source of apiSources) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3000) // 3s timeout

          const response = await fetch(source.url, { 
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
          })
          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }

          const data = await response.json()
          livePrice = source.parse(data)

          if (livePrice && livePrice > 0 && livePrice < 1000000) {
            console.log(`✓ Fetched BTC price from ${source.name}: $${livePrice}`)
            break
          }
        } catch (error) {
          console.warn(`✗ Failed to fetch from ${source.name}:`, error)
        }
      }

      // Fallback if all APIs fail
      if (!livePrice || livePrice <= 0) {
        livePrice = 95000 + Math.random() * 5000 // Random fallback 95k-100k
        console.warn('Using fallback BTC price:', livePrice)
      }

      try {
        // Initialize market simulator with validated price
        const simulator = new MarketSimulator(livePrice)
        ;(window as any).marketSimulator = simulator

        // Initialize trading engine
        const engine = new TradingEngine(INITIAL_BALANCE)
        ;(window as any).tradingEngine = engine

        // Get initial candles
        const candles = simulator.getCandles('1s')
        const closes = candles.map(c => c.close)

        set({
          currentPrice: livePrice,
          initialPrice: livePrice,
          candles,
          ema9: calculateEMA(closes, 9),
          ema21: calculateEMA(closes, 21),
          ema50: calculateEMA(closes, 50),
          rsi: calculateRSI(closes),
          isLoading: false
        })

        get().addToast({
          title: '✓ Market Connected',
          description: `BTC: $${livePrice.toLocaleString(undefined, {maximumFractionDigits: 0})}`,
          variant: 'success'
        })
      } catch (error) {
        console.error('Failed to initialize simulator:', error)
        set({ isLoading: false })
        get().addToast({
          title: 'Initialization Error',
          description: 'Please refresh the page',
          variant: 'destructive'
        })
      }
    },

    startSimulation: () => {
      const patternDetector = new PatternDetector()
      let lastPatternCheck = 0
      let lastPatternTypes = new Set<string>()
      let frameCount = 0

      const interval = setInterval(() => {
        try {
          const simulator = (window as any).marketSimulator as MarketSimulator
          const engine = (window as any).tradingEngine as TradingEngine

          if (!simulator || !engine) {
            console.error('Simulator or engine not initialized')
            return
          }

          frameCount++
          const now = Date.now()

          // Tick market
          const newPrice = simulator.tick()
          const candles = simulator.getCandles(get().timeframe)
          const closes = candles.map(c => c.close)

          // Update trading engine
          engine.checkLimitOrders(newPrice)
          const { liquidated } = engine.updatePositions(newPrice)

          // Handle liquidations
          liquidated.forEach(() => {
            get().addToast({
              title: '⚠ LIQUIDATED',
              description: 'Position force-closed',
              variant: 'destructive'
            })
          })

          // Update patterns if AI Coach is enabled - only check every 5 seconds
          let patterns = get().patterns
          if (get().aiCoachEnabled && now - lastPatternCheck > 5000) {
            lastPatternCheck = now
            try {
              const newPatterns = patternDetector.detect(candles)
              
              // Only show toast for NEW pattern types (not duplicates)
              const currentPatternTypes = new Set(newPatterns.map(p => p.type))
              newPatterns.forEach(p => {
                if (p.confidence > 0.75 && !lastPatternTypes.has(p.type)) {
                  get().addToast({
                    title: 'Pattern Detected',
                    description: p.message,
                    variant: 'info'
                  })
                }
              })
              
              lastPatternTypes = currentPatternTypes
              patterns = newPatterns
            } catch (error) {
              console.warn('Pattern detection error:', error)
            }
          }

          // Calculate trend efficiently
          const trend = (() => {
            if (candles.length < 20) return 'neutral'
            const recent = candles.slice(-20)
            const first = recent[0].close
            const last = recent[recent.length - 1].close
            const change = ((last - first) / first) * 100
            if (change > 0.5) return 'bullish'
            if (change < -0.5) return 'bearish'
            return 'neutral'
          })()

          // Calculate EMAs every tick to stay in sync with candles
          const ema9 = calculateEMA(closes, 9)
          const ema21 = calculateEMA(closes, 21)
          const ema50 = calculateEMA(closes, 50)
          const rsi = calculateRSI(closes)

          set({
            currentPrice: newPrice,
            priceChange: newPrice - get().initialPrice,
            priceChangePercent: ((newPrice - get().initialPrice) / get().initialPrice) * 100,
            candles,
            ema9,
            ema21,
            ema50,
            rsi,
            isShockEvent: simulator.isShockEvent(),
            volatility: simulator.getVolatility(),
            trend,
            positions: engine.getPositions(),
            orders: engine.getOrders(),
            history: engine.getHistory(),
            account: engine.getAccount(),
            patterns
          })
        } catch (error) {
          console.error('Simulation error:', error)
        }
      }, 100) // 10 ticks per second

      // Cleanup on window unload
      const cleanup = () => {
        clearInterval(interval)
      }
      window.addEventListener('beforeunload', cleanup)

      // Store cleanup function for potential future use
      ;(window as any).cleanupSimulation = cleanup
    }
  }))
)