import { useEffect, useState } from 'react';

interface UseCountdownResult {
    active: boolean;
    secondsLeft: number;
}

export function useCountdown(target: number | null, onComplete?: () => void): UseCountdownResult {
    const [secondsLeft, setSecondsLeft] = useState(() =>
        target ? Math.max(0, Math.ceil((target - Date.now()) / 1000)) : 0,
    );

    useEffect(() => {
        if (!target) {
            setSecondsLeft(0);
            return;
        }

        const tick = () => {
            const remaining = Math.max(0, Math.ceil((target - Date.now()) / 1000));
            setSecondsLeft(remaining);
            return remaining;
        };

        if (tick() <= 0) {
            onComplete?.();
            return;
        }

        const interval = setInterval(() => {
            if (tick() <= 0) {
                clearInterval(interval);
                onComplete?.();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [target, onComplete]);

    return { active: secondsLeft > 0, secondsLeft };
}
