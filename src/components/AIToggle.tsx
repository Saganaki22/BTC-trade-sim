
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AIToggle() {
  const { aiCoachEnabled, toggleAICoach } = useAppStore()

  return (
    <Button
      onClick={toggleAICoach}
      className={cn(
        "absolute bottom-3 right-3 w-12 h-12 rounded-full shadow-lg transition-all hover:scale-110",
        aiCoachEnabled 
          ? "bg-long hover:bg-long/90" 
          : "bg-accent hover:bg-accent/90 text-black"
      )}
      size="icon"
      title={aiCoachEnabled ? "AI Coach Enabled" : "AI Coach Disabled"}
    >
      <Brain className="w-6 h-6" />
      {aiCoachEnabled && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      )}
    </Button>
  )
}