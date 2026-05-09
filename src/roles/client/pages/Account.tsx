import { useState } from 'react';
import {
    BsPerson,
    BsBuilding,
    BsEnvelope,
    BsTelephone,
    BsGeoAlt,
    BsCalendarEvent,
    BsBell,
    BsBoxArrowRight,
    BsCheck2,
} from 'react-icons/bs';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { CUSTOMER_PROFILE } from '../../../features/customer/customerData';
import { useCustomerData } from '../../../features/customer/CustomerDataContext';
import { formatPrice } from '../../../features/quotes/pricing';

export default function CustomerAccount() {
    const { user, setMockRole } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const { orders, quotes } = useCustomerData();

    const [profile, setProfile] = useState({
        name: CUSTOMER_PROFILE.name,
        email: CUSTOMER_PROFILE.email,
        phone: CUSTOMER_PROFILE.phone,
        company: CUSTOMER_PROFILE.company,
        address: CUSTOMER_PROFILE.address,
    });
    const [editMode, setEditMode] = useState(false);
    const [draft, setDraft] = useState(profile);

    const [prefs, setPrefs] = useState({
        emailUpdates: true,
        proofAlerts: true,
        marketing: false,
    });

    const stats = {
        totalOrders: orders.length,
        delivered: orders.filter((o) => o.status === 'delivered').length,
        active: orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length,
        totalSpent: orders.filter((o) => o.status === 'delivered').reduce((acc, o) => acc + o.total, 0),
        quotes: quotes.length,
    };

    const handleSave = () => {
        setProfile(draft);
        setEditMode(false);
        showToast('Datos de contacto actualizados.', 'success');
    };

    const handleCancel = () => {
        setDraft(profile);
        setEditMode(false);
    };

    const togglePref = (key: keyof typeof prefs) => {
        setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
        showToast('Preferencia actualizada.', 'info');
    };

    const handleSignOut = () => {
        setMockRole(null);
        navigate('/login', { replace: true });
    };

    const initials = profile.name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
    const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=Customer-${user?.email ?? 'default'}`;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight">
                    Mi cuenta
                </h1>
                <p className="text-sm text-slate-500 mt-1.5">
                    Tus datos de contacto, preferencias y un resumen de tu actividad.
                </p>
            </header>

            <section className="bg-white border border-slate-200 rounded-lg p-5 flex items-center gap-4">
                <img
                    src={avatarUrl}
                    alt=""
                    className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[18px] font-semibold text-slate-900 tracking-tight">{profile.name}</p>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#1e40af]/10 text-[#1e40af] border border-[#1e40af]/15">
                            Cliente
                        </span>
                    </div>
                    <p className="text-[13px] text-slate-600 mt-0.5">{profile.company}</p>
                    <p className="text-[11.5px] text-slate-400 mt-1 inline-flex items-center gap-1.5">
                        <BsCalendarEvent size={10} />
                        Cliente desde {CUSTOMER_PROFILE.contactSince}
                    </p>
                </div>
                <span className="hidden sm:flex w-12 h-12 rounded-full bg-[#1e40af] text-white text-[15px] font-semibold items-center justify-center uppercase shrink-0">
                    {initials}
                </span>
            </section>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label="Órdenes totales" value={stats.totalOrders} />
                <Stat label="Activas" value={stats.active} accent="bg-[#1e40af]" />
                <Stat label="Entregadas" value={stats.delivered} accent="bg-emerald-500" />
                <Stat label="Invertido" value={formatPrice(stats.totalSpent)} mono />
            </div>

            <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <header className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-[14px] font-semibold text-slate-900">Datos de contacto</h2>
                        <p className="text-[12px] text-slate-500 mt-0.5">Mantenlos al día para que el equipo pueda contactarte.</p>
                    </div>
                    {!editMode && (
                        <button
                            type="button"
                            onClick={() => setEditMode(true)}
                            className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[12.5px] font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                        >
                            Editar
                        </button>
                    )}
                </header>
                <div className="px-5 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                        icon={<BsPerson size={13} />}
                        label="Nombre completo"
                        value={editMode ? draft.name : profile.name}
                        editable={editMode}
                        onChange={(v) => setDraft({ ...draft, name: v })}
                    />
                    <Field
                        icon={<BsBuilding size={13} />}
                        label="Empresa"
                        value={editMode ? draft.company : profile.company}
                        editable={editMode}
                        onChange={(v) => setDraft({ ...draft, company: v })}
                    />
                    <Field
                        icon={<BsEnvelope size={13} />}
                        label="Correo electrónico"
                        value={editMode ? draft.email : profile.email}
                        editable={editMode}
                        type="email"
                        mono
                        onChange={(v) => setDraft({ ...draft, email: v })}
                    />
                    <Field
                        icon={<BsTelephone size={13} />}
                        label="Teléfono"
                        value={editMode ? draft.phone : profile.phone}
                        editable={editMode}
                        type="tel"
                        onChange={(v) => setDraft({ ...draft, phone: v })}
                    />
                    <div className="md:col-span-2">
                        <Field
                            icon={<BsGeoAlt size={13} />}
                            label="Dirección"
                            value={editMode ? draft.address : profile.address}
                            editable={editMode}
                            onChange={(v) => setDraft({ ...draft, address: v })}
                        />
                    </div>
                </div>
                {editMode && (
                    <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="h-9 px-3 bg-[#1e40af] text-white text-[13px] font-medium rounded-md hover:bg-[#1e3a8a] transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <BsCheck2 size={13} />
                            Guardar cambios
                        </button>
                    </div>
                )}
            </section>

            <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <header className="px-5 py-3.5 border-b border-slate-200">
                    <h2 className="text-[14px] font-semibold text-slate-900 inline-flex items-center gap-1.5">
                        <BsBell size={13} className="text-slate-400" />
                        Preferencias de notificación
                    </h2>
                    <p className="text-[12px] text-slate-500 mt-0.5">Decide cuándo te avisaremos por correo.</p>
                </header>
                <div className="divide-y divide-slate-100">
                    <PrefRow
                        title="Actualizaciones de órdenes"
                        description="Cambios de estado, retrasos y entregas confirmadas."
                        active={prefs.emailUpdates}
                        onToggle={() => togglePref('emailUpdates')}
                    />
                    <PrefRow
                        title="Pruebas para revisar"
                        description="Aviso inmediato cuando recibas una nueva prueba."
                        active={prefs.proofAlerts}
                        onToggle={() => togglePref('proofAlerts')}
                    />
                    <PrefRow
                        title="Promociones y novedades"
                        description="Ofertas y nuevos materiales del taller."
                        active={prefs.marketing}
                        onToggle={() => togglePref('marketing')}
                    />
                </div>
            </section>

            <section className="bg-white border border-rose-200 rounded-lg p-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                    <h2 className="text-[14px] font-semibold text-slate-900">Cerrar sesión</h2>
                    <p className="text-[12px] text-slate-500 mt-0.5">
                        Saldrás del portal y te llevaremos a la pantalla de inicio.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleSignOut}
                    className="h-9 px-3 bg-white border border-rose-200 text-rose-600 text-[13px] font-medium rounded-md hover:bg-rose-50 hover:border-rose-300 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                    <BsBoxArrowRight size={13} />
                    Cerrar sesión
                </button>
            </section>
        </div>
    );
}

function Stat({ label, value, accent, mono }: { label: string; value: number | string; accent?: string; mono?: boolean }) {
    return (
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${accent ?? 'bg-slate-400'}`} />
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{label}</span>
            </div>
            <p className={`text-[22px] font-semibold text-slate-900 tracking-[-0.02em] leading-none mt-2 ${mono ? 'font-mono' : ''} tabular-nums`}>
                {value}
            </p>
        </div>
    );
}

function Field({
    icon,
    label,
    value,
    editable,
    type = 'text',
    mono,
    onChange,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    editable: boolean;
    type?: string;
    mono?: boolean;
    onChange: (v: string) => void;
}) {
    return (
        <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 inline-flex items-center gap-1.5">
                <span className="text-slate-400">{icon}</span>
                {label}
            </label>
            {editable ? (
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-[13px] text-slate-900 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all ${mono ? 'font-mono' : ''}`}
                />
            ) : (
                <p className={`text-[13.5px] text-slate-900 ${mono ? 'font-mono' : 'font-medium'}`}>
                    {value}
                </p>
            )}
        </div>
    );
}

function PrefRow({ title, description, active, onToggle }: { title: string; description: string; active: boolean; onToggle: () => void }) {
    return (
        <div className="px-5 py-3.5 flex items-center justify-between gap-4">
            <div className="min-w-0">
                <p className="text-[13px] font-semibold text-slate-900">{title}</p>
                <p className="text-[11.5px] text-slate-500 mt-0.5 leading-snug">{description}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={active}
                onClick={onToggle}
                className={`relative w-10 h-5.5 rounded-full transition-colors cursor-pointer shrink-0 ${active ? 'bg-[#1e40af]' : 'bg-slate-200'
                    }`}
                style={{ height: '22px' }}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full transition-transform ${active ? 'translate-x-[18px]' : ''
                        }`}
                />
            </button>
        </div>
    );
}
