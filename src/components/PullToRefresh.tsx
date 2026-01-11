import { useState, useRef, useCallback, type ReactNode } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import styles from './PullToRefresh.module.css';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only start pull if at top of scroll
    if (containerRef.current && containerRef.current.scrollTop <= 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Apply resistance to pull
      const resistance = Math.min(diff * 0.5, MAX_PULL);
      setPullDistance(resistance);

      // Prevent default scroll when pulling
      if (containerRef.current && containerRef.current.scrollTop <= 0) {
        e.preventDefault();
      }
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD * 0.6); // Keep indicator visible during refresh

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={styles.indicator}
        style={{
          transform: `translateY(${pullDistance - 50}px)`,
          opacity: progress,
          transition: isPulling.current ? 'none' : 'all 0.4s ease-out'
        }}
      >
        <ArrowPathIcon
          className={`${styles.icon} ${isRefreshing ? styles.spinning : ''}`}
          style={{
            transform: isRefreshing ? undefined : `rotate(${progress * 180}deg)`
          }}
        />
      </div>

      {/* Content with pull transform */}
      <div
        className={styles.content}
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling.current ? 'none' : 'transform 0.4s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
}
