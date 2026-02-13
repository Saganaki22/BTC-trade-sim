// Trading Types
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TimeFrame = '1s' | '10s' | '30s' | '1m' | '5m' | '15m';

export type OrderType = 'market' | 'limit';

export type PositionSide = 'long' | 'short';

export interface Position {
  id: string;
  side: PositionSide;
  entryPrice: number;
  size: number;
  leverage: number;
  margin: number;
  stopLoss?: number;
  takeProfit?: number;
  openTime: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  liquidationPrice: number;
}

export interface Order {
  id: string;
  side: PositionSide;
  type: OrderType;
  price: number;
  size: number;
  leverage: number;
  stopLoss?: number;
  takeProfit?: number;
  createdAt: number;
}

export interface TradeHistory {
  id: string;
  side: PositionSide;
  entryPrice: number;
  exitPrice: number;
  size: number;
  leverage: number;
  pnl: number;
  pnlPercent: number;
  openTime: number;
  closeTime: number;
  closeReason: 'market' | 'limit' | 'sl' | 'tp' | 'liquidation';
}

export interface Account {
  balance: number;
  equity: number;
  availableMargin: number;
  usedMargin: number;
}

// Pattern Detection Types
export type PatternType = 
  | 'bullFlag' 
  | 'bearFlag' 
  | 'triangle' 
  | 'wedge' 
  | 'channel' 
  | 'hammer' 
  | 'engulfing' 
  | 'oversold' 
  | 'overbought';

export interface Pattern {
  type: PatternType;
  startTime: number;
  endTime: number;
  startPrice: number;
  endPrice: number;
  confidence: number;
  message: string;
}

// Market State
export interface MarketState {
  currentPrice: number;
  initialPrice: number;
  priceChange: number;
  priceChangePercent: number;
  candles: Candle[];
  timeframe: TimeFrame;
  isShockEvent: boolean;
  volatility: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

// Technical Indicators
export interface TechnicalIndicators {
  ema9: number[];
  ema21: number[];
  ema50: number[];
  rsi: number;
}

// UI Types
export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
}

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface LayoutState {
  breakpoint: Breakpoint;
  sidebarOpen: boolean;
  aiCoachEnabled: boolean;
  activeTab: 'trade' | 'positions' | 'history' | 'coach';
}