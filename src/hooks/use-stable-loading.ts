"use client";

import { useEffect, useState } from "react";

/**
 * Custom hook to prevent flashing by ensuring a minimum loading time
 * This helps prevent rapid state transitions that cause UI flashing
 */
export function useStableLoading(isLoading: boolean, minLoadingTime: number = 300) {
  const [stableLoading, setStableLoading] = useState(isLoading);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading && !stableLoading) {
      // Start loading
      setStableLoading(true);
      setLoadingStartTime(Date.now());
    } else if (!isLoading && stableLoading) {
      // Check if minimum time has passed
      const now = Date.now();
      const elapsed = loadingStartTime ? now - loadingStartTime : minLoadingTime;
      
      if (elapsed >= minLoadingTime) {
        // Minimum time has passed, stop loading immediately
        setStableLoading(false);
        setLoadingStartTime(null);
      } else {
        // Wait for remaining time
        const remainingTime = minLoadingTime - elapsed;
        setTimeout(() => {
          setStableLoading(false);
          setLoadingStartTime(null);
        }, remainingTime);
      }
    }
  }, [isLoading, stableLoading, loadingStartTime, minLoadingTime]);

  return stableLoading;
}