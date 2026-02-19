import { RefObject, useEffect, useRef } from 'react';

interface UseAutoScrollProps {
  isActive: boolean;
  speed: number;
  toggleAutoScroll: () => void;
  contentRef: RefObject<HTMLDivElement | null>;
}

export function useAutoScroll({ isActive, speed, toggleAutoScroll, contentRef }: UseAutoScrollProps) {
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      scrollIntervalRef.current = setInterval(() => {
        const contentElement = contentRef?.current;
        const scrollAmount = speed * 1;

        // Try inner scroll container first
        if (contentElement) {
          const maxScrollTop = contentElement.scrollHeight - contentElement.clientHeight;

          if (maxScrollTop > 0) {
            contentElement.scrollTop += scrollAmount;
            const tolerance = 5;
            const isAtBottom = contentElement.scrollTop >= maxScrollTop - tolerance;
            if (isAtBottom) toggleAutoScroll();
            return;
          }
        }

        // Fallback: scroll the document/window (when inner container has no overflow)
        const doc = document.scrollingElement || document.documentElement;
        const docMaxScroll = doc.scrollHeight - doc.clientHeight;
        if (docMaxScroll > 0) {
          doc.scrollTop += scrollAmount;
          const tolerance = 5;
          if (doc.scrollTop >= docMaxScroll - tolerance) toggleAutoScroll();
        } else {
          toggleAutoScroll();
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
  }, [isActive, speed, toggleAutoScroll, contentRef]);
}
