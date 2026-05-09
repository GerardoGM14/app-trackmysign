import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import {
    BsBell,
    BsChevronDown,
    BsChevronRight,
    BsList,
    BsPerson,
    BsBoxArrowRight,
    BsSearch,
    BsCommand,
    BsLifePreserver,
    BsKeyboard,
    BsGrid1X2,
    BsBuilding,
    BsInbox,
    BsFileEarmarkText,
    BsBarChart,
    BsPersonCircle,
    BsX,
} from 'react-icons/bs';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import InfoModal from '../../../components/auth/InfoModal';
import type { InfoKind } from '../../../components/auth/InfoModal';
import ConfirmModal from '../../../components/ConfirmModal';

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
    { label: 'Resumen', path: '/dashboard', icon: <BsGrid1X2 size={13} />, parent: 'Operación' },
    { label: 'Mis pendientes', path: '/inbox', icon: <BsInbox size={13} />, parent: 'Operación' },
    { label: 'Cotizaciones', path: '/quotes', icon: <BsFileEarmarkText size={13} />, parent: 'Operación' },
    { label: 'Órdenes', path: '/orders', icon: <BsFileEarmarkText size={13} />, parent: 'Operación' },
    { label: 'Mis documentos', path: '/my-documents', icon: <BsFileEarmarkText size={13} />, parent: 'Operación' },
    { label: 'Mi actividad', path: '/activity', icon: <BsBarChart size={13} />, parent: 'Personal' },
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
    { id: '1', title: 'Documento por firmar', body: 'NDA — Beta Industries está esperando tu firma.', time: 'hace 5 min', unread: true },
    { id: '2', title: 'Documento por vencer', body: 'Renovación contrato anual vence en 2 días.', time: 'hace 2 h', unread: true },
    { id: '3', title: 'Documento firmado', body: 'Tu contrato laboral fue firmado correctamente.', time: 'hace 1 día', unread: false },
];

export default function Navbar({ sidebarOpen, setSidebarOpen }: NavbarProps) {
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [infoModal, setInfoModal] = useState<InfoKind | null>(null);
    const [signOutConfirm, setSignOutConfirm] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    const currentSection = SECTIONS.find((s) => s.path === location.pathname) ?? SECTIONS[0];
    const unreadCount = notifications.filter((n) => n.unread).length;

    useEffect(() => {
        const onOnline = () => setIsOnline(true);
        const onOffline = () => setIsOnline(false);
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, []);

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
                setSearchOpen(false);
            }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setSearchOpen((s) => !s);
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

    const handleViewAllNotifications = () => {
        setNotifOpen(false);
        showToast('La vista completa de notificaciones estará disponible próximamente.', 'info');
    };

    const handleProfile = () => {
        setDropdownOpen(false);
        navigate('/account');
    };

    const handleShortcuts = () => {
        setDropdownOpen(false);
        showToast('Atajos: ⌘K búsqueda · Esc cerrar paneles · ? ayuda.', 'info');
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

    const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=Employee-${user?.email ?? 'default'}`;
    const userName = user?.email?.split('@')[0] ?? 'Empleado';

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

                <div className="hidden md:flex max-w-md flex-1 mx-2">
                    <button
                        type="button"
                        onClick={() => setSearchOpen(true)}
                        className="w-full h-9 flex items-center gap-2 px-3 bg-slate-50 border border-slate-200 rounded-md text-[13px] text-slate-400 hover:border-slate-300 hover:bg-white transition-colors cursor-text"
                    >
                        <BsSearch size={13} className="shrink-0" />
                        <span className="flex-1 text-left truncate">Buscar documentos, pendientes...</span>
                        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-mono text-slate-500">
                            <BsCommand size={9} />K
                        </kbd>
                    </button>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setSearchOpen(true)}
                        aria-label="Buscar"
                        className="md:hidden w-9 h-9 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                        <BsSearch size={15} />
                    </button>

                    <button
                        type="button"
                        onClick={() => setInfoModal('help')}
                        className="hidden md:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md text-[12px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                        title="Centro de ayuda"
                    >
                        <BsLifePreserver size={13} />
                        <span className="hidden xl:inline">Ayuda</span>
                    </button>

                    <ConnectivityBadge online={isOnline} />

                    <div className="w-px h-5 bg-slate-200 mx-1 hidden sm:block" />

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
                                onViewAll={handleViewAllNotifications}
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
                                user={user?.email ?? ''}
                                avatarUrl={avatarUrl}
                                onProfile={handleProfile}
                                onShortcuts={handleShortcuts}
                                onSignOut={handleSignOutRequest}
                            />
                        )}
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {searchOpen && (
                    <SearchPalette
                        onClose={() => setSearchOpen(false)}
                        onNavigate={(path) => {
                            navigate(path);
                            setSearchOpen(false);
                        }}
                    />
                )}
                {infoModal && <InfoModal kind={infoModal} onClose={() => setInfoModal(null)} />}
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
                Mi espacio
            </button>

            {section.parent && (
                <>
                    <BsChevronRight size={9} className="text-slate-300 shrink-0" />
                    <span className="text-slate-400 hidden md:inline shrink-0">{section.parent}</span>
                </>
            )}

            <BsChevronRight size={9} className="text-slate-300 shrink-0 hidden md:inline" />

            <span className="font-semibold text-slate-900 tracking-tight truncate">{section.label}</span>
        </nav>
    );
}

function ConnectivityBadge({ online }: { online: boolean }) {
    return (
        <div
            className="hidden sm:flex items-center gap-1.5 h-7 px-2 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-600"
            title={online ? 'Conectado' : 'Sin conexión'}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className="hidden lg:inline">{online ? 'Operativo' : 'Sin conexión'}</span>
        </div>
    );
}

interface NotifPanelProps {
    items: NotificationItem[];
    unreadCount: number;
    onMarkAll: () => void;
    onMarkRead: (id: string) => void;
    onViewAll: () => void;
}

function NotificationsPanel({ items, unreadCount, onMarkAll, onMarkRead, onViewAll }: NotifPanelProps) {
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

            <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50">
                <button
                    type="button"
                    onClick={onViewAll}
                    className="w-full text-center text-[12px] font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                    Ver todas las notificaciones
                </button>
            </div>
        </div>
    );
}

interface UserMenuProps {
    user: string;
    avatarUrl: string;
    onProfile: () => void;
    onShortcuts: () => void;
    onSignOut: () => void;
}

function UserMenu({ user, avatarUrl, onProfile, onShortcuts, onSignOut }: UserMenuProps) {
    return (
        <div role="menu" className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg overflow-hidden z-30">
            <div className="px-3 py-3 border-b border-slate-100 flex items-center gap-2.5">
                <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 shrink-0" />
                <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 truncate leading-tight">{user}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#1e40af]/10 text-[#1e40af] border border-[#1e40af]/15">
                            Empleado
                        </span>
                    </div>
                </div>
            </div>

            <div className="py-1">
                <MenuItem icon={<BsPerson size={14} />} label="Mi cuenta" onClick={onProfile} />
                <MenuItem icon={<BsKeyboard size={14} />} label="Atajos de teclado" hint="?" onClick={onShortcuts} />
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

function MenuItem({ icon, label, hint, onClick }: { icon: React.ReactNode; label: string; hint?: string; onClick?: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
        >
            <span className="text-slate-400">{icon}</span>
            <span className="flex-1 text-left">{label}</span>
            {hint && (
                <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-[10px] font-mono text-slate-500">
                    {hint}
                </kbd>
            )}
        </button>
    );
}

function SearchPalette({ onClose, onNavigate }: { onClose: () => void; onNavigate: (path: string) => void }) {
    const [query, setQuery] = useState('');
    const [highlighted, setHighlighted] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return SECTIONS;
        return SECTIONS.filter(
            (s) => s.label.toLowerCase().includes(q) || s.parent?.toLowerCase().includes(q),
        );
    }, [query]);

    useEffect(() => {
        setHighlighted(0);
    }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlighted((h) => Math.min(h + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlighted((h) => Math.max(h - 1, 0));
        } else if (e.key === 'Enter' && results[highlighted]) {
            e.preventDefault();
            onNavigate(results[highlighted].path);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[110] flex items-start justify-center pt-[10vh] px-4 bg-slate-950/50"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-label="Búsqueda global"
            >
                <div className="flex items-center gap-2.5 px-4 h-12 border-b border-slate-200">
                    <BsSearch size={14} className="text-slate-400 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Buscar páginas, documentos..."
                        className="flex-1 h-full bg-transparent text-[14px] text-slate-900 placeholder:text-slate-400 outline-none"
                    />
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="w-7 h-7 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                    >
                        <BsX size={18} />
                    </button>
                </div>

                <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
                    {results.length === 0 ? (
                        <div className="px-4 py-10 text-center">
                            <p className="text-[13px] text-slate-500">Sin resultados para "{query}".</p>
                        </div>
                    ) : (
                        <ul className="p-2">
                            <li className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                Páginas
                            </li>
                            {results.map((r, i) => (
                                <li key={r.path}>
                                    <button
                                        type="button"
                                        onMouseEnter={() => setHighlighted(i)}
                                        onClick={() => onNavigate(r.path)}
                                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-left transition-colors cursor-pointer ${i === highlighted ? 'bg-slate-100' : 'hover:bg-slate-50'
                                            }`}
                                    >
                                        <span className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                                            {r.icon}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-medium text-slate-900 leading-tight">{r.label}</p>
                                            {r.parent && (
                                                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{r.parent}</p>
                                            )}
                                        </div>
                                        {i === highlighted && (
                                            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-mono text-slate-500">
                                                ↵
                                            </kbd>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[10px] text-slate-400">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 font-mono">↑↓</kbd>
                            navegar
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 font-mono">↵</kbd>
                            abrir
                        </span>
                    </div>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 font-mono">esc</kbd>
                        cerrar
                    </span>
                </div>
            </div>
        </div>
    );
}
