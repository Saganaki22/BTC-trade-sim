import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import { Header } from '@/components/Header'
import { Chart } from '@/components/Chart'
import { TradePanel } from '@/components/TradePanel'
import { PositionList } from '@/components/PositionList'
import { StrategyCoach } from '@/components/StrategyCoach'
import { TradeHistory } from '@/components/TradeHistory'
import { ResizablePanel } from '@/components/ResizablePanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toaster } from '@/components/ui/toaster'
import { LoadingScreen } from '@/components/LoadingScreen'
import { AIToggle } from '@/components/AIToggle'
import { TrendingUp, List, Brain, BarChart3 } from 'lucide-react'

function App() {
  const { 
    isLoading, 
    initialize, 
    startSimulation,
    activeTab,
    setActiveTab,
    breakpoint
  } = useAppStore()

  useEffect(() => {
    initialize().then(() => {
      startSimulation()
    })
  }, [])

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 768) {
        useAppStore.getState().setBreakpoint('mobile')
      } else if (width < 1024) {
        useAppStore.getState().setBreakpoint('tablet')
      } else {
        useAppStore.getState().setBreakpoint('desktop')
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (isLoading) {
    return <LoadingScreen />
  }

  // Chart component with AI toggle
  const chartContent = (
    <div className="relative w-full h-full">
      <Chart />
      <div className="absolute bottom-20 right-4 z-20">
        <AIToggle />
      </div>
    </div>
  )

  // Trading panel content
  const tradingContent = (
    <div className="h-full flex flex-col bg-card">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full grid grid-cols-4 px-2 sm:px-4 pt-2 shrink-0 h-10 sm:h-12">
          <TabsTrigger value="trade" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Trade</span>
          </TabsTrigger>
          <TabsTrigger value="positions" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2">
            <List className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Positions</span>
            <span className="xs:hidden">Pos</span>
          </TabsTrigger>
          <TabsTrigger value="coach" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2">
            <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Coach</span>
            <span className="xs:hidden">AI</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2">
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">History</span>
            <span className="xs:hidden">Hist</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-2 sm:p-4 min-h-0">
          <TabsContent value="trade" className="mt-0 h-full">
            <TradePanel />
          </TabsContent>

          <TabsContent value="positions" className="mt-0 h-full">
            <PositionList />
          </TabsContent>

          <TabsContent value="coach" className="mt-0 h-full">
            <StrategyCoach />
          </TabsContent>

          <TabsContent value="history" className="mt-0 h-full">
            <TradeHistory />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <Header />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {breakpoint === 'desktop' ? (
            // Desktop: Resizable panels
            <ResizablePanel
              topContent={chartContent}
              bottomContent={tradingContent}
              initialTopHeight={55}
              minTopHeight={25}
              maxTopHeight={75}
            />
          ) : (
            // Mobile/Tablet: Fixed split
            <>
              {/* Chart */}
              <div className="flex-1 min-h-[40vh] sm:min-h-[35vh] relative">
                {chartContent}
              </div>
              
              {/* Trading Panel */}
              <div className="h-[50vh] sm:h-[45vh]">
                {tradingContent}
              </div>
            </>
          )}
        </div>

        {/* Desktop Sidebar - Right Side */}
        {breakpoint === 'desktop' && (
          <div className="w-80 border-l border-border bg-card flex flex-col shrink-0">
            <div className="p-4 border-b border-border shrink-0">
              <h3 className="font-semibold">Positions & Orders</h3>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              <PositionList showCompact />
            </div>
          </div>
        )}
      </div>

      <Toaster />
    </div>
  )
}

export default App