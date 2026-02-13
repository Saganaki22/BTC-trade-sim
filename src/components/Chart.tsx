import { useEffect, useRef, useState } from 'react'
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData } from 'lightweight-charts'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'

export function Chart() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const ema9SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const ema21SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const isInitializedRef = useRef<boolean>(false)
  const hasFittedRef = useRef<boolean>(false)

  // Get state from store
  const candles = useAppStore(state => state.candles)
  const timeframe = useAppStore(state => state.timeframe)
  const ema9 = useAppStore(state => state.ema9)
  const ema21 = useAppStore(state => state.ema21)
  const ema50 = useAppStore(state => state.ema50)
  const rsi = useAppStore(state => state.rsi)
  const aiCoachEnabled = useAppStore(state => state.aiCoachEnabled)
  const patterns = useAppStore(state => state.patterns)
  const setTimeframe = useAppStore(state => state.setTimeframe)

  const [showEma9, setShowEma9] = useState(true)
  const [showEma21, setShowEma21] = useState(true)
  const [showEma50, setShowEma50] = useState(false)

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || isInitializedRef.current) return

    isInitializedRef.current = true

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#848E9C',
      },
      grid: {
        vertLines: { color: '#2B3139' },
        horzLines: { color: '#2B3139' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#758696',
          labelBackgroundColor: '#758696',
        },
        horzLine: {
          color: '#758696',
          labelBackgroundColor: '#758696',
        },
      },
      rightPriceScale: {
        borderColor: '#2B3139',
      },
      timeScale: {
        borderColor: '#2B3139',
        timeVisible: true,
        secondsVisible: timeframe === '1s' || timeframe === '10s',
      },
      handleScroll: {
        vertTouchDrag: false,
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: {
          time: true,
          price: true,
        },
        mouseWheel: true,
        pinch: true,
      },
    })

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#0ECB81',
      downColor: '#F6465D',
      borderUpColor: '#0ECB81',
      borderDownColor: '#F6465D',
      wickUpColor: '#0ECB81',
      wickDownColor: '#F6465D',
    })

    const ema9Series = chart.addLineSeries({
      color: '#1E80FF',
      lineWidth: 2,
      title: 'EMA 9',
      lastValueVisible: false,
    })

    const ema21Series = chart.addLineSeries({
      color: '#F0B90B',
      lineWidth: 2,
      title: 'EMA 21',
      lastValueVisible: false,
    })

    const ema50Series = chart.addLineSeries({
      color: '#D478FF',
      lineWidth: 2,
      title: 'EMA 50',
      lastValueVisible: false,
    })

    chartRef.current = chart
    candlestickSeriesRef.current = candlestickSeries
    ema9SeriesRef.current = ema9Series
    ema21SeriesRef.current = ema21Series
    ema50SeriesRef.current = ema50Series

    // Use ResizeObserver for dynamic resizing
    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        chart.applyOptions({ width, height })
      }
    })

    if (chartContainerRef.current) {
      resizeObserverRef.current.observe(chartContainerRef.current)
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
      chart.remove()
      isInitializedRef.current = false
    }
  }, [])

  // Update timeframe settings when it changes
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({
        timeScale: {
          secondsVisible: timeframe === '1s' || timeframe === '10s',
        },
      })
    }
  }, [timeframe])

  // Update candle data
  useEffect(() => {
    if (!candlestickSeriesRef.current || candles.length === 0) return

    // Use setData for complete refresh
    const chartData: CandlestickData[] = candles.map(c => ({
      time: c.time / 1000 as unknown as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))

    candlestickSeriesRef.current.setData(chartData)
    
    // Only fit content on initial load, not on every update
    if (chartRef.current && !hasFittedRef.current) {
      chartRef.current.timeScale().fitContent()
      hasFittedRef.current = true
    }
  }, [candles])

  // Update EMAs - must align with candle times
  useEffect(() => {
    if (!ema9SeriesRef.current || !ema21SeriesRef.current || !ema50SeriesRef.current) return
    if (candles.length === 0) return

    // EMA arrays should be same length as candles
    const timeData = candles.map(c => c.time / 1000)

    // Only update if we have valid EMA data and lengths match
    if (showEma9 && ema9.length > 0) {
      if (ema9.length === candles.length) {
        const ema9Data: LineData[] = ema9
          .map((value, i) => ({
            time: timeData[i] as unknown as any,
            value,
          }))
          .filter((d): d is LineData => d.value !== undefined && !isNaN(d.value) && d.value > 0)
        ema9SeriesRef.current.setData(ema9Data)
      }
    } else if (!showEma9) {
      ema9SeriesRef.current.setData([])
    }

    if (showEma21 && ema21.length > 0) {
      if (ema21.length === candles.length) {
        const ema21Data: LineData[] = ema21
          .map((value, i) => ({
            time: timeData[i] as unknown as any,
            value,
          }))
          .filter((d): d is LineData => d.value !== undefined && !isNaN(d.value) && d.value > 0)
        ema21SeriesRef.current.setData(ema21Data)
      }
    } else if (!showEma21) {
      ema21SeriesRef.current.setData([])
    }

    if (showEma50 && ema50.length > 0) {
      if (ema50.length === candles.length) {
        const ema50Data: LineData[] = ema50
          .map((value, i) => ({
            time: timeData[i] as unknown as any,
            value,
          }))
          .filter((d): d is LineData => d.value !== undefined && !isNaN(d.value) && d.value > 0)
        ema50SeriesRef.current.setData(ema50Data)
      }
    } else if (!showEma50) {
      ema50SeriesRef.current.setData([])
    }
  }, [ema9, ema21, ema50, showEma9, showEma21, showEma50, candles])

  const timeframes = [
    { value: '1s', label: '1s' },
    { value: '10s', label: '10s' },
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
  ] as const

  return (
    <div className="relative w-full h-full">
      <div ref={chartContainerRef} className="w-full h-full" />

      {/* Controls Container */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Timeframe Selector - top left */}
        <div className="absolute top-1 sm:top-3 left-1 sm:left-3 flex gap-0.5 sm:gap-1 pointer-events-auto z-10 bg-background/80 backdrop-blur-sm p-0.5 sm:p-1 rounded-md sm:rounded-lg">
          {timeframes.map((tf) => (
            <Button
              key={tf.value}
              size="sm"
              variant={timeframe === tf.value ? 'default' : 'secondary'}
              onClick={() => setTimeframe(tf.value as any)}
              className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 h-6 sm:h-7"
              type="button"
            >
              {tf.label}
            </Button>
          ))}
        </div>

        {/* EMA Toggles - top right */}
        <div className="absolute top-1 sm:top-3 right-1 sm:right-3 flex gap-0.5 sm:gap-1 pointer-events-auto z-10 bg-background/80 backdrop-blur-sm p-0.5 sm:p-1 rounded-md sm:rounded-lg">
          <Button
            size="sm"
            variant={showEma9 ? 'default' : 'secondary'}
            onClick={() => setShowEma9(!showEma9)}
            className={cn(
              "text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 h-6 sm:h-7",
              showEma9 && "bg-blue-500 hover:bg-blue-600"
            )}
            type="button"
          >
            <span className="hidden sm:inline">EMA 9</span>
            <span className="sm:hidden">E9</span>
          </Button>
          <Button
            size="sm"
            variant={showEma21 ? 'default' : 'secondary'}
            onClick={() => setShowEma21(!showEma21)}
            className={cn(
              "text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 h-6 sm:h-7",
              showEma21 && "bg-yellow-500 hover:bg-yellow-600 text-black"
            )}
            type="button"
          >
            <span className="hidden sm:inline">EMA 21</span>
            <span className="sm:hidden">E21</span>
          </Button>
          <Button
            size="sm"
            variant={showEma50 ? 'default' : 'secondary'}
            onClick={() => setShowEma50(!showEma50)}
            className={cn(
              "text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 h-6 sm:h-7",
              showEma50 && "bg-purple-500 hover:bg-purple-600"
            )}
            type="button"
          >
            <span className="hidden sm:inline">EMA 50</span>
            <span className="sm:hidden">E50</span>
          </Button>
        </div>

        {/* RSI Indicator - bottom right */}
        <div className="absolute bottom-10 sm:bottom-12 right-1 sm:right-3 pointer-events-auto z-10">
          <Card className="px-2 sm:px-3 py-1 sm:py-1.5 bg-card/90 backdrop-blur">
            <span className={cn(
              "text-[10px] sm:text-xs font-medium",
              rsi > 70 ? 'text-short' : rsi < 30 ? 'text-long' : 'text-muted-foreground'
            )}>
              RSI: {rsi.toFixed(0)}
            </span>
          </Card>
        </div>

        {/* Pattern Overlay - bottom center */}
        {aiCoachEnabled && patterns.length > 0 && (
          <div className="absolute bottom-12 sm:bottom-16 left-1/2 -translate-x-1/2 max-w-[250px] sm:max-w-[300px] pointer-events-auto z-10 px-2">
            <Card className="p-2 sm:p-3 bg-card/90 backdrop-blur">
              <p className="text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1">Latest Pattern:</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">{patterns[patterns.length - 1].message}</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}