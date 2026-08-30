/**
 * src/hooks/useBreakpoint.js
 * Reactive viewport breakpoint detection with debounced resize
 */
import { useState, useEffect } from 'react';

export function useBreakpoint() {
    const [state, setState] = useState(() => {
        const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const height = typeof window !== 'undefined' ? window.innerHeight : 800;
        const isTouch = typeof window !== 'undefined'
            ? ('ontouchstart' in window || navigator.maxTouchPoints > 0)
            : false;

        return {
            isMobile: width < 640,
            isTablet: width >= 640 && width < 1024,
            isLaptop: width >= 1024 && width < 1440,
            isDesktop: width >= 1440,
            width,
            height,
            isTouch,
        };
    });

    useEffect(() => {
        let timeoutId;

        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const width = window.innerWidth;
                const height = window.innerHeight;
                const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

                setState({
                    isMobile: width < 640,
                    isTablet: width >= 640 && width < 1024,
                    isLaptop: width >= 1024 && width < 1440,
                    isDesktop: width >= 1440,
                    width,
                    height,
                    isTouch,
                });
            }, 50);
        };

        window.addEventListener('resize', handleResize, { passive: true });
        window.addEventListener('orientationchange', handleResize, { passive: true });

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    return state;
}

export default useBreakpoint;
