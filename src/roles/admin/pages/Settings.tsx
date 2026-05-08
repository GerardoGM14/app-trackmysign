import { useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import {
    BsCheck2,
    BsBuilding,
    BsBell,
    BsPalette,
    BsClock,
    BsExclamationTriangle,
    BsArrowCounterclockwise,
    BsArrowUpRightCircle,
    BsLock,
    BsCheckCircleFill,
    BsXCircleFill,
} from 'react-icons/bs';
import ConfirmModal from '../../../components/ConfirmModal';
import { useToast } from '../../../context/ToastContext';
import { usePlan } from '../../../hooks/usePlan';

type SettingsTab = 'company' | 'preferences' | 'notifications' | 'branding' | 'danger';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode; description: string }[] = [
    { id: 'company', label: 'Empresa', icon: <BsBuilding size={14} />, description: 'Datos de tu organización' },
    { id: 'preferences', label: 'Preferencias', icon: <BsClock size={14} />, description: 'Zona horaria e idioma' },
    { id: 'notifications', label: 'Notificaciones', icon: <BsBell size={14} />, description: 'Alertas por correo' },
    { id: 'branding', label: 'Marca', icon: <BsPalette size={14} />, description: 'Color y logo' },
    { id: 'danger', label: 'Zona peligrosa', icon: <BsExclamationTriangle size={14} />, description: 'Acciones irreversibles' },
];

interface CompanySettings {
    name: string;
    legalName: string;
    taxId: string;
    industry: string;
    country: string;
    city: string;
    address: string;
    phone: string;
    contactEmail: string;
    website: string;
}

interface PreferencesSettings {
    timezone: string;
    language: string;
    dateFormat: string;
    weekStartsOn: 'monday' | 'sunday';
}

interface NotificationsSettings {
    docSigned: boolean;
    docSent: boolean;
    docExpiring: boolean;
    docRejected: boolean;
    employeeJoined: boolean;
    weeklyDigest: boolean;
}

interface BrandingSettings {
    primaryColor: string;
    accentColor: string;
    showPlatformBranding: boolean;
}

interface SettingsState {
    company: CompanySettings;
    preferences: PreferencesSettings;
    notifications: NotificationsSettings;
    branding: BrandingSettings;
}

const DEFAULT_SETTINGS: SettingsState = {
    company: {
        name: 'Mi Empresa S.A.',
        legalName: 'Mi Empresa Sociedad Anónima',
        taxId: '20512345678',
        industry: 'Tecnología',
        country: 'Perú',
        city: 'Lima',
        address: 'Av. Javier Prado Este 4200',
        phone: '+51 1 400 0000',
        contactEmail: 'contacto@miempresa.com',
        website: 'https://miempresa.com',
    },
    preferences: {
        timezone: 'America/Lima',
        language: 'es',
        dateFormat: 'DD/MM/YYYY',
        weekStartsOn: 'monday',
    },
    notifications: {
        docSigned: true,
        docSent: false,
        docExpiring: true,
        docRejected: true,
        employeeJoined: true,
        weeklyDigest: false,
    },
    branding: {
        primaryColor: '#1e40af',
        accentColor: '#3b82f6',
        showPlatformBranding: true,
    },
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

const INDUSTRIES = [
    'Tecnología',
    'Consultoría',
    'Servicios financieros',
    'Salud',
    'Educación',
    'Retail',
    'Manufactura',
    'Logística',
    'Otro',
];

export default function Settings() {
    const { showToast } = useToast();
    const { plan, planName, isFeatureEnabled } = usePlan();

    const [activeTab, setActiveTab] = useState<SettingsTab>('company');
    const [savedSettings, setSavedSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
    const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
    const [saving, setSaving] = useState(false);

    const [confirm, setConfirm] = useState<
        | { kind: 'discard' }
        | { kind: 'reset' }
        | { kind: 'transfer' }
        | { kind: 'delete-company' }
        | null
    >(null);

    const dirty = useMemo(
        () => JSON.stringify(savedSettings) !== JSON.stringify(settings),
        [savedSettings, settings],
    );

    const hasBranding = isFeatureEnabled('branding');

    const updateCompany = <K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) => {
        setSettings((prev) => ({ ...prev, company: { ...prev.company, [key]: value } }));
    };
    const updatePreferences = <K extends keyof PreferencesSettings>(key: K, value: PreferencesSettings[K]) => {
        setSettings((prev) => ({ ...prev, preferences: { ...prev.preferences, [key]: value } }));
    };
    const updateNotifications = <K extends keyof NotificationsSettings>(key: K, value: NotificationsSettings[K]) => {
        setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, [key]: value } }));
    };
    const updateBranding = <K extends keyof BrandingSettings>(key: K, value: BrandingSettings[K]) => {
        setSettings((prev) => ({ ...prev, branding: { ...prev.branding, [key]: value } }));
    };

    const handleSave = async () => {
        if (!dirty) return;
        setSaving(true);
        await new Promise((r) => setTimeout(r, 500));
        setSavedSettings(settings);
        setSaving(false);
        showToast('Cambios guardados correctamente.', 'success');
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

    const performTransfer = () => {
        showToast('Funcionalidad de transferencia disponible próximamente.', 'info');
    };

    const performDeleteCompany = () => {
        showToast('Funcionalidad de eliminación disponible próximamente. Contacta a soporte.', 'info');
    };

    return (
        <>
            <div className="space-y-5">
                {/* Header */}
                <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight">
                            Configuración de empresa
                        </h1>
                        <p className="text-sm text-slate-500 mt-1.5">
                            Datos de tu organización, preferencias y plan contratado.
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
                                onClick={() => setConfirm({ kind: 'discard' })}
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

                {/* Dirty banner */}
                <AnimatePresence>
                    {dirty && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex items-center gap-2.5 text-[12.5px] text-amber-800">
                            <BsExclamationTriangle size={14} className="shrink-0" />
                            <span>Tienes cambios sin guardar.</span>
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
                                            ? tab.id === 'danger'
                                                ? 'bg-rose-50 text-rose-700'
                                                : 'bg-[#1e40af]/10 text-[#1e40af]'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    <span
                                        className={`mt-0.5 ${activeTab === tab.id
                                                ? tab.id === 'danger' ? 'text-rose-600' : 'text-[#1e40af]'
                                                : 'text-slate-400'
                                            }`}
                                    >
                                        {tab.icon}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-[13px] leading-tight ${activeTab === tab.id ? 'font-semibold' : 'font-medium'}`}>
                                            {tab.label}
                                        </p>
                                        <p
                                            className={`text-[11px] mt-0.5 leading-snug ${activeTab === tab.id
                                                    ? tab.id === 'danger' ? 'text-rose-600/80' : 'text-[#1e40af]/80'
                                                    : 'text-slate-400'
                                                }`}
                                        >
                                            {tab.description}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Plan card on sidebar */}
                        <div className="bg-white border border-slate-200 rounded-lg p-4 mt-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                    Plan actual
                                </span>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#1e40af]/10 text-[#1e40af] border border-[#1e40af]/15">
                                    {planName}
                                </span>
                            </div>
                            <p className="text-[12px] text-slate-600 leading-snug">
                                {plan.maxUsers === -1 ? 'Usuarios ilimitados' : `Hasta ${plan.maxUsers} usuarios`} ·{' '}
                                {plan.storageGB === -1 ? '∞ GB' : `${plan.storageGB} GB`} de almacenamiento
                            </p>
                            <button
                                type="button"
                                onClick={() => showToast('La gestión de plan se hará desde tu administrador de plataforma.', 'info')}
                                className="mt-3 w-full h-8 px-2 bg-white border border-[#1e40af]/30 text-[#1e40af] text-[12px] font-medium rounded-md hover:bg-[#1e40af]/5 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <BsArrowUpRightCircle size={12} />
                                Mejorar plan
                            </button>
                        </div>
                    </aside>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-4">
                        {activeTab === 'company' && (
                            <CompanySection settings={settings.company} update={updateCompany} />
                        )}
                        {activeTab === 'preferences' && (
                            <PreferencesSection settings={settings.preferences} update={updatePreferences} />
                        )}
                        {activeTab === 'notifications' && (
                            <NotificationsSection settings={settings.notifications} update={updateNotifications} />
                        )}
                        {activeTab === 'branding' && (
                            <BrandingSection
                                settings={settings.branding}
                                update={updateBranding}
                                hasBranding={hasBranding}
                                planName={planName}
                            />
                        )}
                        {activeTab === 'danger' && (
                            <DangerSection
                                onTransfer={() => setConfirm({ kind: 'transfer' })}
                                onDelete={() => setConfirm({ kind: 'delete-company' })}
                            />
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
                {confirm?.kind === 'transfer' && (
                    <ConfirmModal
                        title="Transferir administración"
                        description="Otro empleado de tu equipo asumirá el rol de administrador y tú pasarás a empleado. Necesitarás autorización del nuevo administrador para revertir el cambio."
                        confirmLabel="Continuar"
                        variant="warning"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performTransfer();
                            setConfirm(null);
                        }}
                    />
                )}
                {confirm?.kind === 'delete-company' && (
                    <ConfirmModal
                        title="Eliminar empresa"
                        description="Esta acción eliminará permanentemente todos los datos de tu organización: empleados, documentos firmados, plantillas e historial. No se puede deshacer."
                        confirmLabel="Confirmar eliminación"
                        variant="danger"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performDeleteCompany();
                            setConfirm(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

/* ---------- Section card wrapper ---------- */

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

/* ---------- Company ---------- */

function CompanySection({
    settings,
    update,
}: {
    settings: CompanySettings;
    update: <K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) => void;
}) {
    return (
        <>
            <SectionCard
                title="Identidad de la empresa"
                description="Estos datos aparecen en los documentos generados por la plataforma."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                        id="name"
                        label="Nombre comercial"
                        value={settings.name}
                        onChange={(v) => update('name', v)}
                    />
                    <Field
                        id="legalName"
                        label="Razón social"
                        value={settings.legalName}
                        onChange={(v) => update('legalName', v)}
                    />
                    <Field
                        id="taxId"
                        label="RUC / Tax ID"
                        value={settings.taxId}
                        onChange={(v) => update('taxId', v)}
                    />
                    <SelectField
                        id="industry"
                        label="Industria"
                        value={settings.industry}
                        onChange={(v) => update('industry', v)}
                        options={INDUSTRIES.map((i) => ({ value: i, label: i }))}
                    />
                </div>
            </SectionCard>

            <SectionCard
                title="Ubicación y contacto"
                description="Información de contacto pública de tu organización."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                        id="country"
                        label="País"
                        value={settings.country}
                        onChange={(v) => update('country', v)}
                    />
                    <Field
                        id="city"
                        label="Ciudad"
                        value={settings.city}
                        onChange={(v) => update('city', v)}
                    />
                    <div className="md:col-span-2">
                        <Field
                            id="address"
                            label="Dirección"
                            value={settings.address}
                            onChange={(v) => update('address', v)}
                        />
                    </div>
                    <Field
                        id="phone"
                        label="Teléfono"
                        value={settings.phone}
                        onChange={(v) => update('phone', v)}
                    />
                    <Field
                        id="contactEmail"
                        label="Correo de contacto"
                        type="email"
                        value={settings.contactEmail}
                        onChange={(v) => update('contactEmail', v)}
                    />
                    <div className="md:col-span-2">
                        <Field
                            id="website"
                            label="Sitio web"
                            value={settings.website}
                            onChange={(v) => update('website', v)}
                            placeholder="https://"
                        />
                    </div>
                </div>
            </SectionCard>
        </>
    );
}

/* ---------- Preferences ---------- */

function PreferencesSection({
    settings,
    update,
}: {
    settings: PreferencesSettings;
    update: <K extends keyof PreferencesSettings>(key: K, value: PreferencesSettings[K]) => void;
}) {
    return (
        <SectionCard
            title="Preferencias generales"
            description="Estos valores se aplican a todos los usuarios de tu empresa por defecto."
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                    id="timezone"
                    label="Zona horaria"
                    value={settings.timezone}
                    onChange={(v) => update('timezone', v)}
                    options={TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
                />
                <SelectField
                    id="language"
                    label="Idioma"
                    value={settings.language}
                    onChange={(v) => update('language', v)}
                    options={[
                        { value: 'es', label: 'Español' },
                        { value: 'en', label: 'English' },
                        { value: 'pt', label: 'Português' },
                    ]}
                />
                <SelectField
                    id="dateFormat"
                    label="Formato de fecha"
                    value={settings.dateFormat}
                    onChange={(v) => update('dateFormat', v)}
                    options={[
                        { value: 'DD/MM/YYYY', label: 'DD/MM/AAAA (08/05/2026)' },
                        { value: 'MM/DD/YYYY', label: 'MM/DD/AAAA (05/08/2026)' },
                        { value: 'YYYY-MM-DD', label: 'AAAA-MM-DD (2026-05-08)' },
                    ]}
                />
                <div>
                    <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Inicio de semana</label>
                    <div className="inline-flex h-10 w-full bg-slate-50 border border-slate-200 rounded-md p-0.5">
                        {(['monday', 'sunday'] as const).map((day) => (
                            <button
                                key={day}
                                type="button"
                                onClick={() => update('weekStartsOn', day)}
                                className={`flex-1 text-[13px] font-medium rounded transition-colors cursor-pointer ${settings.weekStartsOn === day
                                        ? 'bg-white text-slate-900 border border-slate-200'
                                        : 'text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                {day === 'monday' ? 'Lunes' : 'Domingo'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </SectionCard>
    );
}

/* ---------- Notifications ---------- */

function NotificationsSection({
    settings,
    update,
}: {
    settings: NotificationsSettings;
    update: <K extends keyof NotificationsSettings>(key: K, value: NotificationsSettings[K]) => void;
}) {
    const items: { key: keyof NotificationsSettings; label: string; description: string }[] = [
        {
            key: 'docSigned',
            label: 'Documento firmado',
            description: 'Recibe un correo cuando un documento sea firmado completamente.',
        },
        {
            key: 'docSent',
            label: 'Documento enviado',
            description: 'Notifica cuando un empleado envía un documento a firma.',
        },
        {
            key: 'docExpiring',
            label: 'Documento por vencer',
            description: 'Aviso 48 horas antes de que un documento expire sin firmarse.',
        },
        {
            key: 'docRejected',
            label: 'Documento rechazado',
            description: 'Notifica cuando un firmante rechaza un documento.',
        },
        {
            key: 'employeeJoined',
            label: 'Empleado se unió',
            description: 'Aviso cuando un empleado acepta su invitación.',
        },
        {
            key: 'weeklyDigest',
            label: 'Resumen semanal',
            description: 'Resumen de actividad cada lunes por la mañana.',
        },
    ];

    return (
        <SectionCard
            title="Notificaciones por correo"
            description="Activa los eventos para los que quieres recibir alertas."
        >
            <div className="space-y-2">
                {items.map((item) => (
                    <ToggleRow
                        key={item.key}
                        label={item.label}
                        description={item.description}
                        value={settings[item.key]}
                        onChange={(v) => update(item.key, v)}
                    />
                ))}
            </div>
        </SectionCard>
    );
}

/* ---------- Branding ---------- */

function BrandingSection({
    settings,
    update,
    hasBranding,
    planName,
}: {
    settings: BrandingSettings;
    update: <K extends keyof BrandingSettings>(key: K, value: BrandingSettings[K]) => void;
    hasBranding: boolean;
    planName: string;
}) {
    if (!hasBranding) {
        return (
            <SectionCard
                title="Marca personalizada"
                description="Personaliza colores y logo de la plataforma para tu organización."
            >
                <div className="border border-amber-200 bg-amber-50 rounded-md px-4 py-4 flex items-start gap-3">
                    <span className="shrink-0 text-amber-600 mt-0.5">
                        <BsLock size={14} />
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-amber-900">
                            Función disponible solo en planes superiores.
                        </p>
                        <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                            Tu plan actual <span className="font-semibold">{planName}</span> no incluye personalización de
                            marca. Mejora a Enterprise para aplicar tu logo y colores corporativos a la plataforma y
                            a los correos enviados a firmantes.
                        </p>
                    </div>
                </div>
            </SectionCard>
        );
    }

    return (
        <>
            <SectionCard
                title="Color de marca"
                description="Estos colores se aplicarán a la plataforma para usuarios de tu empresa."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ColorField
                        id="primaryColor"
                        label="Color principal"
                        value={settings.primaryColor}
                        onChange={(v) => update('primaryColor', v)}
                    />
                    <ColorField
                        id="accentColor"
                        label="Color de acento"
                        value={settings.accentColor}
                        onChange={(v) => update('accentColor', v)}
                    />
                </div>
            </SectionCard>

            <SectionCard title="Logo" description="Aparecerá en correos y documentos generados.">
                <div className="border-2 border-dashed border-slate-200 rounded-md px-4 py-8 text-center bg-slate-50/40">
                    <BsPalette size={20} className="text-slate-400 mx-auto mb-2" />
                    <p className="text-[13px] font-medium text-slate-700">Subir logo</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        PNG o SVG · máx. 2 MB · Disponible próximamente
                    </p>
                </div>
            </SectionCard>

            <SectionCard
                title="Visibilidad de la plataforma"
                description="Muestra u oculta la mención a TrackMySign en los correos enviados a firmantes."
            >
                <ToggleRow
                    label="Mostrar &quot;Powered by TrackMySign&quot;"
                    description="Aparece al pie de los correos enviados a firmantes externos."
                    value={settings.showPlatformBranding}
                    onChange={(v) => update('showPlatformBranding', v)}
                />
            </SectionCard>
        </>
    );
}

/* ---------- Danger zone ---------- */

function DangerSection({
    onTransfer,
    onDelete,
}: {
    onTransfer: () => void;
    onDelete: () => void;
}) {
    return (
        <>
            <SectionCard
                title="Transferir administración"
                description="Cede el rol de administrador a otro empleado de tu equipo."
            >
                <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                    <div className="flex-1">
                        <p className="text-[13px] text-slate-600 leading-relaxed">
                            Otro empleado de tu equipo asumirá el rol de administrador con acceso completo a la
                            empresa. Tú quedarás como empleado regular.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onTransfer}
                        className="h-9 px-3 bg-white border border-amber-300 text-amber-700 text-[13px] font-medium rounded-md hover:bg-amber-50 transition-colors cursor-pointer shrink-0"
                    >
                        Transferir
                    </button>
                </div>
            </SectionCard>

            <section className="bg-white border-2 border-rose-200 rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-rose-100 bg-rose-50">
                    <h2 className="text-[14px] font-semibold text-rose-900 tracking-tight flex items-center gap-2">
                        <BsExclamationTriangle size={13} />
                        Eliminar empresa
                    </h2>
                    <p className="text-[12px] text-rose-700 mt-0.5">
                        Esta acción es permanente y no se puede revertir.
                    </p>
                </div>
                <div className="px-5 py-5">
                    <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                        <div className="flex-1">
                            <p className="text-[13px] text-slate-600 leading-relaxed">
                                Se eliminarán permanentemente todos los datos de tu organización: empleados,
                                documentos firmados, plantillas e historial. Tampoco podrás recuperar tu información
                                contactando a soporte.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onDelete}
                            className="h-9 px-3 bg-rose-600 text-white text-[13px] font-medium rounded-md hover:bg-rose-700 transition-colors cursor-pointer shrink-0"
                        >
                            Eliminar empresa
                        </button>
                    </div>
                </div>
            </section>
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
    type = 'text',
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <div>
            <label htmlFor={id} className="block text-[13px] font-medium text-slate-700 mb-1.5">
                {label}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all"
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

function ColorField({
    id,
    label,
    value,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div>
            <label htmlFor={id} className="block text-[13px] font-medium text-slate-700 mb-1.5">
                {label}
            </label>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-10 h-10 rounded-md border border-slate-200 cursor-pointer"
                />
                <input
                    id={id}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 h-10 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-900 font-mono outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all uppercase"
                />
            </div>
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
            <div className="flex items-start gap-2 min-w-0 flex-1">
                <span className={`mt-0.5 shrink-0 ${value ? 'text-emerald-500' : 'text-slate-300'}`}>
                    {value ? <BsCheckCircleFill size={12} /> : <BsXCircleFill size={12} />}
                </span>
                <div className="min-w-0">
                    <p className="text-[13px] font-medium text-slate-900 leading-tight">{label}</p>
                    <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">{description}</p>
                </div>
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
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${value ? 'translate-x-5' : 'translate-x-0'
                        }`}
                />
            </button>
        </div>
    );
}

