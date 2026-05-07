import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BsCheckCircleFill, BsDownload } from 'react-icons/bs';

interface ExportOverlayProps {
    label?: string;
    description?: string;
    /** Total simulated duration in ms. Default 2200ms. */
    durationMs?: number;
    onComplete?: () => void;
}

/**
 * Full-screen blocking overlay shown during export operations.
 * Prevents user interaction with the underlying UI until the work completes.
 */
export default function ExportOverlay({
    label = 'Exportando datos',
    description = 'Por favor espera mientras preparamos tu archivo.',
    durationMs = 2200,
    onComplete,
}: ExportOverlayProps) {
    const [progress, setProgress] = useState(0);
    const [done, setDone] = useState(false);

    useEffect(() => {
        const start = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            const next = Math.min(100, (elapsed / durationMs) * 100);
            setProgress(next);
            if (next >= 100) {
                clearInterval(interval);
                setDone(true);
                setTimeout(() => onComplete?.(), 600);
            }
        }, 60);
        return () => clearInterval(interval);
    }, [durationMs, onComplete]);

    return (
        <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            role="alertdialog"
            aria-busy={!done}
            aria-live="polite"
        >
            <motion.div
                className="bg-white border border-slate-200 rounded-lg w-full max-w-sm overflow-hidden"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="px-6 pt-6 pb-4 flex items-start gap-3">
                    <span className={`shrink-0 mt-0.5 ${done ? 'text-emerald-600' : 'text-[#1e40af]'}`}>
                        {done ? <BsCheckCircleFill size={18} /> : <BsDownload size={16} />}
                    </span>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-[14px] font-semibold text-slate-900 leading-tight">
                            {done ? 'Exportación completada' : label}
                        </h3>
                        <p className="text-[12px] text-slate-500 mt-1 leading-snug">
                            {done ? 'Tu archivo se ha descargado correctamente.' : description}
                        </p>
                    </div>
                </div>

                <div className="px-6 pb-5">
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-[width] duration-100 ease-linear ${done ? 'bg-emerald-500' : 'bg-[#1e40af]'
                                }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                            {Math.floor(progress)}%
                        </span>
                        <span className="text-[10px] text-slate-400">
                            {done ? 'Listo' : 'Procesando...'}
                        </span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
