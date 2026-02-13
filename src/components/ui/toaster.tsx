
import { useAppStore } from '@/store/appStore'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts, removeToast } = useAppStore()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "relative flex w-full max-w-sm items-center gap-4 rounded-lg border p-4 shadow-lg transition-all animate-in slide-in-from-bottom-5",
            toast.variant === 'destructive' && "border-destructive bg-destructive text-destructive-foreground",
            toast.variant === 'success' && "border-green-500/50 bg-green-500/10 text-green-500",
            toast.variant === 'warning' && "border-yellow-500/50 bg-yellow-500/10 text-yellow-500",
            toast.variant === 'info' && "border-blue-500/50 bg-blue-500/10 text-blue-500",
            !toast.variant && "border-border bg-background text-foreground"
          )}
        >
          <div className="flex-1">
            <p className="font-medium">{toast.title}</p>
            {toast.description && (
              <p className="text-sm text-muted-foreground">{toast.description}</p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="rounded-md p-1 hover:bg-secondary"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}