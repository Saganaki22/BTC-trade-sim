
import { Bitcoin, Loader2 } from 'lucide-react'

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-muted border-t-btc animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Bitcoin className="w-8 h-8 text-btc" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold mt-6">BTC Trading Pro</h1>
      <p className="text-muted-foreground mt-2">Connecting to market...</p>
      
      <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Fetching live Bitcoin price</span>
      </div>
      
      <p className="text-xs text-muted-foreground mt-8">Powered by CoinGecko API</p>
    </div>
  )
}