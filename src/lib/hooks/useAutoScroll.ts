import { useEffect, useRef } from 'react';

interface UseAutoScrollProps {
  isActive: boolean;
  speed: number;
  toggleAutoScroll: () => void;
}

export function useAutoScroll({ isActive, speed, toggleAutoScroll }: UseAutoScrollProps) {
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      scrollIntervalRef.current = setInterval(() => {
        const contentElement = document.querySelector('.song-content-scrollable') as HTMLElement;
        if (contentElement) {
          const scrollAmount = speed * 1;
          const maxScrollTop = contentElement.scrollHeight - contentElement.clientHeight;
          
          if (maxScrollTop <= 0) {
            toggleAutoScroll();
            return;
          }
          
          contentElement.scrollTop += scrollAmount;
          
          const tolerance = 5;
          const isAtBottom = contentElement.scrollTop >= maxScrollTop - tolerance;
          
          if (isAtBottom) {
            toggleAutoScroll();
          }
        }
      }, 50);
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [isActive, speed, toggleAutoScroll]);
}
