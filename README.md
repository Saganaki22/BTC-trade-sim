# BTC Trade Sim

[![Demo](https://img.shields.io/badge/demo-live-success?style=for-the-badge&logo=vercel)](https://drbaph.is-a.dev/BTC-trade-sim)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)

A realistic Bitcoin paper trading simulator built for friends who want to practice trading strategies without risking real money. Features live BTC price feeds, advanced market simulation, and real-time technical analysis.

<img width="2557" height="1263" alt="image" src="https://github.com/user-attachments/assets/b0ae8e1b-489b-44c7-bc5c-8e6d696c58c7" />



## Features

- **Live Market Data** - Fetches real BTC prices from multiple APIs (CoinGecko, Binance, Coinbase) with automatic fallback
- **Realistic Simulation** - Advanced non-predictable price algorithm with:
  - GARCH-like volatility clustering
  - Momentum-based micro-trends
  - Order flow imbalance simulation
  - Random shock events (pumps/dumps)
  - Fat-tailed price distributions
- **Professional Trading** - Long/short positions, leverage (1x-100x), stop-loss, take-profit, and limit orders
- **Technical Analysis** - EMA indicators (9/21/50), RSI, and AI-powered pattern detection
- **Fully Responsive** - Optimized for desktop, tablet, and mobile with touch-friendly controls
- **Real-time Updates** - 10 ticks per second for smooth, realistic price action
- **Multi-Timeframe** - 1s, 10s, 1m, 5m, 15m candle intervals with proper time alignment

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Charts**: lightweight-charts (TradingView style)
- **State Management**: Zustand
- **Icons**: Lucide React

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── slider.tsx
│   │   ├── switch.tsx
│   │   ├── tabs.tsx
│   │   └── toaster.tsx
│   ├── Chart.tsx        # TradingView-style chart
│   ├── Header.tsx       # Price display and stats
│   ├── TradePanel.tsx   # Order entry interface
│   ├── PositionList.tsx # Active positions
│   ├── StrategyCoach.tsx # AI pattern detection
│   ├── AIToggle.tsx     # AI Coach toggle button
│   └── LoadingScreen.tsx
├── lib/
│   ├── utils.ts         # Utility functions
│   ├── marketSimulator.ts # Price generation
│   ├── tradingEngine.ts   # Trading logic
│   └── patternDetector.ts # Pattern recognition
├── store/
│   └── appStore.ts      # Zustand state management
├── types/
│   └── index.ts         # TypeScript interfaces
├── App.tsx
├── main.tsx
└── index.css
```

## How It Works

The simulator uses a sophisticated Geometric Brownian Motion (GBM) model enhanced with:
- **GARCH-like volatility clustering** - Realistic volatility that clusters in high/low periods
- **Momentum-based micro-trends** - Short-term trends that evolve dynamically
- **Order flow simulation** - Buying/selling pressure imbalances
- **Random shock events** - Rare but impactful volatility spikes
- **Fat-tailed distributions** - Occasional large price moves (realistic markets)
- **Mean reversion** - Minimal bias preventing unrealistic drift

Candle times are properly aligned to interval boundaries, ensuring accurate minute/second timestamps for each timeframe.

## Made For

Built for friends who wanted a more realistic paper trading experience. Feel free to use it to practice your strategies!

## License

MIT License - see [LICENSE](LICENSE) file for details

---

Made with ♥ by [saganaki22](https://github.com/saganaki22)
