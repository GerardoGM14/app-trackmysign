import { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { motion } from 'motion/react';
import {
    BsX,
    BsCheck2,
    BsArrowCounterclockwise,
    BsFileEarmarkPdf,
    BsPencil,
    BsType,
    BsCheckCircleFill,
} from 'react-icons/bs';

interface SignatureDoc {
    id: string;
    title: string;
    sender: string;
    type: string;
}

interface SignatureModalProps {
    doc: SignatureDoc;
    signerName: string;
    onClose: () => void;
    onSign: (signatureDataUrl: string) => void;
}

type Mode = 'draw' | 'type';

const TYPED_FONTS = [
    { id: 'cursive-1', label: 'Sweet', family: '"Brush Script MT", "Lucida Handwriting", cursive' },
    { id: 'cursive-2', label: 'Elegant', family: '"Segoe Script", "Bradley Hand", cursive' },
    { id: 'cursive-3', label: 'Casual', family: '"Comic Sans MS", "Marker Felt", cursive' },
];

export default function SignatureModal({ doc, signerName, onClose, onSign }: SignatureModalProps) {
    const sigRef = useRef<SignatureCanvas | null>(null);
    const [mode, setMode] = useState<Mode>('draw');
    const [hasDrawn, setHasDrawn] = useState(false);
    const [typedText, setTypedText] = useState(signerName);
    const [typedFont, setTypedFont] = useState(TYPED_FONTS[0].id);
    const [accepted, setAccepted] = useState(false);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const clearSignature = () => {
        if (mode === 'draw') {
            sigRef.current?.clear();
            setHasDrawn(false);
        } else {
            setTypedText('');
        }
    };

    const isReady = accepted && (mode === 'draw' ? hasDrawn : typedText.trim().length > 1);

    const handleConfirm = () => {
        if (!isReady) return;

        if (mode === 'draw' && sigRef.current) {
            const dataUrl = sigRef.current.getCanvas().toDataURL('image/png');
            onSign(dataUrl);
            return;
        }

        // Typed mode → render canvas with the chosen font and return as image
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const font = TYPED_FONTS.find((f) => f.id === typedFont) ?? TYPED_FONTS[0];
        ctx.fillStyle = '#1e293b';
        ctx.font = `48px ${font.family}`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText(typedText, canvas.width / 2, canvas.height / 2);
        onSign(canvas.toDataURL('image/png'));
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
                className="w-full max-w-2xl bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col max-h-[90vh]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="sig-title"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Header */}
                <div className="px-6 py-4 bg-[#1e40af] flex items-center justify-between shrink-0">
                    <h3 id="sig-title" className="text-[15px] font-semibold text-white tracking-tight">
                        Firmar documento
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

                {/* Doc info */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex items-start gap-3">
                    <span className="w-9 h-9 rounded-md bg-rose-500 border border-rose-600 flex items-center justify-center text-white shrink-0">
                        <BsFileEarmarkPdf size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-slate-900 truncate">{doc.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                            <span>{doc.type}</span>
                            <span className="text-slate-300">·</span>
                            <span>de {doc.sender}</span>
                            <span className="text-slate-300">·</span>
                            <span className="font-mono">{doc.id}</span>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 overflow-y-auto custom-scrollbar">
                    {/* Mode tabs */}
                    <div className="inline-flex h-9 bg-slate-100 border border-slate-200 rounded-md p-0.5 mb-4">
                        <button
                            type="button"
                            onClick={() => {
                                setMode('draw');
                                setHasDrawn(false);
                            }}
                            className={`px-3 text-[12px] font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${mode === 'draw'
                                    ? 'bg-white text-slate-900 border border-slate-200'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            <BsPencil size={11} />
                            Dibujar
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('type')}
                            className={`px-3 text-[12px] font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${mode === 'type'
                                    ? 'bg-white text-slate-900 border border-slate-200'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            <BsType size={12} />
                            Escribir
                        </button>
                    </div>

                    {/* Draw canvas */}
                    {mode === 'draw' && (
                        <div>
                            <p className="text-[12px] text-slate-500 mb-2">
                                Dibuja tu firma con el ratón o el dedo dentro del recuadro.
                            </p>
                            <div className="relative bg-slate-50 border-2 border-dashed border-slate-300 rounded-md overflow-hidden">
                                <SignatureCanvas
                                    ref={sigRef}
                                    canvasProps={{
                                        className: 'w-full h-[200px] touch-none',
                                    }}
                                    backgroundColor="#f8fafc"
                                    penColor="#0f172a"
                                    minWidth={1.2}
                                    maxWidth={2.5}
                                    velocityFilterWeight={0.7}
                                    onEnd={() => setHasDrawn(true)}
                                />
                                {!hasDrawn && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <p className="text-[12px] text-slate-400 italic">Firma aquí ✎</p>
                                    </div>
                                )}
                                <div className="absolute bottom-2 left-3 right-3 border-t border-slate-300/60" />
                            </div>
                            <button
                                type="button"
                                onClick={clearSignature}
                                disabled={!hasDrawn}
                                className="mt-2 text-[12px] text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <BsArrowCounterclockwise size={11} />
                                Limpiar firma
                            </button>
                        </div>
                    )}

                    {/* Type signature */}
                    {mode === 'type' && (
                        <div>
                            <label htmlFor="typed-name" className="block text-[12px] text-slate-500 mb-2">
                                Escribe tu nombre completo. Se generará una firma con la tipografía elegida.
                            </label>
                            <input
                                id="typed-name"
                                type="text"
                                value={typedText}
                                onChange={(e) => setTypedText(e.target.value)}
                                placeholder="Tu nombre"
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all mb-3"
                            />

                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                                Estilo de firma
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                                {TYPED_FONTS.map((font) => {
                                    const selected = typedFont === font.id;
                                    return (
                                        <button
                                            key={font.id}
                                            type="button"
                                            onClick={() => setTypedFont(font.id)}
                                            className={`relative h-16 border rounded-md flex items-center justify-center transition-colors cursor-pointer overflow-hidden ${selected
                                                    ? 'border-[#1e40af] bg-[#1e40af]/[0.03] ring-2 ring-[#1e40af]/15'
                                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                                }`}
                                        >
                                            <span
                                                className="text-slate-900 truncate px-2"
                                                style={{ fontFamily: font.family, fontSize: '22px' }}
                                            >
                                                {typedText.trim() || 'Firma'}
                                            </span>
                                            {selected && (
                                                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#1e40af] text-white flex items-center justify-center">
                                                    <BsCheck2 size={11} />
                                                </span>
                                            )}
                                            <span className="absolute bottom-1 left-2 text-[9px] text-slate-400 uppercase tracking-wider">
                                                {font.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Preview */}
                            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-md h-[160px] flex items-center justify-center px-4">
                                {typedText.trim() ? (
                                    <span
                                        className="text-slate-900 text-center"
                                        style={{
                                            fontFamily: TYPED_FONTS.find((f) => f.id === typedFont)?.family,
                                            fontSize: '40px',
                                        }}
                                    >
                                        {typedText}
                                    </span>
                                ) : (
                                    <p className="text-[12px] text-slate-400 italic">Vista previa de tu firma</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Legal acceptance */}
                    <label className="flex items-start gap-2.5 mt-4 cursor-pointer select-none p-3 border border-slate-200 rounded-md hover:bg-slate-50/60 transition-colors">
                        <input
                            type="checkbox"
                            checked={accepted}
                            onChange={(e) => setAccepted(e.target.checked)}
                            style={{ accentColor: '#1e40af' }}
                            className="w-4 h-4 mt-0.5 rounded border-slate-300 cursor-pointer shrink-0"
                        />
                        <span className="text-[12px] text-slate-600 leading-relaxed">
                            Confirmo que esta es mi firma legal y que acepto el contenido del documento. Esta acción
                            tiene la misma validez que una firma manuscrita en papel.
                        </span>
                    </label>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
                    <span className="text-[11px] text-slate-400 hidden sm:block">
                        Firmando como <span className="font-semibold text-slate-700">{signerName}</span>
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={!isReady}
                            className="h-9 px-3 bg-[#1e40af] text-white text-[13px] font-medium rounded-md hover:bg-[#1e3a8a] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            <BsCheckCircleFill size={13} />
                            Confirmar firma
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
