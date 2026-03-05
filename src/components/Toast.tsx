import { useEffect, useState } from 'react';
import { IoCheckmark, IoClose } from "react-icons/io5";

export type ToastType = 'success' | 'error';

interface ToastProps {
    message: string;
    type: ToastType;
    duration?: number;
    onClose: () => void;
}

export default function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Entrance animation
        setIsVisible(true);

        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for exit animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getCleanMessage = (msg: string) => {
        // 1. Remove initial technical prefixes like "Firebase: ", "FirebaseError: ", etc.
        let clean = msg.replace(/^Firebase(Error)?:\s+/i, '');

        // 2. Remove the (auth/code) part at the end
        clean = clean.replace(/\s*\(\s*auth\/[a-z-]+\s*\)\s*\.?$/i, '');

        // 3. Trim and capitalize first letter if needed
        clean = clean.trim();
        if (clean.length > 0) {
            clean = clean.charAt(0).toUpperCase() + clean.slice(1);
        }

        return clean;
    };

    return (
        <div
            className={`
        fixed bottom-6 right-6 z-[200]
        flex items-center gap-4 p-4 min-w-[320px] max-w-md
        bg-white rounded-2xl shadow-2xl border border-slate-100
        transition-all duration-500 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}
      `}
        >
            {/* Icon Area */}
            <div className="flex-shrink-0">
                {type === 'success' ? (
                    <div className="bg-green-100 p-2 rounded-full overflow-hidden">
                        <div className="bg-green-500 rounded-full w-6 h-6 flex items-center justify-center text-white">
                            <IoCheckmark size={16} strokeWidth={2} />
                        </div>
                    </div>
                ) : (
                    <div className="bg-red-100 p-2 rounded-full overflow-hidden">
                        <div className="bg-red-500 rounded-full w-6 h-6 flex items-center justify-center text-white">
                            <IoClose size={16} strokeWidth={2} />
                        </div>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-grow pr-2">
                <p className="text-sm font-bold text-slate-900 leading-tight">
                    {type === 'success' ? 'Success' : 'Error'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 break-words">
                    {getCleanMessage(message)}
                </p>
            </div>

            {/* Manual Close Button */}
            <button
                onClick={() => {
                    setIsVisible(false);
                    setTimeout(onClose, 300);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
            >
                <IoClose size={20} />
            </button>

            {/* Progress Bar (Optional, for visual flair) */}
            <div className="absolute bottom-0 left-0 h-1 bg-slate-50 w-full rounded-b-2xl overflow-hidden">
                <div
                    className={`h-full transition-all duration-[5000ms] linear ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: isVisible ? '0%' : '100%' }}
                />
            </div>
        </div>
    );
}
