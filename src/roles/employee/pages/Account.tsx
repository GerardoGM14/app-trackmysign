import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
    BsCheck2,
    BsPersonCircle,
    BsKey,
    BsBell,
    BsClock,
    BsExclamationTriangle,
    BsArrowCounterclockwise,
    BsEye,
    BsEyeSlash,
    BsCheckCircleFill,
    BsXCircleFill,
    BsBoxArrowRight,
    BsShieldLock,
} from 'react-icons/bs';
import ConfirmModal from '../../../components/ConfirmModal';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { validateEmail, validateRequired, validatePassword } from '../../../utils/validators';

type Tab = 'profile' | 'password' | 'preferences' | 'notifications';

const TABS: { id: Tab; label: string; icon: React.ReactNode; description: string }[] = [
    { id: 'profile', label: 'Perfil', icon: <BsPersonCircle size={14} />, description: 'Datos personales' },
    { id: 'password', label: 'Contraseña', icon: <BsKey size={14} />, description: 'Cambiar credenciales' },
    { id: 'preferences', label: 'Preferencias', icon: <BsClock size={14} />, description: 'Idioma y zona horaria' },
    { id: 'notifications', label: 'Notificaciones', icon: <BsBell size={14} />, description: 'Alertas por correo' },
];

interface ProfileData {
    fullName: string;
    email: string;
    phone: string;
    department: string;
    bio: string;
}

interface PreferencesData {
    timezone: string;
    language: string;
    dateFormat: string;
    weekStartsOn: 'monday' | 'sunday';
}

interface NotificationsData {
    docToSign: boolean;
    docExpiring: boolean;
    docSigned: boolean;
    docRejected: boolean;
    weeklyDigest: boolean;
}

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

const DEPARTMENTS = ['Dirección', 'Operaciones', 'Tecnología', 'Comercial', 'Recursos Humanos', 'Finanzas'];

const DEFAULT_PROFILE: ProfileData = {
    fullName: 'Anna Schmidt',
    email: 'employee@shop.com',
    phone: '+51 999 888 777',
    department: 'Operaciones',
    bio: '',
};

const DEFAULT_PREFERENCES: PreferencesData = {
    timezone: 'America/Lima',
    language: 'es',
    dateFormat: 'DD/MM/YYYY',
    weekStartsOn: 'monday',
};

const DEFAULT_NOTIFICATIONS: NotificationsData = {
    docToSign: true,
    docExpiring: true,
    docSigned: true,
    docRejected: true,
    weeklyDigest: false,
};

export default function Account() {
    const { showToast } = useToast();
    const { user, setMockRole } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<Tab>('profile');

    const [savedProfile, setSavedProfile] = useState<ProfileData>({
        ...DEFAULT_PROFILE,
        email: user?.email ?? DEFAULT_PROFILE.email,
    });
    const [profile, setProfile] = useState<ProfileData>(savedProfile);
    const [profileErrors, setProfileErrors] = useState<Partial<Record<keyof ProfileData, string>>>({});

    const [savedPreferences, setSavedPreferences] = useState<PreferencesData>(DEFAULT_PREFERENCES);
    const [preferences, setPreferences] = useState<PreferencesData>(DEFAULT_PREFERENCES);

    const [savedNotifications, setSavedNotifications] = useState<NotificationsData>(DEFAULT_NOTIFICATIONS);
    const [notifications, setNotifications] = useState<NotificationsData>(DEFAULT_NOTIFICATIONS);

    const [saving, setSaving] = useState(false);

    // Password
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState<Partial<Record<'current' | 'new' | 'confirm', string>>>({});
    const [savingPassword, setSavingPassword] = useState(false);

    const [confirm, setConfirm] = useState<
        | { kind: 'discard' }
        | { kind: 'reset' }
        | { kind: 'logout' }
        | null
    >(null);

    /* ---------- Dirty state per tab ---------- */
    const profileDirty = useMemo(
        () => JSON.stringify(savedProfile) !== JSON.stringify(profile),
        [savedProfile, profile],
    );
    const preferencesDirty = useMemo(
        () => JSON.stringify(savedPreferences) !== JSON.stringify(preferences),
        [savedPreferences, preferences],
    );
    const notificationsDirty = useMemo(
        () => JSON.stringify(savedNotifications) !== JSON.stringify(notifications),
        [savedNotifications, notifications],
    );

    const tabDirty: Record<Tab, boolean> = {
        profile: profileDirty,
        password: false,
        preferences: preferencesDirty,
        notifications: notificationsDirty,
    };
    const isDirty = tabDirty[activeTab];

    /* ---------- Updaters ---------- */

    const updateProfile = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => {
        setProfile((prev) => ({ ...prev, [key]: value }));
        if (profileErrors[key]) setProfileErrors((prev) => ({ ...prev, [key]: undefined }));
    };
    const updatePreferences = <K extends keyof PreferencesData>(key: K, value: PreferencesData[K]) => {
        setPreferences((prev) => ({ ...prev, [key]: value }));
    };
    const updateNotifications = <K extends keyof NotificationsData>(key: K, value: NotificationsData[K]) => {
        setNotifications((prev) => ({ ...prev, [key]: value }));
    };

    /* ---------- Save handlers ---------- */

    const validateProfile = (): boolean => {
        const next: Partial<Record<keyof ProfileData, string>> = {};
        next.fullName = validateRequired(profile.fullName, 'El nombre', 2);
        next.email = validateEmail(profile.email);
        const filtered = Object.fromEntries(
            Object.entries(next).filter(([, v]) => v),
        ) as Partial<Record<keyof ProfileData, string>>;
        setProfileErrors(filtered);
        if (Object.keys(filtered).length > 0) {
            showToast('Revisa los campos marcados.', 'warning');
            return false;
        }
        return true;
    };

    const handleSaveProfile = async () => {
        if (!validateProfile()) return;
        setSaving(true);
        await new Promise((r) => setTimeout(r, 500));
        setSavedProfile({
            ...profile,
            fullName: profile.fullName.trim(),
            email: profile.email.trim().toLowerCase(),
            phone: profile.phone.trim(),
            bio: profile.bio.trim(),
        });
        setSaving(false);
        showToast('Perfil actualizado correctamente.', 'success');
    };

    const handleSavePreferences = async () => {
        setSaving(true);
        await new Promise((r) => setTimeout(r, 500));
        setSavedPreferences(preferences);
        setSaving(false);
        showToast('Preferencias actualizadas.', 'success');
    };

    const handleSaveNotifications = async () => {
        setSaving(true);
        await new Promise((r) => setTimeout(r, 500));
        setSavedNotifications(notifications);
        setSaving(false);
        showToast('Notificaciones actualizadas.', 'success');
    };

    const handleSave = () => {
        if (activeTab === 'profile') handleSaveProfile();
        else if (activeTab === 'preferences') handleSavePreferences();
        else if (activeTab === 'notifications') handleSaveNotifications();
    };

    const handleDiscard = () => {
        if (activeTab === 'profile') setProfile(savedProfile);
        else if (activeTab === 'preferences') setPreferences(savedPreferences);
        else if (activeTab === 'notifications') setNotifications(savedNotifications);
        showToast('Cambios descartados.', 'info');
    };

    const handleResetAll = () => {
        setSavedProfile({ ...DEFAULT_PROFILE, email: user?.email ?? DEFAULT_PROFILE.email });
        setProfile({ ...DEFAULT_PROFILE, email: user?.email ?? DEFAULT_PROFILE.email });
        setSavedPreferences(DEFAULT_PREFERENCES);
        setPreferences(DEFAULT_PREFERENCES);
        setSavedNotifications(DEFAULT_NOTIFICATIONS);
        setNotifications(DEFAULT_NOTIFICATIONS);
        showToast('Configuración restaurada a los valores por defecto.', 'warning');
    };

    /* ---------- Password ---------- */

    const validatePasswordChange = (): boolean => {
        const next: Partial<Record<'current' | 'new' | 'confirm', string>> = {};
        if (!currentPassword) next.current = 'Ingresa tu contraseña actual.';
        const newErr = validatePassword(newPassword);
        if (newErr) next.new = newErr;
        else if (newPassword === currentPassword) next.new = 'La nueva contraseña debe ser diferente a la actual.';
        if (!confirmPassword) next.confirm = 'Confirma tu nueva contraseña.';
        else if (newPassword !== confirmPassword) next.confirm = 'Las contraseñas no coinciden.';
        setPasswordErrors(next);
        if (Object.keys(next).length > 0) {
            showToast('Revisa los campos marcados.', 'warning');
            return false;
        }
        return true;
    };

    const handleChangePassword = async () => {
        if (!validatePasswordChange()) return;
        setSavingPassword(true);
        await new Promise((r) => setTimeout(r, 700));
        setSavingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordErrors({});
        showToast('Contraseña actualizada correctamente.', 'success');
    };

    /* ---------- Logout ---------- */

    const performLogout = () => {
        setMockRole(null);
        navigate('/login', { replace: true });
    };

    /* ---------- Render ---------- */

    return (
        <>
            <div className="space-y-5">
                {/* Header */}
                <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight">
                            Mi cuenta
                        </h1>
                        <p className="text-sm text-slate-500 mt-1.5">
                            Gestiona tus datos personales, contraseña y preferencias.
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

                        {isDirty && (
                            <button
                                type="button"
                                onClick={() => setConfirm({ kind: 'discard' })}
                                className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                            >
                                Descartar
                            </button>
                        )}

                        {activeTab !== 'password' && (
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={!isDirty || saving}
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
                        )}
                    </div>
                </header>

                {/* Dirty banner */}
                <AnimatePresence>
                    {isDirty && (
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
                            {TABS.map((tab) => {
                                const isActive = activeTab === tab.id;
                                const tabHasUnsaved = tabDirty[tab.id];
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-md text-left transition-colors cursor-pointer ${isActive
                                                ? 'bg-[#1e40af]/10 text-[#1e40af]'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                    >
                                        <span className={`mt-0.5 ${isActive ? 'text-[#1e40af]' : 'text-slate-400'}`}>
                                            {tab.icon}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-[13px] leading-tight flex items-center gap-1.5 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                                {tab.label}
                                                {tabHasUnsaved && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Cambios sin guardar" />
                                                )}
                                            </p>
                                            <p className={`text-[11px] mt-0.5 leading-snug ${isActive ? 'text-[#1e40af]/80' : 'text-slate-400'}`}>
                                                {tab.description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}

                            <div className="border-t border-slate-100 mt-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setConfirm({ kind: 'logout' })}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-colors cursor-pointer text-rose-600 hover:bg-rose-50"
                                >
                                    <BsBoxArrowRight size={14} className="text-rose-500" />
                                    <span className="text-[13px] font-medium">Cerrar sesión</span>
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-4">
                        {activeTab === 'profile' && (
                            <ProfileSection profile={profile} update={updateProfile} errors={profileErrors} />
                        )}
                        {activeTab === 'password' && (
                            <PasswordSection
                                currentPassword={currentPassword}
                                newPassword={newPassword}
                                confirmPassword={confirmPassword}
                                showCurrent={showCurrent}
                                showNew={showNew}
                                showConfirm={showConfirm}
                                errors={passwordErrors}
                                saving={savingPassword}
                                onChange={(field, v) => {
                                    if (field === 'current') setCurrentPassword(v);
                                    if (field === 'new') setNewPassword(v);
                                    if (field === 'confirm') setConfirmPassword(v);
                                    if (passwordErrors[field]) setPasswordErrors((p) => ({ ...p, [field]: undefined }));
                                }}
                                onToggleVisibility={(field) => {
                                    if (field === 'current') setShowCurrent((v) => !v);
                                    if (field === 'new') setShowNew((v) => !v);
                                    if (field === 'confirm') setShowConfirm((v) => !v);
                                }}
                                onSubmit={handleChangePassword}
                            />
                        )}
                        {activeTab === 'preferences' && (
                            <PreferencesSection preferences={preferences} update={updatePreferences} />
                        )}
                        {activeTab === 'notifications' && (
                            <NotificationsSection notifications={notifications} update={updateNotifications} />
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {confirm?.kind === 'discard' && (
                    <ConfirmModal
                        title="Descartar cambios"
                        description="Perderás los cambios sin guardar de esta sección. Esta acción no se puede deshacer."
                        confirmLabel="Descartar"
                        variant="warning"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            handleDiscard();
                            setConfirm(null);
                        }}
                    />
                )}
                {confirm?.kind === 'reset' && (
                    <ConfirmModal
                        title="Restaurar configuración"
                        description="Todos los parámetros de tu cuenta volverán a los valores por defecto. Esta acción no se puede deshacer."
                        confirmLabel="Restaurar"
                        variant="danger"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            handleResetAll();
                            setConfirm(null);
                        }}
                    />
                )}
                {confirm?.kind === 'logout' && (
                    <ConfirmModal
                        title="Cerrar sesión"
                        description="¿Estás seguro de que deseas cerrar la sesión actual? Tendrás que volver a ingresar tus credenciales para acceder."
                        confirmLabel="Cerrar sesión"
                        variant="danger"
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            performLogout();
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

/* ---------- Profile section ---------- */

function ProfileSection({
    profile,
    update,
    errors,
}: {
    profile: ProfileData;
    update: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
    errors: Partial<Record<keyof ProfileData, string>>;
}) {
    const initials = profile.fullName
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <>
            <SectionCard title="Foto de perfil" description="Aparece en notificaciones y firmas.">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#1e40af] flex items-center justify-center text-[20px] font-semibold text-white shrink-0">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-slate-700 mb-2">
                            Sube una foto de hasta 2 MB en formato JPG o PNG.
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="h-8 px-2.5 bg-white border border-slate-200 text-slate-700 text-[12px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                            >
                                Subir foto
                            </button>
                            <button
                                type="button"
                                className="h-8 px-2.5 text-[12px] text-slate-500 hover:text-slate-900 font-medium transition-colors cursor-pointer"
                            >
                                Quitar
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2">
                            Funcionalidad disponible próximamente.
                        </p>
                    </div>
                </div>
            </SectionCard>

            <SectionCard
                title="Datos personales"
                description="Información básica visible para otros miembros del equipo."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                        id="fullName"
                        label="Nombre completo"
                        value={profile.fullName}
                        onChange={(v) => update('fullName', v)}
                        error={errors.fullName}
                    />
                    <Field
                        id="email"
                        label="Correo electrónico"
                        type="email"
                        value={profile.email}
                        onChange={(v) => update('email', v)}
                        error={errors.email}
                    />
                    <Field
                        id="phone"
                        label="Teléfono"
                        value={profile.phone}
                        onChange={(v) => update('phone', v)}
                        placeholder="+51 999 999 999"
                    />
                    <SelectField
                        id="department"
                        label="Departamento"
                        value={profile.department}
                        onChange={(v) => update('department', v)}
                        options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
                    />
                    <div className="md:col-span-2">
                        <label htmlFor="bio" className="block text-[13px] font-medium text-slate-700 mb-1.5">
                            Bio
                            <span className="text-slate-400 font-normal ml-1">(opcional)</span>
                        </label>
                        <textarea
                            id="bio"
                            value={profile.bio}
                            onChange={(e) => update('bio', e.target.value)}
                            rows={3}
                            placeholder="Una breve descripción de tu rol o responsabilidades..."
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all resize-none"
                            maxLength={200}
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                            {profile.bio.length} / 200 caracteres
                        </p>
                    </div>
                </div>
            </SectionCard>
        </>
    );
}

/* ---------- Password section ---------- */

function PasswordSection({
    currentPassword,
    newPassword,
    confirmPassword,
    showCurrent,
    showNew,
    showConfirm,
    errors,
    saving,
    onChange,
    onToggleVisibility,
    onSubmit,
}: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    showCurrent: boolean;
    showNew: boolean;
    showConfirm: boolean;
    errors: Partial<Record<'current' | 'new' | 'confirm', string>>;
    saving: boolean;
    onChange: (field: 'current' | 'new' | 'confirm', value: string) => void;
    onToggleVisibility: (field: 'current' | 'new' | 'confirm') => void;
    onSubmit: () => void;
}) {
    const strength = computePasswordStrength(newPassword);

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <>
            <SectionCard
                title="Cambiar contraseña"
                description="Usa una contraseña fuerte que no uses en otros sitios."
            >
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <PasswordField
                        id="currentPassword"
                        label="Contraseña actual"
                        value={currentPassword}
                        onChange={(v) => onChange('current', v)}
                        show={showCurrent}
                        onToggle={() => onToggleVisibility('current')}
                        error={errors.current}
                        autoComplete="current-password"
                    />

                    <PasswordField
                        id="newPassword"
                        label="Nueva contraseña"
                        value={newPassword}
                        onChange={(v) => onChange('new', v)}
                        show={showNew}
                        onToggle={() => onToggleVisibility('new')}
                        error={errors.new}
                        autoComplete="new-password"
                    />

                    {newPassword && <PasswordStrengthBar strength={strength} />}

                    <PasswordField
                        id="confirmPassword"
                        label="Confirmar nueva contraseña"
                        value={confirmPassword}
                        onChange={(v) => onChange('confirm', v)}
                        show={showConfirm}
                        onToggle={() => onToggleVisibility('confirm')}
                        error={errors.confirm}
                        autoComplete="new-password"
                    />

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="h-9 px-4 bg-slate-950 text-white text-[13px] font-medium rounded-md hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            {saving ? (
                                <>
                                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Actualizando...
                                </>
                            ) : (
                                <>
                                    <BsKey size={13} />
                                    Actualizar contraseña
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </SectionCard>

            <SectionCard
                title="Sesiones activas"
                description="Dispositivos y navegadores donde tu cuenta está iniciada."
            >
                <div className="space-y-2">
                    <SessionRow
                        device="Chrome en Windows"
                        location="Lima, Perú"
                        lastActive="Sesión actual"
                        current
                    />
                    <SessionRow
                        device="Safari en iPhone"
                        location="Lima, Perú"
                        lastActive="hace 3 días"
                    />
                </div>
                <button
                    type="button"
                    className="mt-3 text-[12px] text-rose-600 hover:text-rose-700 font-medium transition-colors cursor-pointer"
                >
                    Cerrar todas las otras sesiones
                </button>
            </SectionCard>
        </>
    );
}

function PasswordField({
    id,
    label,
    value,
    onChange,
    show,
    onToggle,
    error,
    autoComplete,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    onToggle: () => void;
    error?: string;
    autoComplete?: string;
}) {
    return (
        <div>
            <label htmlFor={id} className="block text-[13px] font-medium text-slate-700 mb-1.5">
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    autoComplete={autoComplete}
                    aria-invalid={!!error}
                    className={`w-full h-10 pl-3 pr-10 bg-white border rounded-md text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 transition-all ${error
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                            : 'border-slate-200 focus:border-[#1e40af] focus:ring-[#1e40af]/15'
                        }`}
                />
                <button
                    type="button"
                    onClick={onToggle}
                    aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                >
                    {show ? <BsEyeSlash size={14} /> : <BsEye size={14} />}
                </button>
            </div>
            {error && <p className="text-[12px] text-rose-600 mt-1.5">{error}</p>}
        </div>
    );
}

interface PasswordStrength {
    score: 0 | 1 | 2 | 3 | 4;
    label: string;
    color: string;
    barColor: string;
}

function computePasswordStrength(password: string): PasswordStrength {
    if (!password) return { score: 0, label: 'Muy débil', color: 'text-slate-400', barColor: 'bg-slate-200' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
    const s = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
    const map = {
        0: { label: 'Muy débil', color: 'text-rose-700', barColor: 'bg-rose-500' },
        1: { label: 'Débil', color: 'text-rose-700', barColor: 'bg-rose-500' },
        2: { label: 'Aceptable', color: 'text-amber-700', barColor: 'bg-amber-500' },
        3: { label: 'Fuerte', color: 'text-emerald-700', barColor: 'bg-emerald-500' },
        4: { label: 'Muy fuerte', color: 'text-emerald-700', barColor: 'bg-emerald-500' },
    } as const;
    return { score: s, ...map[s] };
}

function PasswordStrengthBar({ strength }: { strength: PasswordStrength }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-slate-500">Seguridad</span>
                <span className={`text-[11px] font-semibold ${strength.color}`}>{strength.label}</span>
            </div>
            <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.barColor : 'bg-slate-100'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}

function SessionRow({
    device,
    location,
    lastActive,
    current,
}: {
    device: string;
    location: string;
    lastActive: string;
    current?: boolean;
}) {
    return (
        <div className="flex items-center gap-3 px-3 py-2.5 border border-slate-200 rounded-md">
            <BsShieldLock size={14} className="text-slate-400 shrink-0" />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium text-slate-900">{device}</p>
                    {current && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Actual
                        </span>
                    )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                    {location} · {lastActive}
                </p>
            </div>
            {!current && (
                <button
                    type="button"
                    className="text-[12px] text-rose-600 hover:text-rose-700 font-medium transition-colors cursor-pointer shrink-0"
                >
                    Cerrar
                </button>
            )}
        </div>
    );
}

/* ---------- Preferences section ---------- */

function PreferencesSection({
    preferences,
    update,
}: {
    preferences: PreferencesData;
    update: <K extends keyof PreferencesData>(key: K, value: PreferencesData[K]) => void;
}) {
    return (
        <SectionCard
            title="Preferencias generales"
            description="Idioma, zona horaria y formato que verás en toda la plataforma."
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                    id="timezone"
                    label="Zona horaria"
                    value={preferences.timezone}
                    onChange={(v) => update('timezone', v)}
                    options={TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
                />
                <SelectField
                    id="language"
                    label="Idioma"
                    value={preferences.language}
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
                    value={preferences.dateFormat}
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
                                className={`flex-1 text-[13px] font-medium rounded transition-colors cursor-pointer ${preferences.weekStartsOn === day
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

/* ---------- Notifications section ---------- */

function NotificationsSection({
    notifications,
    update,
}: {
    notifications: NotificationsData;
    update: <K extends keyof NotificationsData>(key: K, value: NotificationsData[K]) => void;
}) {
    const items: { key: keyof NotificationsData; label: string; description: string }[] = [
        {
            key: 'docToSign',
            label: 'Documento por firmar',
            description: 'Recibe un correo cuando te asignen un documento para firmar.',
        },
        {
            key: 'docExpiring',
            label: 'Documento por vencer',
            description: 'Aviso 48 horas antes de que un documento pendiente expire.',
        },
        {
            key: 'docSigned',
            label: 'Documento firmado',
            description: 'Notifica cuando un documento que enviaste sea firmado completamente.',
        },
        {
            key: 'docRejected',
            label: 'Documento rechazado',
            description: 'Aviso cuando un firmante rechaza un documento que enviaste.',
        },
        {
            key: 'weeklyDigest',
            label: 'Resumen semanal',
            description: 'Resumen de tu actividad cada lunes por la mañana.',
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
                        value={notifications[item.key]}
                        onChange={(v) => update(item.key, v)}
                    />
                ))}
            </div>
        </SectionCard>
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
    error,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    error?: string;
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
                aria-invalid={!!error}
                className={`w-full h-10 px-3 bg-white border rounded-md text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 transition-all ${error
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                        : 'border-slate-200 focus:border-[#1e40af] focus:ring-[#1e40af]/15'
                    }`}
            />
            {error && <p className="text-[12px] text-rose-600 mt-1.5">{error}</p>}
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

