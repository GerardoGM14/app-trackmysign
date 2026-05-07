import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
    BsCheck2,
    BsShieldLock,
    BsGlobe,
    BsCreditCard,
    BsEnvelope,
    BsDatabase,
    BsKey,
    BsEye,
    BsEyeSlash,
    BsClipboard,
    BsClipboardCheck,
    BsTrash,
    BsPlus,
    BsArrowCounterclockwise,
    BsExclamationTriangle,
    BsPencil,
    BsX,
    BsStar,
    BsStarFill,
} from 'react-icons/bs';
import ConfirmModal from '../../../components/ConfirmModal';
import { useToast } from '../../../context/ToastContext';
import { usePlans } from '../../../context/PlansContext';
import type { PlanConfig } from '../../../config/plans';

type SettingsTab = 'general' | 'plans' | 'security' | 'email' | 'api' | 'storage';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode; description: string }[] = [
    { id: 'general', label: 'General', icon: <BsGlobe size={14} />, description: 'Identidad y configuración básica' },
    { id: 'plans', label: 'Planes', icon: <BsCreditCard size={14} />, description: 'Niveles de suscripción' },
    { id: 'security', label: 'Seguridad', icon: <BsShieldLock size={14} />, description: 'Contraseñas y accesos' },
    { id: 'email', label: 'Correo', icon: <BsEnvelope size={14} />, description: 'SMTP y notificaciones' },
    { id: 'api', label: 'API', icon: <BsKey size={14} />, description: 'Llaves e integraciones' },
    { id: 'storage', label: 'Almacenamiento', icon: <BsDatabase size={14} />, description: 'Límites y respaldos' },
];

interface SettingsState {
    // General
    platformName: string;
    domain: string;
    timezone: string;
    language: string;
    // Security
    minPasswordLength: number;
    require2FA: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    // Email
    smtpHost: string;
    smtpPort: string;
    senderEmail: string;
    notifyNewTenant: boolean;
    notifyNewUser: boolean;
    notifySuspension: boolean;
    // API
    webhookUrl: string;
    // Storage
    maxStoragePerTenant: number;
    backupFrequency: string;
    retentionDays: number;
}

const DEFAULT_SETTINGS: SettingsState = {
    platformName: 'TrackMySign',
    domain: 'app.trackmysign.com',
    timezone: 'America/Lima',
    language: 'es',
    minPasswordLength: 8,
    require2FA: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    smtpHost: 'smtp.trackmysign.com',
    smtpPort: '587',
    senderEmail: 'noreply@trackmysign.com',
    notifyNewTenant: true,
    notifyNewUser: true,
    notifySuspension: true,
    webhookUrl: 'https://hooks.example.com/trackmysign',
    maxStoragePerTenant: 256,
    backupFrequency: 'daily',
    retentionDays: 90,
};

const TIMEZONES = [
    'America/Lima',
    'America/Bogota',
    'America/Mexico_City',
    'America/Santiago',
    'America/Buenos_Aires',
    'America/New_York',
    'Europe/Madrid',
    'Europe/London',
    'UTC',
];


interface ApiKey {
    id: string;
    name: string;
    key: string;
    created: string;
    lastUsed: string;
}

const INITIAL_API_KEYS: ApiKey[] = [
    {
        id: 'k1',
        name: 'Producción',
        key: 'tmsk_prod_a8f29d4e72b1c5x4k1',
        created: '2024-01-15',
        lastUsed: 'hace 2 h',
    },
    {
        id: 'k2',
        name: 'Staging',
        key: 'tmsk_stag_b7e31c91d6a4m2p9',
        created: '2024-03-20',
        lastUsed: 'hace 3 días',
    },
];

export default function Settings() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');

    const [savedSettings, setSavedSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
    const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
    const [saving, setSaving] = useState(false);

    const [apiKeys, setApiKeys] = useState<ApiKey[]>(INITIAL_API_KEYS);
    const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const [confirm, setConfirm] = useState<
        | { kind: 'discard' }
        | { kind: 'reset' }
        | { kind: 'revoke-key'; key: ApiKey }
        | null
    >(null);

    const dirty = useMemo(
        () => JSON.stringify(savedSettings) !== JSON.stringify(settings),
        [savedSettings, settings],
    );

    const update = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!dirty) return;
        setSaving(true);
        await new Promise((r) => setTimeout(r, 500));
        setSavedSettings(settings);
        setSaving(false);
        showToast('Cambios guardados correctamente.', 'success');
    };

    const handleDiscard = () => {
        if (!dirty) return;
        setConfirm({ kind: 'discard' });
    };

    const performDiscard = () => {
        setSettings(savedSettings);
        showToast('Cambios descartados.', 'info');
    };

    const performReset = () => {
        setSettings(DEFAULT_SETTINGS);
        setSavedSettings(DEFAULT_SETTINGS);
        showToast('Configuración restaurada a los valores por defecto.', 'warning');
    };

    const toggleRevealKey = (id: string) => {
        setRevealedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const copyKey = async (key: ApiKey) => {
        try {
            await navigator.clipboard.writeText(key.key);
            setCopiedKey(key.id);
            showToast(`Clave "${key.name}" copiada al portapapeles.`, 'success');
            setTimeout(() => setCopiedKey(null), 1600);
        } catch {
            showToast('No se pudo copiar al portapapeles.', 'error');
        }
    };

    const generateApiKey = () => {
        const id = `k${apiKeys.length + 1}`;
        const newKey: ApiKey = {
            id,
            name: `Clave ${apiKeys.length + 1}`,
            key: `tmsk_new_${Math.random().toString(36).slice(2, 18)}`,
            created: new Date().toISOString().split('T')[0],
            lastUsed: 'Nunca',
        };
        setApiKeys((prev) => [newKey, ...prev]);
        showToast('Nueva clave de API generada.', 'success');
    };

    const performRevokeKey = (key: ApiKey) => {
        setApiKeys((prev) => prev.filter((k) => k.id !== key.id));
        showToast(`Clave "${key.name}" revocada.`, 'success');
    };

    const sendTestEmail = () => {
        showToast(`Correo de prueba enviado a ${settings.senderEmail}.`, 'info');
    };

    return (
        <>
            <div className="space-y-5">
                {/* Header */}
                <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight">
                            Configuración
                        </h1>
                        <p className="text-sm text-slate-500 mt-1.5">
                            Configura los parámetros principales de la plataforma.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
                        <button
                            type="button"
                            onClick={() => setConfirm({ kind: 'reset' })}
                            className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <BsArrowCounterclockwise size={12} />
                            Restaurar valores
                        </button>

                        {dirty && (
                            <button
                                type="button"
                                onClick={handleDiscard}
                                className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                            >
                                Descartar
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!dirty || saving}
                            className="h-9 px-3 bg-slate-950 text-white text-[13px] font-medium rounded-md hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            {saving ? (
                                <>
                                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <BsCheck2 size={13} />
                                    Guardar cambios
                                </>
                            )}
                        </button>
                    </div>
                </header>

                {/* Dirty bar */}
                <AnimatePresence>
                    {dirty && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex items-center gap-2.5 text-[12.5px] text-amber-800">
                            <BsExclamationTriangle size={14} className="shrink-0" />
                            <span>Tienes cambios sin guardar en esta sección.</span>
                        </div>
                    )}
                </AnimatePresence>

                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Sidebar tabs */}
                    <aside className="lg:w-64 shrink-0">
                        <div className="bg-white border border-slate-200 rounded-lg p-1.5 lg:sticky lg:top-4">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-md text-left transition-colors cursor-pointer ${activeTab === tab.id
                                            ? 'bg-[#1e40af]/10 text-[#1e40af]'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    <span
                                        className={`mt-0.5 ${activeTab === tab.id ? 'text-[#1e40af]' : 'text-slate-400'
                                            }`}
                                    >
                                        {tab.icon}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p
                                            className={`text-[13px] leading-tight ${activeTab === tab.id ? 'font-semibold' : 'font-medium'
                                                }`}
                                        >
                                            {tab.label}
                                        </p>
                                        <p
                                            className={`text-[11px] mt-0.5 leading-snug ${activeTab === tab.id ? 'text-[#1e40af]/80' : 'text-slate-400'
                                                }`}
                                        >
                                            {tab.description}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </aside>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-4">
                        {activeTab === 'general' && (
                            <GeneralSection settings={settings} update={update} />
                        )}
                        {activeTab === 'plans' && <PlansSection />}
                        {activeTab === 'security' && (
                            <SecuritySection settings={settings} update={update} />
                        )}
                        {activeTab === 'email' && (
                            <EmailSection
                                settings={settings}
                                update={update}
                                onSendTest={sendTestEmail}
                            />
                        )}
                        {activeTab === 'api' && (
                            <ApiSection
                                settings={settings}
                                update={update}
                                apiKeys={apiKeys}
                                revealedKeys={revealedKeys}
                                copiedKey={copiedKey}
                                onToggleReveal={toggleRevealKey}
                                onCopy={copyKey}
                                onGenerate={generateApiKey}
                                onRevoke={(key) => setConfirm({ kind: 'revoke-key', key })}
                            />
                        )}
                        {activeTab === 'storage' && (
                            <StorageSection settings={settings} update={update} />
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {confirm?.kind === 'discard' && (
                    <ConfirmModal
                        title="Descartar cambios"
                        description="Perderás los cambios sin guardar. Esta acción no se puede deshacer."
                        confirmLabel="Descartar"
                        variant="warning"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performDiscard();
                            setConfirm(null);
                        }}
                    />
                )}
                {confirm?.kind === 'reset' && (
                    <ConfirmModal
                        title="Restaurar configuración"
                        description="Todos los parámetros volverán a sus valores por defecto. Esta acción no se puede deshacer."
                        confirmLabel="Restaurar"
                        variant="danger"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performReset();
                            setConfirm(null);
                        }}
                    />
                )}
                {confirm?.kind === 'revoke-key' && (
                    <ConfirmModal
                        title="Revocar clave de API"
                        description={`La clave "${confirm.key.name}" dejará de funcionar inmediatamente. Las integraciones que la usan dejarán de tener acceso.`}
                        confirmLabel="Revocar"
                        variant="danger"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performRevokeKey(confirm.key);
                            setConfirm(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

/* ---------- Sections ---------- */

function SectionCard({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
                <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight">{title}</h2>
                <p className="text-[12px] text-slate-500 mt-0.5">{description}</p>
            </div>
            <div className="px-5 py-5">{children}</div>
        </section>
    );
}

function GeneralSection({
    settings,
    update,
}: {
    settings: SettingsState;
    update: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
}) {
    return (
        <SectionCard title="Información general" description="Identidad pública de la plataforma.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                    id="platformName"
                    label="Nombre de la plataforma"
                    value={settings.platformName}
                    onChange={(v) => update('platformName', v)}
                />
                <Field
                    id="domain"
                    label="Dominio personalizado"
                    value={settings.domain}
                    onChange={(v) => update('domain', v)}
                />
                <SelectField
                    id="timezone"
                    label="Zona horaria"
                    value={settings.timezone}
                    onChange={(v) => update('timezone', v)}
                    options={TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
                />
                <SelectField
                    id="language"
                    label="Idioma por defecto"
                    value={settings.language}
                    onChange={(v) => update('language', v)}
                    options={[
                        { value: 'es', label: 'Español' },
                        { value: 'en', label: 'English' },
                        { value: 'pt', label: 'Português' },
                    ]}
                />
            </div>
        </SectionCard>
    );
}

function PlansSection() {
    const { plans, upsertPlan, removePlan } = usePlans();
    const { showToast } = useToast();
    const [editing, setEditing] = useState<PlanConfig | null>(null);
    const [creating, setCreating] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<PlanConfig | null>(null);

    const formatLimit = (v: number, suffix: string) =>
        v === -1 ? 'Ilimitado' : `${v} ${suffix}`;

    const blankPlan = (): PlanConfig => ({
        id: '',
        name: '',
        price: 0,
        description: '',
        maxUsers: 5,
        storageGB: 10,
        historyDays: 30,
        features: [],
        displayedFeatures: [],
        highlighted: false,
    });

    return (
        <>
            <SectionCard
                title="Planes disponibles"
                description="Estos planes son los que se ofrecen al registrarse y se aplican a las empresas. Los cambios se reflejan inmediatamente en toda la plataforma."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative border rounded-md p-4 transition-colors ${plan.highlighted
                                    ? 'border-[#1e40af]/40 bg-[#1e40af]/[0.02]'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            {plan.highlighted && (
                                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#1e40af]/10 text-[#1e40af] border border-[#1e40af]/15">
                                    <BsStarFill size={9} />
                                    Destacado
                                </span>
                            )}

                            <div className="flex items-start justify-between gap-2 pr-20">
                                <div className="min-w-0">
                                    <p className="text-[13px] font-semibold text-slate-900 truncate">{plan.name}</p>
                                    <p className="text-[11px] text-slate-400 font-mono">{plan.id}</p>
                                </div>
                            </div>

                            <div className="flex items-baseline gap-1 mt-2 mb-3">
                                <span className="text-[24px] font-semibold text-slate-900 tracking-[-0.02em] tabular-nums">
                                    {plan.price === 0 ? 'Gratis' : `€${plan.price}`}
                                </span>
                                {plan.price > 0 && <span className="text-[11px] text-slate-400">/ mes</span>}
                            </div>

                            <p className="text-[12px] text-slate-500 leading-snug mb-3">{plan.description}</p>

                            <div className="space-y-1 text-[12px] text-slate-600 pb-3 border-b border-slate-100">
                                <p>
                                    <span className="text-slate-400">Usuarios:</span> {formatLimit(plan.maxUsers, '')}
                                </p>
                                <p>
                                    <span className="text-slate-400">Almacenamiento:</span>{' '}
                                    {formatLimit(plan.storageGB, 'GB')}
                                </p>
                                <p>
                                    <span className="text-slate-400">Historial:</span>{' '}
                                    {plan.historyDays === -1 ? 'Ilimitado' : `${plan.historyDays} días`}
                                </p>
                            </div>

                            {plan.displayedFeatures.length > 0 && (
                                <ul className="space-y-1 mt-3 mb-4">
                                    {plan.displayedFeatures.slice(0, 4).map((f) => (
                                        <li key={f} className="flex items-center gap-1.5 text-[12px] text-slate-600">
                                            <BsCheck2 size={11} className="text-[#1e40af] flex-shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                    {plan.displayedFeatures.length > 4 && (
                                        <li className="text-[11px] text-slate-400 pl-4">
                                            + {plan.displayedFeatures.length - 4} más
                                        </li>
                                    )}
                                </ul>
                            )}

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setEditing(plan)}
                                    className="h-8 px-2.5 bg-white border border-slate-200 text-slate-700 text-[12px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer flex items-center gap-1"
                                >
                                    <BsPencil size={11} />
                                    Editar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfirmDelete(plan)}
                                    aria-label="Eliminar plan"
                                    className="w-8 h-8 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer transition-colors"
                                >
                                    <BsTrash size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="h-9 px-3 bg-slate-950 text-white text-[13px] font-medium rounded-md hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                    <BsPlus size={15} />
                    Añadir plan
                </button>
            </SectionCard>

            <AnimatePresence>
                {(editing || creating) && (
                    <PlanFormModal
                        mode={creating ? 'create' : 'edit'}
                        initial={editing ?? blankPlan()}
                        existingIds={plans.map((p) => p.id)}
                        onClose={() => {
                            setEditing(null);
                            setCreating(false);
                        }}
                        onSave={(plan) => {
                            upsertPlan(plan);
                            showToast(
                                creating
                                    ? `Plan "${plan.name}" creado.`
                                    : `Plan "${plan.name}" actualizado.`,
                                'success',
                            );
                            setEditing(null);
                            setCreating(false);
                        }}
                    />
                )}

                {confirmDelete && (
                    <ConfirmModal
                        title="Eliminar plan"
                        description={`Las empresas que tengan asignado el plan "${confirmDelete.name}" deberán ser migradas manualmente. Esta acción no se puede deshacer.`}
                        confirmLabel="Eliminar"
                        variant="danger"
                        onCancel={() => setConfirmDelete(null)}
                        onConfirm={() => {
                            removePlan(confirmDelete.id);
                            showToast(`Plan "${confirmDelete.name}" eliminado.`, 'success');
                            setConfirmDelete(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

/* ---------- Plan form modal ---------- */

function PlanFormModal({
    mode,
    initial,
    existingIds,
    onClose,
    onSave,
}: {
    mode: 'create' | 'edit';
    initial: PlanConfig;
    existingIds: string[];
    onClose: () => void;
    onSave: (plan: PlanConfig) => void;
}) {
    const { showToast } = useToast();
    const [form, setForm] = useState<PlanConfig>(initial);
    const [featuresText, setFeaturesText] = useState(initial.displayedFeatures.join('\n'));
    const [errors, setErrors] = useState<Partial<Record<'id' | 'name' | 'description', string>>>({});

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const update = <K extends keyof PlanConfig>(key: K, value: PlanConfig[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const validate = (): boolean => {
        const next: Partial<Record<'id' | 'name' | 'description', string>> = {};
        const trimmedId = form.id.trim().toLowerCase();
        const trimmedName = form.name.trim();

        if (!trimmedId) next.id = 'El identificador es obligatorio.';
        else if (!/^[a-z0-9_-]+$/.test(trimmedId))
            next.id = 'Solo letras minúsculas, números, guiones y guion bajo.';
        else if (mode === 'create' && existingIds.includes(trimmedId))
            next.id = 'Ya existe un plan con este identificador.';

        if (!trimmedName) next.name = 'El nombre es obligatorio.';
        if (!form.description.trim()) next.description = 'La descripción es obligatoria.';

        setErrors(next);
        if (Object.keys(next).length > 0) {
            showToast('Revisa los campos marcados.', 'warning');
            return false;
        }
        return true;
    };

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!validate()) return;
        const displayed = featuresText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);

        onSave({
            ...form,
            id: form.id.trim().toLowerCase(),
            name: form.name.trim(),
            description: form.description.trim(),
            displayedFeatures: displayed,
            features: form.features,
        });
    };

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
                className="w-full max-w-lg bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col max-h-[90vh]"
                role="dialog"
                aria-modal="true"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="px-6 py-4 bg-[#1e40af] flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-white tracking-tight">
                        {mode === 'create' ? 'Nuevo plan' : `Editar plan: ${initial.name}`}
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

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar" noValidate>
                    <div className="px-6 py-5 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <PlanField
                                id="planName"
                                label="Nombre"
                                value={form.name}
                                onChange={(v) => update('name', v)}
                                error={errors.name}
                                placeholder="Ej. Professional"
                            />
                            <PlanField
                                id="planId"
                                label="Identificador"
                                value={form.id}
                                onChange={(v) => update('id', v)}
                                error={errors.id}
                                placeholder="professional"
                                disabled={mode === 'edit'}
                                hint={mode === 'edit' ? 'No editable' : 'Sin espacios, en minúsculas.'}
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-[13px] font-medium text-slate-700 mb-1.5">
                                Descripción
                            </label>
                            <textarea
                                id="description"
                                value={form.description}
                                onChange={(e) => update('description', e.target.value)}
                                rows={2}
                                placeholder="Línea corta que describe a quién va dirigido este plan."
                                className={`w-full px-3 py-2 bg-white border rounded-md text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 transition-all resize-none ${errors.description
                                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                                        : 'border-slate-200 focus:border-[#1e40af] focus:ring-[#1e40af]/15'
                                    }`}
                            />
                            {errors.description && (
                                <p className="text-[12px] text-rose-600 mt-1.5">{errors.description}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <PlanNumberField
                                id="planPrice"
                                label="Precio"
                                suffix="€/mes"
                                value={form.price}
                                onChange={(v) => update('price', v)}
                                min={0}
                            />
                            <PlanNumberField
                                id="planUsers"
                                label="Usuarios"
                                value={form.maxUsers}
                                onChange={(v) => update('maxUsers', v)}
                                min={-1}
                                hint="-1 = ilimitado"
                            />
                            <PlanNumberField
                                id="planStorage"
                                label="GB"
                                value={form.storageGB}
                                onChange={(v) => update('storageGB', v)}
                                min={-1}
                                hint="-1 = ilimitado"
                            />
                        </div>

                        <PlanNumberField
                            id="planHistory"
                            label="Días de historial"
                            value={form.historyDays}
                            onChange={(v) => update('historyDays', v)}
                            min={-1}
                            hint="-1 = ilimitado"
                        />

                        <div>
                            <label htmlFor="features" className="block text-[13px] font-medium text-slate-700 mb-1.5">
                                Características (una por línea)
                            </label>
                            <textarea
                                id="features"
                                value={featuresText}
                                onChange={(e) => setFeaturesText(e.target.value)}
                                rows={5}
                                placeholder="Hasta 30 usuarios&#10;30 GB de almacenamiento&#10;Historial ilimitado"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all resize-y"
                            />
                            <p className="text-[11px] text-slate-400 mt-1.5">
                                Estas líneas se muestran en el registro y la página de planes.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => update('highlighted', !form.highlighted)}
                            className="w-full flex items-center justify-between gap-4 px-3 py-2.5 border border-slate-200 rounded-md hover:border-slate-300 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                {form.highlighted ? (
                                    <BsStarFill className="text-[#1e40af]" size={13} />
                                ) : (
                                    <BsStar className="text-slate-400" size={13} />
                                )}
                                <div className="text-left">
                                    <p className="text-[13px] font-medium text-slate-900 leading-tight">
                                        Marcar como destacado
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Aparece resaltado en el registro y la página pública.
                                    </p>
                                </div>
                            </div>
                            <span
                                className={`shrink-0 w-10 h-5 rounded-full transition-colors relative ${form.highlighted ? 'bg-[#1e40af]' : 'bg-slate-300'
                                    }`}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.highlighted ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </span>
                        </button>
                    </div>

                    <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="h-9 px-3 bg-slate-950 text-white text-[13px] font-medium rounded-md hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <BsCheck2 size={13} />
                            {mode === 'create' ? 'Crear plan' : 'Guardar cambios'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

function PlanField({
    id,
    label,
    value,
    onChange,
    error,
    placeholder,
    disabled,
    hint,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    placeholder?: string;
    disabled?: boolean;
    hint?: string;
}) {
    return (
        <div>
            <label htmlFor={id} className="block text-[13px] font-medium text-slate-700 mb-1.5">
                {label}
            </label>
            <input
                id={id}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                aria-invalid={!!error}
                className={`w-full h-10 px-3 bg-white border rounded-md text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 transition-all disabled:opacity-60 disabled:bg-slate-50 ${error
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                        : 'border-slate-200 focus:border-[#1e40af] focus:ring-[#1e40af]/15'
                    }`}
            />
            {error && <p className="text-[12px] text-rose-600 mt-1.5">{error}</p>}
            {!error && hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
        </div>
    );
}

function PlanNumberField({
    id,
    label,
    value,
    onChange,
    suffix,
    min,
    hint,
}: {
    id: string;
    label: string;
    value: number;
    onChange: (v: number) => void;
    suffix?: string;
    min?: number;
    hint?: string;
}) {
    return (
        <div>
            <label htmlFor={id} className="block text-[13px] font-medium text-slate-700 mb-1.5">
                {label}
                {suffix && <span className="text-slate-400 font-normal ml-1">({suffix})</span>}
            </label>
            <input
                id={id}
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                min={min}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-900 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all tabular-nums"
            />
            {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
        </div>
    );
}

function SecuritySection({
    settings,
    update,
}: {
    settings: SettingsState;
    update: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
}) {
    return (
        <>
            <SectionCard
                title="Política de contraseñas"
                description="Define los requisitos mínimos para las contraseñas de los usuarios."
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <NumberField
                        id="minPasswordLength"
                        label="Longitud mínima"
                        value={settings.minPasswordLength}
                        onChange={(v) => update('minPasswordLength', v)}
                        min={6}
                        max={32}
                    />
                    <NumberField
                        id="sessionTimeout"
                        label="Tiempo de sesión"
                        suffix="minutos"
                        value={settings.sessionTimeout}
                        onChange={(v) => update('sessionTimeout', v)}
                        min={5}
                        max={480}
                    />
                    <NumberField
                        id="maxLoginAttempts"
                        label="Intentos máximos"
                        value={settings.maxLoginAttempts}
                        onChange={(v) => update('maxLoginAttempts', v)}
                        min={3}
                        max={10}
                    />
                </div>
            </SectionCard>

            <SectionCard
                title="Autenticación"
                description="Controla métodos adicionales de seguridad."
            >
                <ToggleRow
                    label="Requerir autenticación de dos factores"
                    description="Obliga a todos los administradores a configurar un segundo factor."
                    value={settings.require2FA}
                    onChange={(v) => update('require2FA', v)}
                />
            </SectionCard>
        </>
    );
}

function EmailSection({
    settings,
    update,
    onSendTest,
}: {
    settings: SettingsState;
    update: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
    onSendTest: () => void;
}) {
    return (
        <>
            <SectionCard
                title="Servidor SMTP"
                description="Configura el servidor saliente para los correos del sistema."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                        id="smtpHost"
                        label="Servidor"
                        value={settings.smtpHost}
                        onChange={(v) => update('smtpHost', v)}
                    />
                    <Field
                        id="smtpPort"
                        label="Puerto"
                        value={settings.smtpPort}
                        onChange={(v) => update('smtpPort', v)}
                    />
                    <Field
                        id="senderEmail"
                        label="Correo del remitente"
                        value={settings.senderEmail}
                        onChange={(v) => update('senderEmail', v)}
                    />
                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={onSendTest}
                            className="h-10 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                        >
                            Enviar correo de prueba
                        </button>
                    </div>
                </div>
            </SectionCard>

            <SectionCard
                title="Notificaciones automáticas"
                description="Activa los eventos que envían un correo automáticamente."
            >
                <div className="space-y-2">
                    <ToggleRow
                        label="Nueva empresa registrada"
                        description="Envía un correo de bienvenida cuando se da de alta una empresa."
                        value={settings.notifyNewTenant}
                        onChange={(v) => update('notifyNewTenant', v)}
                    />
                    <ToggleRow
                        label="Nuevo usuario registrado"
                        description="Notifica al administrador cuando un usuario se une."
                        value={settings.notifyNewUser}
                        onChange={(v) => update('notifyNewUser', v)}
                    />
                    <ToggleRow
                        label="Empresa suspendida"
                        description="Alerta al administrador de la empresa cuando es suspendida."
                        value={settings.notifySuspension}
                        onChange={(v) => update('notifySuspension', v)}
                    />
                </div>
            </SectionCard>
        </>
    );
}

function ApiSection({
    settings,
    update,
    apiKeys,
    revealedKeys,
    copiedKey,
    onToggleReveal,
    onCopy,
    onGenerate,
    onRevoke,
}: {
    settings: SettingsState;
    update: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
    apiKeys: ApiKey[];
    revealedKeys: Set<string>;
    copiedKey: string | null;
    onToggleReveal: (id: string) => void;
    onCopy: (key: ApiKey) => void;
    onGenerate: () => void;
    onRevoke: (key: ApiKey) => void;
}) {
    return (
        <>
            <SectionCard
                title="Llaves de API"
                description="Llaves activas con acceso a la API. No las compartas públicamente."
            >
                <div className="space-y-2 mb-3">
                    {apiKeys.length === 0 && (
                        <p className="text-[12px] text-slate-500 text-center py-6">
                            No hay claves activas.
                        </p>
                    )}
                    {apiKeys.map((k) => {
                        const revealed = revealedKeys.has(k.id);
                        const copied = copiedKey === k.id;
                        const masked = k.key.slice(0, 12) + '••••••••';

                        return (
                            <div
                                key={k.id}
                                className="bg-slate-50 border border-slate-200 rounded-md p-3"
                            >
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13px] font-semibold text-slate-900">{k.name}</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Creada el {k.created} · Último uso: {k.lastUsed}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onRevoke(k)}
                                        aria-label="Revocar clave"
                                        className="w-7 h-7 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                                    >
                                        <BsTrash size={12} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded text-[12px] font-mono text-slate-700 truncate">
                                        {revealed ? k.key : masked}
                                    </code>
                                    <button
                                        type="button"
                                        onClick={() => onToggleReveal(k.id)}
                                        aria-label={revealed ? 'Ocultar clave' : 'Mostrar clave'}
                                        className="w-8 h-8 rounded border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                                    >
                                        {revealed ? <BsEyeSlash size={13} /> : <BsEye size={13} />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onCopy(k)}
                                        aria-label="Copiar clave"
                                        className={`w-8 h-8 rounded border flex items-center justify-center cursor-pointer transition-colors shrink-0 ${copied
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                                                : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                            }`}
                                    >
                                        {copied ? <BsClipboardCheck size={13} /> : <BsClipboard size={13} />}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button
                    type="button"
                    onClick={onGenerate}
                    className="h-9 px-3 bg-slate-950 text-white text-[13px] font-medium rounded-md hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                    <BsPlus size={15} />
                    Generar nueva clave
                </button>
            </SectionCard>

            <SectionCard
                title="Webhook"
                description="URL pública que recibirá los eventos de la plataforma."
            >
                <Field
                    id="webhookUrl"
                    label="URL del endpoint"
                    value={settings.webhookUrl}
                    onChange={(v) => update('webhookUrl', v)}
                    placeholder="https://hooks.example.com/trackmysign"
                />
            </SectionCard>
        </>
    );
}

function StorageSection({
    settings,
    update,
}: {
    settings: SettingsState;
    update: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
}) {
    const usedGB = 307.2;
    const totalGB = 1024;
    const usagePct = (usedGB / totalGB) * 100;

    return (
        <>
            <SectionCard
                title="Uso global"
                description="Espacio total consumido por todas las empresas."
            >
                <div className="flex items-baseline justify-between mb-2">
                    <p className="text-[20px] font-semibold text-slate-900 tracking-[-0.02em] tabular-nums">
                        {usedGB} GB
                    </p>
                    <p className="text-[12px] text-slate-500">
                        de <span className="font-mono tabular-nums">{totalGB} GB</span> ·{' '}
                        <span className="font-semibold text-slate-700">{usagePct.toFixed(0)}%</span>
                    </p>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#1e40af] rounded-full transition-[width] duration-500"
                        style={{ width: `${usagePct}%` }}
                    />
                </div>
            </SectionCard>

            <SectionCard
                title="Límites y respaldos"
                description="Cuotas por empresa y configuración de copias de seguridad."
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <NumberField
                        id="maxStoragePerTenant"
                        label="Máximo por empresa"
                        suffix="GB"
                        value={settings.maxStoragePerTenant}
                        onChange={(v) => update('maxStoragePerTenant', v)}
                        min={10}
                        max={1024}
                    />
                    <SelectField
                        id="backupFrequency"
                        label="Frecuencia de respaldo"
                        value={settings.backupFrequency}
                        onChange={(v) => update('backupFrequency', v)}
                        options={[
                            { value: 'hourly', label: 'Cada hora' },
                            { value: 'daily', label: 'Diaria' },
                            { value: 'weekly', label: 'Semanal' },
                        ]}
                    />
                    <NumberField
                        id="retentionDays"
                        label="Retención"
                        suffix="días"
                        value={settings.retentionDays}
                        onChange={(v) => update('retentionDays', v)}
                        min={7}
                        max={365}
                    />
                </div>
            </SectionCard>
        </>
    );
}

/* ---------- Reusable form fields ---------- */

function Field({
    id,
    label,
    value,
    onChange,
    placeholder,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    return (
        <div>
            <label htmlFor={id} className="block text-[13px] font-medium text-slate-700 mb-1.5">
                {label}
            </label>
            <input
                id={id}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all"
            />
        </div>
    );
}

function NumberField({
    id,
    label,
    value,
    onChange,
    suffix,
    min,
    max,
}: {
    id: string;
    label: string;
    value: number;
    onChange: (v: number) => void;
    suffix?: string;
    min?: number;
    max?: number;
}) {
    return (
        <div>
            <label htmlFor={id} className="block text-[13px] font-medium text-slate-700 mb-1.5">
                {label}
                {suffix && <span className="text-slate-400 font-normal ml-1">({suffix})</span>}
            </label>
            <input
                id={id}
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                min={min}
                max={max}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-900 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all tabular-nums"
            />
        </div>
    );
}

function SelectField({
    id,
    label,
    value,
    onChange,
    options,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <div>
            <label htmlFor={id} className="block text-[13px] font-medium text-slate-700 mb-1.5">
                {label}
            </label>
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-900 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all cursor-pointer"
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

function ToggleRow({
    label,
    description,
    value,
    onChange,
}: {
    label: string;
    description: string;
    value: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4 px-3 py-2.5 border border-slate-200 rounded-md hover:border-slate-300 transition-colors">
            <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-slate-900 leading-tight">{label}</p>
                <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">{description}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={value}
                onClick={() => onChange(!value)}
                className={`shrink-0 w-10 h-5 rounded-full transition-colors cursor-pointer relative ${value ? 'bg-[#1e40af]' : 'bg-slate-300'
                    }`}
            >
                <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${value ? 'translate-x-[22px]' : 'translate-x-0.5'
                        }`}
                />
            </button>
        </div>
    );
}

