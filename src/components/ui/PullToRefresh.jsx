import { useState, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 64;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);

  const onTouchStart = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    if (el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      e.preventDefault();
      setPullY(Math.min(delta * 0.5, THRESHOLD + 20));
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (pullY >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullY(0);
      startY.current = null;
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    } else {
      setPullY(0);
      startY.current = null;
    }
  }, [pullY, refreshing, onRefresh]);

  const showIndicator = pullY > 0 || refreshing;
  const progress = Math.min(pullY / THRESHOLD, 1);

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      {/* Indicator */}
      <div
        className="lg:hidden absolute top-0 left-0 right-0 flex items-center justify-center z-10 transition-all duration-150 pointer-events-none"
        style={{ height: showIndicator ? (refreshing ? 48 : pullY) : 0, opacity: showIndicator ? 1 : 0 }}
      >
        <div className={`w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ${refreshing ? "animate-spin" : ""}`}
          style={{ opacity: refreshing ? 1 : progress, transform: `rotate(${progress * 180}deg)` }}>
          <RefreshCw className="w-4 h-4 text-primary" />
        </div>
      </div>

      {/* Scrollable content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        style={{ transform: pullY > 0 ? `translateY(${pullY}px)` : undefined, transition: pullY > 0 ? "none" : "transform 0.2s ease" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}