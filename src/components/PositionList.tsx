
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatBTC, formatPercent } from '@/lib/utils'
import { TrendingUp, TrendingDown, X } from 'lucide-react'

interface PositionListProps {
  showCompact?: boolean
}

export function PositionList({ showCompact = false }: PositionListProps) {
  const { positions, orders, closePosition, cancelOrder } = useAppStore()

  if (showCompact) {
    return (
      <div className="p-4 space-y-4">
        <h3 className="font-semibold">Positions ({positions.length})</h3>
        
        {positions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active positions</p>
        ) : (
          <div className="space-y-3">
            {positions.map((pos) => (
              <Card key={pos.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {pos.side === 'long' ? (
                        <TrendingUp className="w-4 h-4 text-long" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-short" />
                      )}
                      <span className="font-bold text-sm capitalize">
                        {pos.side}
                      </span>
                      <Badge variant="outline">{pos.leverage}x</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => closePosition(pos.id)}
                    >
                      Close
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Entry</p>
                      <p className="font-mono">{formatPrice(pos.entryPrice)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Size</p>
                      <p className="font-mono">{pos.size} BTC</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Margin</p>
                      <p className="font-mono">{formatBTC(pos.margin)} BTC</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">PnL</p>
                      <p className={`font-mono font-bold ${
                        pos.unrealizedPnl >= 0 ? 'text-long' : 'text-short'
                      }`}>
                        {pos.unrealizedPnl >= 0 ? '+' : ''}{formatBTC(pos.unrealizedPnl)} BTC
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex gap-2 text-xs">
                    {pos.stopLoss && (
                      <Badge variant="outline" className="text-destructive">
                        SL: {formatPrice(pos.stopLoss)}
                      </Badge>
                    )}
                    {pos.takeProfit && (
                      <Badge variant="outline" className="text-long">
                        TP: {formatPrice(pos.takeProfit)}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-muted-foreground">
                      Liq: {formatPrice(pos.liquidationPrice)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {orders.length > 0 && (
          <>
            <h3 className="font-semibold mt-6">Pending Orders ({orders.length})</h3>
            <div className="space-y-2">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold capitalize ${
                        order.side === 'long' ? 'text-long' : 'text-short'
                      }`}>
                        {order.side}
                      </span>
                      <span className="text-sm">@ {formatPrice(order.price)}</span>
                      <Badge variant="outline">{order.leverage}x</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => cancelOrder(order.id)}
                    >
                      <X size={16} />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {positions.length === 0 && orders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No active positions or orders</p>
          <p className="text-sm mt-1">Open a trade to get started</p>
        </div>
      ) : (
        <>
          {positions.map((pos) => (
            <Card key={pos.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {pos.side === 'long' ? (
                      <TrendingUp className="w-5 h-5 text-long" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-short" />
                    )}
                    <CardTitle className="text-lg capitalize">{pos.side}</CardTitle>
                    <Badge variant={pos.side === 'long' ? 'long' : 'short'}>
                      {pos.leverage}x
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => closePosition(pos.id)}
                  >
                    Close Position
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Entry Price</p>
                    <p className="font-mono font-medium">{formatPrice(pos.entryPrice)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Position Size</p>
                    <p className="font-mono font-medium">{pos.size} BTC</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Margin Used</p>
                    <p className="font-mono font-medium">{formatBTC(pos.margin)} BTC</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Liquidation</p>
                    <p className="font-mono font-medium text-destructive">{formatPrice(pos.liquidationPrice)}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Unrealized PnL</p>
                      <p className={`text-2xl font-mono font-bold ${
                        pos.unrealizedPnl >= 0 ? 'text-long' : 'text-short'
                      }`}>
                        {pos.unrealizedPnl >= 0 ? '+' : ''}{formatBTC(pos.unrealizedPnl)} BTC
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">ROE</p>
                      <p className={`text-xl font-mono font-bold ${
                        pos.unrealizedPnlPercent >= 0 ? 'text-long' : 'text-short'
                      }`}>
                        {formatPercent(pos.unrealizedPnlPercent)}
                      </p>
                    </div>
                  </div>
                </div>

                {(pos.stopLoss || pos.takeProfit) && (
                  <div className="flex gap-2 pt-2">
                    {pos.stopLoss && (
                      <Badge variant="outline" className="text-destructive">
                        Stop Loss: {formatPrice(pos.stopLoss)}
                      </Badge>
                    )}
                    {pos.takeProfit && (
                      <Badge variant="outline" className="text-long">
                        Take Profit: {formatPrice(pos.takeProfit)}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Limit Order</CardTitle>
                    <Badge variant={order.side === 'long' ? 'long' : 'short'} className="capitalize">
                      {order.side}
                    </Badge>
                  </div>                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => cancelOrder(order.id)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Trigger Price</p>
                    <p className="font-mono font-medium">{formatPrice(order.price)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Size</p>
                    <p className="font-mono font-medium">{order.size} BTC</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Leverage</p>
                    <p className="font-mono font-medium">{order.leverage}x</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  )
}