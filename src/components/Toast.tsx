import { useEffect, useState } from 'react';
import { FaCheckCircle } from "react-icons/fa";
import { BiSolidXCircle } from "react-icons/bi";

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
                    <FaCheckCircle size={22} className="text-emerald-500" />
                ) : (
                    <BiSolidXCircle size={24} className="text-rose-500" />
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


            {/* Progress Bar (Optional, for visual flair) */}
            <div className="absolute bottom-0 left-0 h-1 bg-slate-50 w-full rounded-b-2xl overflow-hidden">
                <div
                    className={`h-full transition-all duration-[5000ms] linear ${type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: isVisible ? '0%' : '100%' }}
                />
            </div>
        </div>
    );
}
