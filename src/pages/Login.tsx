import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { BsEye, BsEyeSlash, BsArrowRight } from 'react-icons/bs';
import { AnimatePresence } from 'motion/react';
import { FcGoogle } from 'react-icons/fc';

import logo from '../assets/Login/logo-trackmysign.png';
import LoadingOverlay from '../components/LoadingOverlay';
import AuthCarousel from '../components/auth/AuthCarousel';
import AuthFooter from '../components/auth/AuthFooter';
import InfoModal from '../components/auth/InfoModal';
import type { InfoKind } from '../components/auth/InfoModal';
import { LOGIN_SLIDES } from '../components/auth/slides';
import { tryMockLogin } from '../components/auth/devMockUsers';

import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useCountdown } from '../hooks/useCountdown';
import { describeAuthError, isPopupCancellation } from '../utils/firebaseErrors';
import { validateEmail, validatePassword } from '../utils/validators';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

export default function Login() {
    const navigate = useNavigate();
    const { setMockRole } = useAuth();
    const { showToast } = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(true);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [attempts, setAttempts] = useState(0);
    const [lockedUntil, setLockedUntil] = useState<number | null>(null);
    const [infoModal, setInfoModal] = useState<InfoKind | null>(null);

    const onLockoutEnd = useCallback(() => {
        setLockedUntil(null);
        setAttempts(0);
    }, []);
    const { active: isLocked, secondsLeft } = useCountdown(lockedUntil, onLockoutEnd);

    const validate = (): boolean => {
        const next = {
            email: validateEmail(email),
            password: validatePassword(password),
        };
        const filtered = Object.fromEntries(Object.entries(next).filter(([, v]) => v));
        setErrors(filtered);
        return Object.keys(filtered).length === 0;
    };

    const handleFailedAttempt = () => {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        if (nextAttempts >= MAX_ATTEMPTS) {
            setLockedUntil(Date.now() + LOCKOUT_MS);
            showToast(`Demasiados intentos fallidos. Espera ${LOCKOUT_MS / 1000} segundos.`, 'warning');
        }
    };

    const onEmailChange = (value: string) => {
        setEmail(value);
        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
    };

    const onPasswordChange = (value: string) => {
        setPassword(value);
        if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
    };

    const handleEmailLogin = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (isLocked) {
            showToast(`Demasiados intentos. Intenta en ${secondsLeft} segundos.`, 'warning');
            return;
        }

        if (!validate()) return;

        const trimmedEmail = email.trim().toLowerCase();
        const mock = tryMockLogin(trimmedEmail, password);
        if (mock) {
            setMockRole(mock.role);
            showToast(`Bienvenido, ${mock.role}.`, 'success');
            return;
        }

        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, trimmedEmail, password);
            setAttempts(0);
            showToast('Sesión iniciada correctamente.', 'success');
        } catch (err) {
            handleFailedAttempt();
            showToast(describeAuthError(err, 'No fue posible iniciar sesión.'), 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (isLocked) {
            showToast(`Demasiados intentos. Intenta en ${secondsLeft} segundos.`, 'warning');
            return;
        }

        setLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
            setAttempts(0);
            showToast('Sesión iniciada con Google.', 'success');
        } catch (err) {
            const friendly = describeAuthError(err, 'No fue posible iniciar sesión con Google.');
            showToast(friendly, isPopupCancellation(err) ? 'info' : 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const submitDisabled = loading || isLocked;

    return (
        <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex">
            {loading && <LoadingOverlay />}

            <aside className="hidden lg:block lg:w-[44%] xl:w-[48%] relative overflow-hidden bg-slate-950">
                <AuthCarousel slides={LOGIN_SLIDES} />
            </aside>

            <main className="flex-1 flex flex-col bg-slate-50">
                <header className="h-16 px-6 lg:px-12 flex items-center justify-between">
                    <img src={logo} alt="TrackMySign" className="h-7 w-auto lg:hidden select-none" draggable={false} />
                    <div className="flex-1" />
                    <div className="flex items-center gap-3 text-sm">
                        <span className="text-slate-500 hidden sm:inline">¿No tienes cuenta?</span>
                        <button
                            onClick={() => navigate('/register')}
                            className="text-[#1e40af] font-medium hover:text-[#1e3a8a] transition-colors cursor-pointer"
                        >
                            Crear cuenta →
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex items-center justify-center px-6 py-8">
                    <div className="w-full max-w-[440px] bg-white border border-slate-200 rounded-xl p-8 sm:p-10">
                        <div className="mb-8">
                            <img
                                src={logo}
                                alt="TrackMySign"
                                className="h-14 w-auto mb-6 select-none"
                                draggable={false}
                            />
                            <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-slate-900 leading-tight">
                                ¡Bienvenido!
                            </h2>
                            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                                Ingresa tus credenciales para continuar.
                            </p>
                        </div>

                        <form onSubmit={handleEmailLogin} className="space-y-4" noValidate>
                            <div>
                                <label htmlFor="email" className="block text-[13px] font-medium text-slate-700 mb-1.5">
                                    Correo electrónico
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => onEmailChange(e.target.value)}
                                    placeholder="nombre@empresa.com"
                                    autoComplete="email"
                                    aria-invalid={!!errors.email}
                                    aria-describedby={errors.email ? 'email-error' : undefined}
                                    className={`w-full h-10 px-3 bg-white border rounded-md text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 transition-all ${errors.email
                                            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                                            : 'border-slate-200 focus:border-[#1e40af] focus:ring-[#1e40af]/15'
                                        }`}
                                />
                                {errors.email && (
                                    <p id="email-error" className="text-[12px] text-rose-600 mt-1.5">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="password" className="block text-[13px] font-medium text-slate-700">
                                        Contraseña
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => showToast('Función disponible próximamente.', 'info')}
                                        className="text-[12px] text-slate-500 hover:text-[#1e40af] font-medium transition-colors cursor-pointer"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => onPasswordChange(e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        aria-invalid={!!errors.password}
                                        aria-describedby={errors.password ? 'password-error' : undefined}
                                        className={`w-full h-10 pl-3 pr-10 bg-white border rounded-md text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 transition-all ${errors.password
                                                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                                                : 'border-slate-200 focus:border-[#1e40af] focus:ring-[#1e40af]/15'
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        {showPassword ? <BsEyeSlash size={15} /> : <BsEye size={15} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p id="password-error" className="text-[12px] text-rose-600 mt-1.5">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    style={{ accentColor: '#1e40af' }}
                                    className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                                />
                                <span className="text-[13px] text-slate-600">Mantener sesión iniciada</span>
                            </label>

                            <button
                                type="submit"
                                disabled={submitDisabled}
                                className="group w-full h-10 bg-slate-950 text-white text-sm font-medium rounded-md hover:bg-slate-800 active:bg-slate-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-2"
                            >
                                {isLocked
                                    ? `Bloqueado · ${secondsLeft}s`
                                    : loading
                                        ? 'Verificando...'
                                        : 'Iniciar sesión'}
                                {!isLocked && !loading && (
                                    <BsArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                )}
                            </button>
                        </form>

                        <div className="flex items-center gap-3 my-6">
                            <div className="flex-1 h-px bg-slate-200" />
                            <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                                o continúa con
                            </span>
                            <div className="flex-1 h-px bg-slate-200" />
                        </div>

                        <button
                            onClick={handleGoogleLogin}
                            disabled={submitDisabled}
                            className="w-full h-10 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2.5"
                        >
                            <FcGoogle size={18} />
                            Continuar con Google
                        </button>

                        <p className="text-[11px] text-slate-400 text-center mt-8 leading-relaxed">
                            Al continuar aceptas los{' '}
                            <button
                                type="button"
                                onClick={() => setInfoModal('terms')}
                                className="text-slate-600 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
                            >
                                Términos
                            </button>
                            {' '}y la{' '}
                            <button
                                type="button"
                                onClick={() => setInfoModal('privacy')}
                                className="text-slate-600 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
                            >
                                Política de privacidad
                            </button>
                            .
                        </p>
                    </div>
                </div>

                <AuthFooter
                    onOpenStatus={() => setInfoModal('status')}
                    onOpenDocs={() => setInfoModal('docs')}
                />
            </main>

            <AnimatePresence>
                {infoModal && <InfoModal kind={infoModal} onClose={() => setInfoModal(null)} />}
            </AnimatePresence>
        </div>
    );
}
