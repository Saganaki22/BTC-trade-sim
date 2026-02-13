
import { useAppStore } from '@/store/appStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatBTC, formatPercent } from '@/lib/utils'
import { TrendingUp, TrendingDown, Clock } from 'lucide-react'

export function TradeHistory() {
  const { history } = useAppStore()

  if (history.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No trade history yet</p>
        <p className="text-sm mt-2">Close a position to see it here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {history.map((trade) => (
        <Card key={trade.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {trade.side === 'long' ? (
                  <TrendingUp className="w-5 h-5 text-long" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-short" />
                )}
                <CardTitle className="text-lg capitalize">{trade.side}</CardTitle>
                <Badge variant={trade.side === 'long' ? 'long' : 'short'}>
                  {trade.leverage}x
                </Badge>
              </div>
              <Badge 
                variant={trade.pnl >= 0 ? 'default' : 'destructive'}
                className={trade.pnl >= 0 ? 'bg-long' : 'bg-short'}
              >
                {trade.pnl >= 0 ? '+' : ''}{formatPercent(trade.pnlPercent)}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Entry Price</p>
                <p className="font-mono font-medium">{formatPrice(trade.entryPrice)}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground">Exit Price</p>
                <p className="font-mono font-medium">{formatPrice(trade.exitPrice)}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground">Position Size</p>
                <p className="font-mono font-medium">{trade.size} BTC</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground">Close Reason</p>
                <p className="font-mono font-medium capitalize">{trade.closeReason}</p>
              </div>
            </div>

            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Profit/Loss</p>
                  <p className={`text-xl font-mono font-bold ${
                    trade.pnl >= 0 ? 'text-long' : 'text-short'
                  }`}>
                    {trade.pnl >= 0 ? '+' : ''}{formatBTC(trade.pnl)} BTC
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Closed</p>
                  <p className="text-xs font-mono">
                    {new Date(trade.closeTime).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}