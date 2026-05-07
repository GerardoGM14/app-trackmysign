import { useEffect, useState } from 'react';
import { BsCheckCircleFill, BsXCircleFill, BsExclamationTriangleFill, BsInfoCircleFill, BsX } from 'react-icons/bs';
import { motion } from 'motion/react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    duration?: number;
    onClose: () => void;
}

const TOAST_CONFIG: Record<ToastType, { title: string; icon: typeof BsCheckCircleFill; iconColor: string; accent: string }> = {
    success: { title: 'Listo', icon: BsCheckCircleFill, iconColor: 'text-emerald-600', accent: 'bg-emerald-500' },
    error: { title: 'Error', icon: BsXCircleFill, iconColor: 'text-rose-600', accent: 'bg-rose-500' },
    warning: { title: 'Atención', icon: BsExclamationTriangleFill, iconColor: 'text-amber-600', accent: 'bg-amber-500' },
    info: { title: 'Información', icon: BsInfoCircleFill, iconColor: 'text-[#1e40af]', accent: 'bg-[#1e40af]' },
};

function cleanMessage(msg: string) {
    let clean = msg.replace(/^Firebase(Error)?:\s+/i, '');
    clean = clean.replace(/\s*\(\s*auth\/[a-z-]+\s*\)\s*\.?$/i, '');
    clean = clean.trim();
    if (clean.length > 0) {
        clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    }
    return clean;
}

export default function Toast({ message, type, duration = 4500, onClose }: ToastProps) {
    const [progress, setProgress] = useState(100);
    const config = TOAST_CONFIG[type];
    const Icon = config.icon;

    useEffect(() => {
        const start = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);
            if (remaining <= 0) {
                clearInterval(interval);
                onClose();
            }
        }, 50);

        return () => clearInterval(interval);
    }, [duration, onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 24, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-[340px] bg-white border border-slate-200 rounded-md overflow-hidden flex"
            role="alert"
        >
            <div className={`w-1 ${config.accent} flex-shrink-0`} />

            <div className="flex-1 px-3.5 py-3 flex items-start gap-3">
                <Icon className={`${config.iconColor} flex-shrink-0 mt-0.5`} size={16} />

                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 leading-tight">
                        {config.title}
                    </p>
                    <p className="text-[12px] text-slate-600 mt-0.5 leading-snug break-words">
                        {cleanMessage(message)}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar notificación"
                    className="flex-shrink-0 -mt-0.5 -mr-1 w-6 h-6 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
                >
                    <BsX size={16} />
                </button>
            </div>

            <div
                className={`absolute bottom-0 left-0 h-px ${config.accent} transition-[width] duration-[50ms] ease-linear`}
                style={{ width: `${progress}%` }}
            />
        </motion.div>
    );
}
