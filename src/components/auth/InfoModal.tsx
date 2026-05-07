import { useEffect } from 'react';
import { motion } from 'motion/react';
import { BsX } from 'react-icons/bs';

export type InfoKind = 'status' | 'docs' | 'terms' | 'privacy';

const TITLES: Record<InfoKind, string> = {
    status: 'Estado del servicio',
    docs: 'Acerca de TrackMySign',
    terms: 'Términos del servicio',
    privacy: 'Política de privacidad',
};

const SERVICES = [
    { name: 'Acceso a la plataforma', status: 'operational' as const },
    { name: 'Gestión documental', status: 'operational' as const },
    { name: 'Almacenamiento de archivos', status: 'operational' as const },
    { name: 'Notificaciones', status: 'operational' as const },
    { name: 'Reportes y analítica', status: 'operational' as const },
];

const STATUS_LABEL: Record<'operational' | 'degraded' | 'down', { text: string; cls: string }> = {
    operational: { text: 'Operativo', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    degraded: { text: 'Degradado', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    down: { text: 'Inactivo', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};

interface InfoModalProps {
    kind: InfoKind;
    onClose: () => void;
}

export default function InfoModal({ kind, onClose }: InfoModalProps) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <motion.div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
        >
            <motion.div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col max-h-[85vh]"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="info-modal-title"
            >
                <div className="px-6 py-4 bg-[#1e40af] flex items-center justify-between">
                    <h3 id="info-modal-title" className="text-[15px] font-semibold text-white tracking-tight">
                        {TITLES[kind]}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-7 h-7 rounded hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                        aria-label="Cerrar"
                    >
                        <BsX size={18} />
                    </button>
                </div>

                <div className="px-6 py-5 overflow-y-auto custom-scrollbar">
                    {kind === 'status' && <StatusBody />}
                    {kind === 'docs' && <DocsBody />}
                    {kind === 'terms' && <TermsBody />}
                    {kind === 'privacy' && <PrivacyBody />}
                </div>
            </motion.div>
        </motion.div>
    );
}

function StatusBody() {
    const lastCheck = new Date().toLocaleString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div>
            <p className="text-[13px] text-slate-600 leading-relaxed mb-5">
                Todos los servicios funcionan con normalidad.
            </p>

            <ul className="bg-slate-50 border border-slate-200 rounded-md overflow-hidden divide-y divide-slate-200">
                {SERVICES.map((svc) => {
                    const label = STATUS_LABEL[svc.status];
                    return (
                        <li key={svc.name} className="flex items-center justify-between px-3 py-1.5">
                            <span className="text-[13px] text-slate-700">{svc.name}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${label.cls}`}>
                                {label.text}
                            </span>
                        </li>
                    );
                })}
            </ul>

            <p className="text-[11px] text-slate-400 mt-4">Última verificación: {lastCheck}</p>
        </div>
    );
}

function DocsBody() {
    return (
        <div className="space-y-4 text-[13px] text-slate-600 leading-relaxed">
            <p>
                <span className="font-semibold text-slate-900">TrackMySign</span> es una plataforma
                empresarial diseñada para la gestión de firmas digitales, el seguimiento de documentos
                y la administración de operaciones internas de tu organización.
            </p>
            <p>
                Cada empresa cuenta con su propio espacio de trabajo independiente, donde puede
                organizar a su equipo según roles y responsabilidades, mantener un registro
                completo de cada operación y consultar el estado de sus documentos en tiempo real.
            </p>
            <p>
                La plataforma está pensada para acompañar el crecimiento de tu organización,
                desde equipos pequeños hasta operaciones empresariales con múltiples áreas
                y usuarios trabajando en paralelo.
            </p>
            <p className="text-slate-500 pt-2 border-t border-slate-100">
                Para soporte o consultas, contacta al administrador de tu organización.
            </p>
        </div>
    );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h4 className="text-[12px] font-semibold text-slate-900 uppercase tracking-wider mb-2">
                {title}
            </h4>
            <div className="text-[13px] text-slate-600 leading-relaxed">{children}</div>
        </section>
    );
}

function TermsBody() {
    return (
        <div className="space-y-5">
            <p className="text-[13px] text-slate-600 leading-relaxed">
                Al utilizar TrackMySign aceptas las siguientes condiciones de uso. Te
                recomendamos revisarlas con atención antes de continuar.
            </p>
            <LegalSection title="1. Uso del servicio">
                TrackMySign se ofrece como una herramienta empresarial para la gestión de
                firmas digitales y el seguimiento documental. El uso del servicio debe
                ajustarse a fines legítimos y a la legislación vigente.
            </LegalSection>
            <LegalSection title="2. Cuentas y responsabilidad">
                Eres responsable de mantener la confidencialidad de tus credenciales y de
                todas las actividades realizadas desde tu cuenta. Notifica de inmediato al
                administrador de tu organización ante cualquier acceso no autorizado.
            </LegalSection>
            <LegalSection title="3. Disponibilidad">
                Procuramos mantener el servicio disponible de manera continua, pero pueden
                presentarse interrupciones por mantenimiento programado o causas ajenas a
                nuestro control. El estado actual puede consultarse desde el panel de inicio.
            </LegalSection>
            <LegalSection title="4. Modificaciones">
                Estos términos pueden actualizarse periódicamente. Las modificaciones
                relevantes serán comunicadas con anticipación a través de la plataforma o
                al administrador de tu organización.
            </LegalSection>
            <LastUpdated />
        </div>
    );
}

function PrivacyBody() {
    return (
        <div className="space-y-5">
            <p className="text-[13px] text-slate-600 leading-relaxed">
                Tu privacidad es importante para nosotros. Esta política describe cómo
                recopilamos, usamos y protegemos la información dentro de TrackMySign.
            </p>
            <LegalSection title="Información que recopilamos">
                Recopilamos los datos necesarios para operar el servicio: nombre, correo
                electrónico, empresa y la actividad asociada a las operaciones que realices
                dentro de tu espacio de trabajo.
            </LegalSection>
            <LegalSection title="Uso de la información">
                La información se utiliza exclusivamente para brindarte el servicio,
                mantener la seguridad de tu cuenta y mejorar la experiencia de uso.
                No vendemos ni compartimos tus datos con terceros con fines comerciales.
            </LegalSection>
            <LegalSection title="Aislamiento por organización">
                Cada empresa cuenta con un espacio de trabajo independiente. La información
                de tu organización no se comparte ni se mezcla con la de otras empresas que
                utilizan la plataforma.
            </LegalSection>
            <LegalSection title="Tus derechos">
                Puedes solicitar acceso, corrección o eliminación de tus datos personales
                en cualquier momento a través del administrador de tu organización.
            </LegalSection>
            <LastUpdated />
        </div>
    );
}

function LastUpdated() {
    const date = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
    return (
        <p className="text-[11px] text-slate-400 pt-3 border-t border-slate-100">
            Última actualización: {date}.
        </p>
    );
}
