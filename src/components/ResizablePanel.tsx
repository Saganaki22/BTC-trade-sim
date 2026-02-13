import { useState, useRef, useCallback, useEffect } from 'react';

interface ResizablePanelProps {
  topContent: React.ReactNode;
  bottomContent: React.ReactNode;
  initialTopHeight?: number; // percentage
  minTopHeight?: number; // percentage
  maxTopHeight?: number; // percentage
}

export function ResizablePanel({
  topContent,
  bottomContent,
  initialTopHeight = 55,
  minTopHeight = 25,
  maxTopHeight = 75,
}: ResizablePanelProps) {
  const [topHeight, setTopHeight] = useState(initialTopHeight);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const topPanelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleTouchStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
      
      if (newHeight >= minTopHeight && newHeight <= maxTopHeight) {
        setTopHeight(newHeight);
        
        // Trigger resize event for chart
        if (topPanelRef.current) {
          const resizeEvent = new CustomEvent('panel-resize', { 
            detail: { height: topPanelRef.current.clientHeight } 
          });
          window.dispatchEvent(resizeEvent);
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const newHeight = ((e.touches[0].clientY - rect.top) / rect.height) * 100;
      
      if (newHeight >= minTopHeight && newHeight <= maxTopHeight) {
        setTopHeight(newHeight);
        
        // Trigger resize event for chart
        if (topPanelRef.current) {
          const resizeEvent = new CustomEvent('panel-resize', { 
            detail: { height: topPanelRef.current.clientHeight } 
          });
          window.dispatchEvent(resizeEvent);
        }
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, minTopHeight, maxTopHeight]);

  return (
    <div 
      ref={containerRef}
      className="flex flex-col h-full w-full overflow-hidden"
    >
      {/* Top Panel - Chart */}
      <div 
        ref={topPanelRef}
        className="relative overflow-hidden"
        style={{ height: `${topHeight}%` }}
      >
        {topContent}
      </div>

      {/* Resizer Handle */}
      <div
        className={`
          h-2 bg-border hover:bg-accent cursor-row-resize 
          flex items-center justify-center shrink-0
          transition-colors duration-200 z-30
          ${isDragging ? 'bg-accent' : ''}
        `}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className={`
          bg-muted-foreground/50 rounded-full transition-all duration-200
          ${isDragging ? 'w-16 h-1' : 'w-12 h-0.5'}
        `} />
      </div>

      {/* Bottom Panel - Trading */}
      <div 
        className="flex-1 overflow-hidden flex flex-col min-h-0"
        style={{ height: `${100 - topHeight}%` }}
      >
        {bottomContent}
      </div>
    </div>
  );
}