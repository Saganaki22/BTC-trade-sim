
import { useAppStore } from '@/store/appStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { formatPercent } from '@/lib/utils'
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Target } from 'lucide-react'

export function StrategyCoach() {
  const { 
    aiCoachEnabled, 
    toggleAICoach, 
    patterns,
    candles,
    rsi 
  } = useAppStore()

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'bullFlag':
      case 'engulfing':
      case 'hammer':
      case 'oversold':
        return <TrendingUp className="w-4 h-4 text-long" />
      case 'bearFlag':
      case 'overbought':
        return <TrendingDown className="w-4 h-4 text-short" />
      case 'triangle':
      case 'doji':
        return <Target className="w-4 h-4 text-accent" />
      default:
        return <Brain className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-long/20 text-long border-long/50'
    if (confidence >= 0.6) return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50'
    return 'bg-muted text-muted-foreground'
  }

  const recentCandles = candles.slice(-20)
  const isBullish = recentCandles.length > 0 && 
    recentCandles[recentCandles.length - 1].close > recentCandles[0].open

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-accent" />
              <CardTitle>AI Strategy Coach</CardTitle>
            </div>            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{aiCoachEnabled ? 'On' : 'Off'}</span>
              <Switch checked={aiCoachEnabled} onCheckedChange={toggleAICoach} />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!aiCoachEnabled ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Enable AI Coach to see pattern detection and trading insights</p>
              <Button className="mt-4" onClick={toggleAICoach}>
                Enable AI Coach
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Market Bias</p>
                    <div className="flex items-center gap-2 mt-1">
                      {isBullish ? (
                        <>
                          <TrendingUp className="w-5 h-5 text-long" />
                          <span className="text-lg font-bold text-long">Bullish</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-5 h-5 text-short" />
                          <span className="text-lg font-bold text-short">Bearish</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">RSI Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-lg font-bold ${
                        rsi > 70 ? 'text-short' : rsi < 30 ? 'text-long' : 'text-muted-foreground'
                      }`}>
                        {rsi.toFixed(1)}
                      </span>
                      {rsi > 70 && (
                        <Badge variant="destructive">Overbought</Badge>
                      )}
                      {rsi < 30 && (
                        <Badge variant="long">Oversold</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Detected Patterns ({patterns.length})</h3>
                
                {patterns.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No patterns detected yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {patterns.slice().reverse().map((pattern, idx) => (
                      <Card key={idx} className="overflow-hidden">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">{getPatternIcon(pattern.type)}</div>
                            
                            <div className="flex-1">
                              <p className="text-sm font-medium">{pattern.message}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge 
                                  variant="outline" 
                                  className={getConfidenceColor(pattern.confidence)}
                                >
                                  {formatPercent(pattern.confidence * 100)} confidence
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {pattern.type}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}