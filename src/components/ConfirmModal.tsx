import { useEffect } from 'react';
import { motion } from 'motion/react';

type Variant = 'danger' | 'warning' | 'primary';

interface ConfirmModalProps {
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel?: string;
    variant?: Variant;
    onCancel: () => void;
    onConfirm: () => void;
}

const VARIANT_BTN: Record<Variant, string> = {
    danger: 'bg-rose-600 hover:bg-rose-700',
    warning: 'bg-amber-600 hover:bg-amber-700',
    primary: 'bg-slate-950 hover:bg-slate-800',
};

export default function ConfirmModal({
    title,
    description,
    confirmLabel,
    cancelLabel = 'Cancelar',
    variant = 'danger',
    onCancel,
    onConfirm,
}: ConfirmModalProps) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onCancel]);

    return (
        <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/50"
            onClick={onCancel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
        >
            <motion.div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-white border border-slate-200 rounded-lg overflow-hidden"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="px-6 py-4 bg-[#1e40af]">
                    <h3 id="confirm-title" className="text-[15px] font-semibold text-white tracking-tight">
                        {title}
                    </h3>
                </div>

                <div className="px-6 py-5">
                    <p className="text-[13px] text-slate-600 leading-relaxed">{description}</p>
                </div>

                <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`h-9 px-3 text-white text-[13px] font-medium rounded-md transition-colors cursor-pointer ${VARIANT_BTN[variant]}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
