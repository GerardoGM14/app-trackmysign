import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { BsX, BsCloudUpload, BsImage, BsArrowRepeat, BsSend } from 'react-icons/bs';
import { useToast } from '../../context/ToastContext';

interface ProofUploaderProps {
    orderId: string;
    customerEmail: string;
    onClose: () => void;
    onSubmit: (data: { imageUrl: string; notes: string }) => void;
}

const SAMPLE_PROOFS = [
    'https://images.unsplash.com/photo-1523474438810-b04a2480633c?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1616627988043-cf6daca0d3a1?auto=format&fit=crop&q=80&w=800',
];

export default function ProofUploader({ orderId, customerEmail, onClose, onSubmit }: ProofUploaderProps) {
    const { showToast } = useToast();
    const [imageUrl, setImageUrl] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const readFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            showToast('El archivo debe ser una imagen.', 'error');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast('La imagen no debe superar los 5 MB.', 'warning');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === 'string') setImageUrl(result);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files[0];
        if (file) readFile(file);
    };

    const handleSubmit = async () => {
        if (!imageUrl) {
            showToast('Selecciona una imagen de prueba antes de enviar.', 'warning');
            return;
        }
        setSubmitting(true);
        await new Promise((r) => setTimeout(r, 600));
        onSubmit({ imageUrl, notes: notes.trim() });
    };

    return (
        <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
        >
            <motion.div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col max-h-[92vh]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="proof-title"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="px-6 py-4 bg-[#1e40af] flex items-center justify-between">
                    <h3 id="proof-title" className="text-[15px] font-semibold text-white tracking-tight">
                        Enviar prueba al cliente
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="w-7 h-7 rounded hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                    >
                        <BsX size={18} />
                    </button>
                </div>

                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60">
                    <p className="text-[12px] text-slate-500">
                        Para la orden{' '}
                        <span className="font-mono font-semibold text-slate-900">{orderId}</span>
                    </p>
                    <p className="text-[12px] text-slate-500 mt-0.5">
                        Se enviará a{' '}
                        <span className="font-mono text-slate-700">{customerEmail}</span>
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-4">
                    {/* Upload area */}
                    {!imageUrl ? (
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragActive(true);
                            }}
                            onDragLeave={() => setDragActive(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-md px-6 py-10 text-center cursor-pointer transition-colors ${dragActive
                                    ? 'border-[#1e40af] bg-[#1e40af]/5'
                                    : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                                }`}
                        >
                            <BsCloudUpload size={28} className="text-slate-400 mx-auto mb-2" />
                            <p className="text-[13px] font-semibold text-slate-700">
                                Arrastra una imagen o haz click para seleccionar
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1">
                                PNG, JPG o WebP · máx. 5 MB
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) readFile(file);
                                }}
                            />
                        </div>
                    ) : (
                        <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50">
                            <div className="relative">
                                <img
                                    src={imageUrl}
                                    alt="Vista previa de la prueba"
                                    className="w-full max-h-[280px] object-contain"
                                />
                                <button
                                    type="button"
                                    onClick={() => setImageUrl('')}
                                    aria-label="Quitar imagen"
                                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-950/70 text-white hover:bg-slate-950 flex items-center justify-center cursor-pointer transition-colors backdrop-blur-sm"
                                >
                                    <BsX size={14} />
                                </button>
                            </div>
                            <div className="px-3 py-2 border-t border-slate-200 flex items-center justify-between">
                                <span className="text-[11px] text-slate-500 inline-flex items-center gap-1.5">
                                    <BsImage size={11} />
                                    Imagen lista para enviar
                                </span>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-[11px] text-[#1e40af] hover:text-[#1e3a8a] font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                    <BsArrowRepeat size={11} />
                                    Reemplazar
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) readFile(file);
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Quick samples (mock) */}
                    {!imageUrl && (
                        <div>
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                                O usa una muestra
                            </p>
                            <div className="grid grid-cols-4 gap-2">
                                {SAMPLE_PROOFS.map((url, i) => (
                                    <button
                                        key={url}
                                        type="button"
                                        onClick={() => setImageUrl(url)}
                                        className="aspect-square rounded-md overflow-hidden border border-slate-200 hover:border-[#1e40af] transition-colors cursor-pointer"
                                        title={`Muestra ${i + 1}`}
                                    >
                                        <img src={url} alt={`Muestra ${i + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">
                                Las muestras se incluyen para fines de demostración.
                            </p>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label htmlFor="proof-notes" className="block text-[13px] font-medium text-slate-700 mb-1.5">
                            Mensaje para el cliente
                            <span className="text-slate-400 font-normal ml-1">(opcional)</span>
                        </label>
                        <textarea
                            id="proof-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Indicaciones, dudas o detalles importantes sobre esta prueba..."
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all resize-none"
                            maxLength={400}
                        />
                        <p className="text-[11px] text-slate-400 mt-1">{notes.length} / 400 caracteres</p>
                    </div>
                </div>

                <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!imageUrl || submitting}
                        className="h-9 px-3 bg-slate-950 text-white text-[13px] font-medium rounded-md hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                        {submitting ? (
                            <>
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <BsSend size={12} />
                                Enviar prueba
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
