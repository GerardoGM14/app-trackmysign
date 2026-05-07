/**
 * Indeterminate top-of-page progress bar (Linear / Vercel style).
 * Renders a thin sliding bar across the top — used as a brief route-change indicator.
 */
export default function TopProgressBar() {
    return (
        <>
            <div className="fixed top-0 left-0 right-0 h-[4px] bg-[#1e40af]/10 z-[300] pointer-events-none">
                <div className="h-full w-1/3 bg-[#1e40af] rounded-full animate-route-progress" />
            </div>
            <style>{`
                @keyframes route-progress {
                    0%   { transform: translateX(-100%); }
                    100% { transform: translateX(400%); }
                }
                .animate-route-progress {
                    animation: route-progress 0.6s ease-in-out infinite;
                }
            `}</style>
        </>
    );
}
