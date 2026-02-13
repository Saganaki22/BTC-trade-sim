import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatBTC } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

export function TradePanel() {
  const { 
    currentPrice, 
    account,
    openPosition,
    placeLimitOrder
  } = useAppStore()

  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [size, setSize] = useState(0.1)
  const [leverage, setLeverage] = useState(20)
  const [limitPrice, setLimitPrice] = useState(currentPrice)
  const [stopLoss, setStopLoss] = useState('')
  const [takeProfit, setTakeProfit] = useState('')

  const margin = (size * currentPrice) / leverage / currentPrice
  const hasEnoughMargin = margin <= account.availableMargin

  const handleTrade = (side: 'long' | 'short') => {
    // Validate inputs
    if (size <= 0 || size > 1000) {
      return
    }
    
    if (leverage < 1 || leverage > 100) {
      return
    }

    if (orderType === 'limit' && (limitPrice <= 0 || limitPrice > 1000000)) {
      return
    }

    const sl = stopLoss ? parseFloat(stopLoss) : undefined
    const tp = takeProfit ? parseFloat(takeProfit) : undefined

    // Validate SL/TP logic
    if (sl !== undefined) {
      if (side === 'long' && sl >= currentPrice) return
      if (side === 'short' && sl <= currentPrice) return
    }

    if (tp !== undefined) {
      if (side === 'long' && tp <= currentPrice) return
      if (side === 'short' && tp >= currentPrice) return
    }

    if (orderType === 'market') {
      openPosition(side, size, leverage, sl, tp)
    } else {
      placeLimitOrder(side, limitPrice, size, leverage, sl, tp)
    }
  }

  return (
    <div className="space-y-4">
      {/* Order Type Selector */}
      <div className="flex gap-2">
        <Button
          variant={orderType === 'market' ? 'default' : 'outline'}
          onClick={() => setOrderType('market')}
          className="flex-1"
        >
          Market
        </Button>
        <Button
          variant={orderType === 'limit' ? 'default' : 'outline'}
          onClick={() => setOrderType('limit')}
          className="flex-1"
        >
          Limit
        </Button>
      </div>

      {/* Limit Price (if limit order) */}
      {orderType === 'limit' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Limit Price</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              value={limitPrice}
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                if (!isNaN(val) && val > 0 && val <= 1000000) {
                  setLimitPrice(val)
                }
              }}
              min={1}
              max={1000000}
              className="font-mono"
            />
          </CardContent>
        </Card>
      )}

      {/* Size Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Position Size (BTC)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="number"
            value={size}
            onChange={(e) => {
              const val = parseFloat(e.target.value)
              if (!isNaN(val) && val >= 0 && val <= 1000) {
                setSize(val)
              } else if (e.target.value === '') {
                setSize(0)
              }
            }}
            step={0.01}
            min={0.001}
            max={1000}
            className="font-mono"
          />
          <div className="flex gap-2">
            {[0.01, 0.1, 0.5, 1].map((val) => (
              <Button
                key={val}
                variant="outline"
                size="sm"
                onClick={() => setSize(val)}
                className="flex-1"
              >
                {val} BTC
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leverage Slider */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Leverage</CardTitle>
            <Badge variant="outline">{leverage}x</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Slider
            value={[leverage]}
            onValueChange={([val]) => setLeverage(val)}
            min={1}
            max={100}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>1x</span>
            <span>25x</span>
            <span>50x</span>
            <span>100x</span>
          </div>
        </CardContent>
      </Card>

      {/* Risk Management */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Risk Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Stop Loss</label>
              <Input
                type="number"
                placeholder="Price"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Take Profit</label>
              <Input
                type="number"
                placeholder="Price"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Margin Info */}
      <Card className="bg-muted">
        <CardContent className="pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Margin Required</span>
            <span className="font-mono tabular-nums">{formatBTC(margin)} BTC</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Available Margin</span>
            <span className="font-mono tabular-nums">{formatBTC(account.availableMargin)} BTC</span>
          </div>
          {!hasEnoughMargin && (
            <div className="flex items-center gap-2 text-xs text-destructive mt-2">
              <AlertTriangle size={14} />
              <span>Insufficient margin</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trading Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="long"
          size="lg"
          onClick={() => handleTrade('long')}
          disabled={!hasEnoughMargin}
          className="font-bold"
        >
          Buy / Long
        </Button>

        <Button
          variant="short"
          size="lg"
          onClick={() => handleTrade('short')}
          disabled={!hasEnoughMargin}
          className="font-bold"
        >
          Sell / Short
        </Button>
      </div>
    </div>
  )
}