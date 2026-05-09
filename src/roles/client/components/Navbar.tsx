import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import {
    BsBell,
    BsChevronDown,
    BsChevronRight,
    BsList,
    BsPerson,
    BsBoxArrowRight,
    BsBuilding,
    BsGrid1X2,
    BsCalculator,
    BsKanban,
    BsPatchCheck,
    BsPersonCircle,
} from 'react-icons/bs';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import ConfirmModal from '../../../components/ConfirmModal';
import { CUSTOMER_PROFILE } from '../../../features/customer/customerData';

interface NavbarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

interface SectionDef {
    label: string;
    path: string;
    icon: React.ReactNode;
    parent?: string;
}

const SECTIONS: SectionDef[] = [
    { label: 'Resumen', path: '/dashboard', icon: <BsGrid1X2 size={13} />, parent: 'Mi taller' },
    { label: 'Mis cotizaciones', path: '/quotes', icon: <BsCalculator size={13} />, parent: 'Mi taller' },
    { label: 'Mis órdenes', path: '/orders', icon: <BsKanban size={13} />, parent: 'Mi taller' },
    { label: 'Pruebas', path: '/proofs', icon: <BsPatchCheck size={13} />, parent: 'Mi taller' },
    { label: 'Mi cuenta', path: '/account', icon: <BsPersonCircle size={13} />, parent: 'Personal' },
];

interface NotificationItem {
    id: string;
    title: string;
    body: string;
    time: string;
    unread: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
    { id: '1', title: 'Nueva prueba para revisar', body: 'OR-2026-040 — Logo vinilo escaparate, mockup final.', time: 'hace 3 h', unread: true },
    { id: '2', title: 'Cotización lista', body: 'COT-2026-118 — Banner exterior + roll-ups.', time: 'hace 2 días', unread: true },
    { id: '3', title: 'Orden entregada', body: 'OR-2026-021 — Banner promo verano.', time: 'hace 12 días', unread: false },
];

export default function Navbar({ sidebarOpen, setSidebarOpen }: NavbarProps) {
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [signOutConfirm, setSignOutConfirm] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    const currentSection = SECTIONS.find((s) => s.path === location.pathname) ?? SECTIONS[0];
    const unreadCount = notifications.filter((n) => n.unread).length;

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setDropdownOpen(false);
                setNotifOpen(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
        showToast('Notificaciones marcadas como leídas.', 'success');
    };
    const markRead = (id: string) =>
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));

    const handleProfile = () => {
        setDropdownOpen(false);
        navigate('/account');
    };

    const handleSignOutRequest = () => {
        setDropdownOpen(false);
        setSignOutConfirm(true);
    };

    const confirmSignOut = async () => {
        setSignOutConfirm(false);
        await logout();
        navigate('/login', { replace: true });
    };

    const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=Customer-${user?.email ?? 'default'}`;
    const userName = CUSTOMER_PROFILE.name;

    return (
        <>
            <header className="h-14 bg-white px-3 sm:px-4 flex items-center justify-between border-b border-slate-200 shrink-0 relative z-20 gap-3">
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label="Alternar menú"
                        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                        <BsList size={18} />
                    </button>
                </div>

                <div className="hidden sm:flex flex-1 items-center min-w-0 gap-2 ml-4 lg:ml-8">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        aria-label="Ir al inicio"
                        className="text-slate-400 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
                    >
                        <BsBuilding size={14} />
                    </button>
                    <Breadcrumb section={currentSection} onNavigate={(p) => navigate(p)} />
                </div>

                <div className="flex items-center gap-1">
                    <div className="relative" ref={notifRef}>
                        <button
                            type="button"
                            onClick={() => {
                                setNotifOpen(!notifOpen);
                                setDropdownOpen(false);
                            }}
                            aria-label="Notificaciones"
                            className="relative w-9 h-9 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                            <BsBell size={15} />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-white" />
                            )}
                        </button>

                        {notifOpen && (
                            <NotificationsPanel
                                items={notifications}
                                unreadCount={unreadCount}
                                onMarkAll={markAllRead}
                                onMarkRead={markRead}
                            />
                        )}
                    </div>

                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => {
                                setDropdownOpen(!dropdownOpen);
                                setNotifOpen(false);
                            }}
                            className="flex items-center gap-2 pl-1 pr-2 h-9 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                            aria-haspopup="menu"
                            aria-expanded={dropdownOpen}
                        >
                            <img
                                src={avatarUrl}
                                alt=""
                                className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200"
                            />
                            <span className="text-[13px] font-medium text-slate-700 hidden sm:inline truncate max-w-[120px]">
                                {userName}
                            </span>
                            <BsChevronDown
                                size={10}
                                className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {dropdownOpen && (
                            <UserMenu
                                user={CUSTOMER_PROFILE.email}
                                avatarUrl={avatarUrl}
                                onProfile={handleProfile}
                                onSignOut={handleSignOutRequest}
                            />
                        )}
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {signOutConfirm && (
                    <ConfirmModal
                        title="Cerrar sesión"
                        description="¿Estás seguro de que deseas cerrar la sesión actual?"
                        confirmLabel="Cerrar sesión"
                        variant="danger"
                        onCancel={() => setSignOutConfirm(false)}
                        onConfirm={confirmSignOut}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

function Breadcrumb({ section, onNavigate }: { section: SectionDef; onNavigate: (path: string) => void }) {
    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] min-w-0">
            <button
                type="button"
                onClick={() => onNavigate('/dashboard')}
                className="font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            >
                Mi taller
            </button>

            {section.parent && section.path !== '/dashboard' && (
                <>
                    <BsChevronRight size={9} className="text-slate-300 shrink-0" />
                    <span className="text-slate-400 hidden md:inline shrink-0">{section.parent}</span>
                </>
            )}

            {section.path !== '/dashboard' && (
                <BsChevronRight size={9} className="text-slate-300 shrink-0" />
            )}

            <span className="font-semibold text-slate-900 tracking-tight truncate">{section.label}</span>
        </nav>
    );
}

interface NotifPanelProps {
    items: NotificationItem[];
    unreadCount: number;
    onMarkAll: () => void;
    onMarkRead: (id: string) => void;
}

function NotificationsPanel({ items, unreadCount, onMarkAll, onMarkRead }: NotifPanelProps) {
    return (
        <div role="menu" className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg overflow-hidden z-30">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div>
                    <p className="text-[13px] font-semibold text-slate-900 leading-none">Notificaciones</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                        {unreadCount === 0 ? 'Sin nuevas' : `${unreadCount} sin leer`}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        type="button"
                        onClick={onMarkAll}
                        className="text-[11px] font-medium text-[#1e40af] hover:text-[#1e3a8a] transition-colors cursor-pointer"
                    >
                        Marcar todas
                    </button>
                )}
            </div>

            {items.length === 0 ? (
                <div className="px-4 py-10 text-center">
                    <p className="text-[12px] text-slate-400">No hay notificaciones.</p>
                </div>
            ) : (
                <ul className="max-h-80 overflow-y-auto custom-scrollbar">
                    {items.map((it) => (
                        <li key={it.id} className="border-b border-slate-100 last:border-b-0">
                            <button
                                type="button"
                                onClick={() => onMarkRead(it.id)}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer flex gap-2.5"
                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${it.unread ? 'bg-[#1e40af]' : 'bg-transparent'
                                        }`}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className={`text-[13px] leading-snug ${it.unread ? 'font-semibold text-slate-900' : 'font-medium text-slate-600'}`}>
                                        {it.title}
                                    </p>
                                    <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">{it.body}</p>
                                    <p className="text-[10px] text-slate-400 mt-1 font-mono">{it.time}</p>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

interface UserMenuProps {
    user: string;
    avatarUrl: string;
    onProfile: () => void;
    onSignOut: () => void;
}

function UserMenu({ user, avatarUrl, onProfile, onSignOut }: UserMenuProps) {
    return (
        <div role="menu" className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg overflow-hidden z-30">
            <div className="px-3 py-3 border-b border-slate-100 flex items-center gap-2.5">
                <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 shrink-0" />
                <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 truncate leading-tight">{user}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#1e40af]/10 text-[#1e40af] border border-[#1e40af]/15">
                            Cliente
                        </span>
                    </div>
                </div>
            </div>

            <div className="py-1">
                <MenuItem icon={<BsPerson size={14} />} label="Mi cuenta" onClick={onProfile} />
            </div>

            <div className="border-t border-slate-100 py-1">
                <button
                    type="button"
                    onClick={onSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                    <BsBoxArrowRight size={14} />
                    Cerrar sesión
                </button>
            </div>
        </div>
    );
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
        >
            <span className="text-slate-400">{icon}</span>
            <span className="flex-1 text-left">{label}</span>
        </button>
    );
}
