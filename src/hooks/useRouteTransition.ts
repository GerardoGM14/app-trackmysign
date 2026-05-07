import { useEffect, useState } from 'react';
import { useLocation, type Location } from 'react-router-dom';

interface UseRouteTransitionResult {
    displayedLocation: Location;
    showProgress: boolean;
}

/**
 * Decouples the rendered route from the URL so that a top progress bar can
 * play for a fixed duration before the new page mounts.
 */
export function useRouteTransition(durationMs: number): UseRouteTransitionResult {
    const location = useLocation();
    const [displayedLocation, setDisplayedLocation] = useState(location);
    const [showProgress, setShowProgress] = useState(false);

    useEffect(() => {
        if (location.pathname === displayedLocation.pathname) return;

        setShowProgress(true);
        const timer = setTimeout(() => {
            setDisplayedLocation(location);
            setShowProgress(false);
        }, durationMs);

        return () => clearTimeout(timer);
    }, [location, displayedLocation.pathname, durationMs]);

    return { displayedLocation, showProgress };
}
