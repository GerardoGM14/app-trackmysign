import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    BsPatchCheck,
    BsCheckCircleFill,
    BsXCircleFill,
    BsHourglassSplit,
    BsCheckCircle,
    BsXCircle,
    BsX,
    BsZoomIn,
} from 'react-icons/bs';
import { useCustomerData } from '../../../features/customer/CustomerDataContext';
import { useToast } from '../../../context/ToastContext';
import SignatureModal from '../../../components/SignatureModal';
import { CUSTOMER_PROFILE } from '../../../features/customer/customerData';
import type { Order, OrderProof } from '../../../features/orders/types';

type Tab = 'pending' | 'history';

export default function CustomerProofs() {
    const { orders, approveProof, rejectProof } = useCustomerData();
    const { showToast } = useToast();

    const [tab, setTab] = useState<Tab>('pending');
    const [zoomProof, setZoomProof] = useState<OrderProof | null>(null);
    const [signTarget, setSignTarget] = useState<{ order: Order; proof: OrderProof } | null>(null);
    const [rejectTarget, setRejectTarget] = useState<{ order: Order; proof: OrderProof } | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const pending = useMemo(
        () =>
            orders.flatMap((o) =>
                o.proofs.filter((p) => p.status === 'pending').map((p) => ({ order: o, proof: p })),
            ),
        [orders],
    );

    const history = useMemo(
        () =>
            orders.flatMap((o) =>
                o.proofs.filter((p) => p.status !== 'pending').map((p) => ({ order: o, proof: p })),
            ).sort((a, b) => (a.proof.respondedAt ?? '') < (b.proof.respondedAt ?? '') ? 1 : -1),
        [orders],
    );

    const handleSign = (signature: string) => {
        if (!signTarget) return;
        approveProof(signTarget.order.id, signTarget.proof.id, signature);
        showToast(`Prueba de ${signTarget.order.id} aprobada. Continuamos con la producción.`, 'success');
        setSignTarget(null);
    };

    const handleReject = () => {
        if (!rejectTarget || rejectReason.trim().length < 5) return;
        rejectProof(rejectTarget.order.id, rejectTarget.proof.id, rejectReason.trim());
        showToast(`Prueba rechazada. El equipo recibirá tu feedback.`, 'info');
        setRejectTarget(null);
        setRejectReason('');
    };

    const list = tab === 'pending' ? pending : history;

    return (
        <>
            <div className="space-y-5">
                <header>
                    <h1 className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight">
                        Pruebas
                    </h1>
                    <p className="text-sm text-slate-500 mt-1.5">
                        Revisa los diseños que el equipo te envía antes de iniciar la producción y dale tu visto bueno.
                    </p>
                </header>

                <div className="inline-flex h-9 bg-slate-100 border border-slate-200 rounded-md p-0.5 self-start">
                    <TabButton active={tab === 'pending'} onClick={() => setTab('pending')}>
                        <BsHourglassSplit size={11} />
                        Pendientes
                        {pending.length > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[10px] font-semibold bg-rose-500 text-white tabular-nums">
                                {pending.length}
                            </span>
                        )}
                    </TabButton>
                    <TabButton active={tab === 'history'} onClick={() => setTab('history')}>
                        <BsCheckCircle size={11} />
                        Historial
                    </TabButton>
                </div>

                {list.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-lg px-6 py-16 flex flex-col items-center text-center">
                        <BsPatchCheck size={20} className="text-slate-400 mb-3" />
                        <p className="text-[13px] font-medium text-slate-700">
                            {tab === 'pending' ? 'No tienes pruebas pendientes.' : 'Sin pruebas en el historial.'}
                        </p>
                        <p className="text-[12px] text-slate-500 mt-1 max-w-sm">
                            {tab === 'pending'
                                ? 'Cuando el equipo te envíe una prueba aparecerá aquí para tu revisión.'
                                : 'Aquí verás todas las pruebas que ya hayas aprobado o rechazado.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {list.map(({ order, proof }) => (
                            <ProofCard
                                key={proof.id}
                                order={order}
                                proof={proof}
                                onZoom={() => setZoomProof(proof)}
                                onApprove={() => setSignTarget({ order, proof })}
                                onReject={() => setRejectTarget({ order, proof })}
                            />
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {zoomProof && <ImageLightbox proof={zoomProof} onClose={() => setZoomProof(null)} />}
                {signTarget && (
                    <SignatureModal
                        doc={{
                            id: signTarget.proof.id,
                            title: `Aprobar prueba de ${signTarget.order.id}`,
                            sender: signTarget.order.assignedTo ?? 'Equipo TrackMySign',
                            type: 'Prueba de diseño',
                        }}
                        signerName={CUSTOMER_PROFILE.name}
                        onClose={() => setSignTarget(null)}
                        onSign={handleSign}
                    />
                )}
                {rejectTarget && (
                    <RejectProofModal
                        order={rejectTarget.order}
                        reason={rejectReason}
                        setReason={setRejectReason}
                        onCancel={() => {
                            setRejectTarget(null);
                            setRejectReason('');
                        }}
                        onConfirm={handleReject}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-3 text-[12px] font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${active ? 'bg-white text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-900'
                }`}
        >
            {children}
        </button>
    );
}

function ProofCard({
    order,
    proof,
    onZoom,
    onApprove,
    onReject,
}: {
    order: Order;
    proof: OrderProof;
    onZoom: () => void;
    onApprove: () => void;
    onReject: () => void;
}) {
    const isPending = proof.status === 'pending';

    return (
        <article className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
            <div className="relative bg-slate-100 group">
                <img src={proof.imageUrl} alt="Prueba" className="w-full aspect-[16/10] object-cover" />
                <button
                    type="button"
                    onClick={onZoom}
                    aria-label="Ampliar imagen"
                    className="absolute inset-0 flex items-center justify-center bg-slate-950/0 group-hover:bg-slate-950/30 transition-colors cursor-zoom-in"
                >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[11.5px] font-medium text-slate-900 inline-flex items-center gap-1.5">
                        <BsZoomIn size={11} />
                        Ampliar
                    </span>
                </button>
                <div className="absolute top-2 left-2">
                    <StatusBadge status={proof.status} />
                </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-[12px] font-mono font-semibold text-slate-900">{order.id}</p>
                        <p className="text-[13px] font-semibold text-slate-900 mt-0.5 truncate">
                            {order.items[0]?.description}
                        </p>
                    </div>
                    <span className="text-[10.5px] font-mono text-slate-400 shrink-0">{proof.sentAt}</span>
                </div>

                {proof.notes && (
                    <p className="text-[12px] text-slate-600 mt-2 italic leading-snug border-l-2 border-slate-200 pl-2.5">
                        "{proof.notes}"
                    </p>
                )}

                {proof.status === 'rejected' && proof.rejectionReason && (
                    <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-md">
                        <p className="text-[10.5px] font-semibold text-rose-700 uppercase tracking-wider">Tu motivo</p>
                        <p className="text-[12px] text-rose-900 mt-0.5 leading-snug">{proof.rejectionReason}</p>
                    </div>
                )}

                {proof.status === 'approved' && (
                    <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-md flex items-start gap-2">
                        <BsCheckCircleFill size={12} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-emerald-900">Aprobada</p>
                            {proof.respondedAt && (
                                <p className="text-[10.5px] text-emerald-700 font-mono mt-0.5">El {proof.respondedAt}</p>
                            )}
                            {proof.signature && (
                                <img
                                    src={proof.signature}
                                    alt="Tu firma"
                                    className="mt-1.5 max-h-12 max-w-[180px] object-contain"
                                />
                            )}
                        </div>
                    </div>
                )}

                {isPending && (
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onReject}
                            className="flex-1 h-9 px-3 bg-white border border-rose-200 text-rose-600 text-[12.5px] font-medium rounded-md hover:bg-rose-50 hover:border-rose-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <BsXCircleFill size={12} />
                            Rechazar
                        </button>
                        <button
                            type="button"
                            onClick={onApprove}
                            className="flex-1 h-9 px-3 bg-[#1e40af] text-white text-[12.5px] font-medium rounded-md hover:bg-[#1e3a8a] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <BsCheckCircleFill size={12} />
                            Aprobar y firmar
                        </button>
                    </div>
                )}
            </div>
        </article>
    );
}

function StatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
    const cfg = {
        pending: { text: 'Por revisar', cls: 'bg-amber-100 text-amber-800 border-amber-300', icon: <BsHourglassSplit size={9} /> },
        approved: { text: 'Aprobada', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: <BsCheckCircle size={9} /> },
        rejected: { text: 'Rechazada', cls: 'bg-rose-100 text-rose-800 border-rose-300', icon: <BsXCircle size={9} /> },
    }[status];
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold border backdrop-blur ${cfg.cls}`}>
            {cfg.icon}
            {cfg.text}
        </span>
    );
}

function ImageLightbox({ proof, onClose }: { proof: OrderProof; onClose: () => void }) {
    return (
        <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
        >
            <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors backdrop-blur"
            >
                <BsX size={22} />
            </button>
            <motion.img
                onClick={(e) => e.stopPropagation()}
                src={proof.imageUrl}
                alt="Prueba ampliada"
                className="max-w-full max-h-[90vh] object-contain rounded-md"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
            />
        </motion.div>
    );
}

function RejectProofModal({
    order,
    reason,
    setReason,
    onCancel,
    onConfirm,
}: {
    order: Order;
    reason: string;
    setReason: (s: string) => void;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <motion.div
            className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/50"
            onClick={onCancel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
        >
            <motion.div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-white border border-slate-200 rounded-lg overflow-hidden"
                role="dialog"
                aria-modal="true"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="text-[15px] font-semibold text-slate-900">Rechazar prueba de {order.id}</h3>
                    <p className="text-[12px] text-slate-500 mt-1">
                        Indica qué cambios necesitas para que el equipo prepare una nueva versión.
                    </p>
                </div>
                <div className="px-6 py-4">
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                        placeholder="Ej. el color azul es más oscuro que el de la marca, ajustar a Pantone..."
                        autoFocus
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all resize-none"
                        maxLength={400}
                    />
                    <p className="text-[10.5px] text-slate-400 mt-1">{reason.length} / 400 · mínimo 5 caracteres</p>
                </div>
                <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={reason.trim().length < 5}
                        className="h-9 px-3 bg-rose-600 text-white text-[13px] font-medium rounded-md hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                        <BsXCircleFill size={12} />
                        Enviar feedback
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
