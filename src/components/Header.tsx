
import { useAppStore } from '@/store/appStore'
import { formatPrice, formatBTC, formatPercent } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Github } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  const { 
    currentPrice, 
    priceChangePercent, 
    account,
    isShockEvent,
    breakpoint
  } = useAppStore()

  const isPositive = priceChangePercent >= 0
  const isMobile = breakpoint === 'mobile'

  return (
    <header className="h-14 sm:h-16 border-b border-border bg-card flex items-center justify-between px-2 sm:px-4 shrink-0 z-20">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-btc flex items-center justify-center text-white font-bold text-base sm:text-lg">
          ₿
        </div>
        <div className="hidden xs:block">
          <h1 className="font-bold text-xs sm:text-sm">BTC/USD</h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Perpetual</p>
        </div>
      </div>

      <div className="flex flex-col items-center min-w-[120px] sm:min-w-[180px]">
        <div className={`text-lg sm:text-2xl font-bold font-mono tabular-nums ${isPositive ? 'text-long' : 'text-short'}`}>
          {isMobile ? `$${(currentPrice / 1000).toFixed(1)}k` : formatPrice(currentPrice)}
        </div>
        <div className="flex items-center justify-center gap-1 sm:gap-2 text-[10px] sm:text-xs">
          <span className={`tabular-nums ${isPositive ? 'text-long' : 'text-short'}`}>
            {formatPercent(priceChangePercent)}
          </span>
          {isShockEvent && (
            <Badge variant="destructive" className="text-[8px] sm:text-[10px] px-1 py-0 animate-pulse">
              {isMobile ? 'VOL' : 'HIGH VOL'}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-col items-end text-right min-w-[90px] sm:min-w-[140px]">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">Balance:</span>
            <span className="font-mono font-bold text-xs sm:text-sm tabular-nums">{formatBTC(account.balance)}</span>
          </div>
          {!isMobile && (
            <>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Avail:</span>
                <span className="font-mono text-accent tabular-nums">{formatBTC(account.availableMargin)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Used:</span>
                <span className="font-mono text-yellow-500 tabular-nums">{formatBTC(account.usedMargin)}</span>
              </div>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9"
          onClick={() => window.open('https://github.com/saganaki22/BTC-trade-sim', '_blank')}
          title="View on GitHub"
        >
          <Github className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>
    </header>
  )
}