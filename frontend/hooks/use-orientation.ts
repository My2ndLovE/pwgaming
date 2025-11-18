import { useState, useEffect } from 'react';

export type Orientation = 'portrait' | 'landscape';

interface UseOrientationReturn {
  orientation: Orientation;
  isPortrait: boolean;
  isLandscape: boolean;
}

/**
 * Hook to detect device orientation
 * Returns current orientation and helpers
 */
export function useOrientation(): UseOrientationReturn {
  const [orientation, setOrientation] = useState<Orientation>('portrait');

  useEffect(() => {
    // Initial check
    const checkOrientation = () => {
      if (typeof window === 'undefined') return;

      const isLandscape = window.matchMedia('(orientation: landscape)').matches;
      setOrientation(isLandscape ? 'landscape' : 'portrait');
    };

    checkOrientation();

    // Listen for orientation changes
    const mediaQuery = window.matchMedia('(orientation: landscape)');

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setOrientation(e.matches ? 'landscape' : 'portrait');
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange as any);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange as any);
      }
    };
  }, []);

  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
  };
}

/**
 * Hook to detect if device is mobile-sized with landscape orientation
 * Useful for showing landscape warnings/hints
 */
export function useMobileLandscape(): boolean {
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);

  useEffect(() => {
    const checkMobileLandscape = () => {
      if (typeof window === 'undefined') return;

      const isLandscape = window.matchMedia('(orientation: landscape)').matches;
      const isSmallScreen = window.innerHeight < 600; // Mobile landscape typically < 600px height

      setIsMobileLandscape(isLandscape && isSmallScreen);
    };

    checkMobileLandscape();

    // Listen for both orientation and resize changes
    const orientationQuery = window.matchMedia('(orientation: landscape)');

    const handleChange = () => {
      checkMobileLandscape();
    };

    orientationQuery.addEventListener('change', handleChange);
    window.addEventListener('resize', handleChange);

    return () => {
      orientationQuery.removeEventListener('change', handleChange);
      window.removeEventListener('resize', handleChange);
    };
  }, []);

  return isMobileLandscape;
}
