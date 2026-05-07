import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Select, { components } from 'react-select';
import countryList from 'react-select-country-list';
import ReactCountryFlag from 'react-country-flag';
import { auth, googleProvider, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithPopup, deleteUser } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { BsEye, BsEyeSlash, BsArrowRight, BsArrowLeft, BsCheck2 } from 'react-icons/bs';
import { FcGoogle } from 'react-icons/fc';
import { AnimatePresence, motion } from 'motion/react';

import logo from '../assets/Login/logo-trackmysign.png';
import LoadingOverlay from '../components/LoadingOverlay';
import AuthCarousel from '../components/auth/AuthCarousel';
import AuthFooter from '../components/auth/AuthFooter';
import InfoModal from '../components/auth/InfoModal';
import type { InfoKind } from '../components/auth/InfoModal';
import { REGISTER_SLIDES } from '../components/auth/slides';
import Field from '../components/auth/Field';

import { useToast } from '../context/ToastContext';
import { describeAuthError } from '../utils/firebaseErrors';
import { validateEmail, validatePassword, validateRequired } from '../utils/validators';

interface CountryOption {
    label: string;
    value: string;
}

const PLANS = [
    {
        id: 'starter' as const,
        name: 'Starter',
        price: 'Gratis',
        priceHint: 'para siempre',
        description: 'Ideal para equipos pequeños que están empezando.',
        features: ['Hasta 3 usuarios', '5 GB de almacenamiento', '7 días de historial', 'Roles predefinidos'],
    },
    {
        id: 'enterprise' as const,
        name: 'Enterprise',
        price: '$99',
        priceHint: '/ mes',
        description: 'Para organizaciones con operaciones complejas.',
        features: [
            'Hasta 30 usuarios',
            '30 GB de almacenamiento',
            'Historial ilimitado',
            'Analítica avanzada',
            'Roles personalizados',
            'Acceso a la API',
        ],
    },
];

type PlanId = (typeof PLANS)[number]['id'];
type Step = 'form' | 'plan';
type RegisterMode = 'email' | 'google';
type FormErrors = Partial<Record<'fullName' | 'email' | 'company' | 'country' | 'password', string>>;

export default function Register() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const countryOptions = useMemo(() => countryList().getData() as CountryOption[], []);

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [company, setCompany] = useState('');
    const [country, setCountry] = useState('');
    const [region, setRegion] = useState('');
    const [city, setCity] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [step, setStep] = useState<Step>('form');
    const [registerMode, setRegisterMode] = useState<RegisterMode>('email');
    const [selectedPlan, setSelectedPlan] = useState<PlanId>('starter');

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [infoModal, setInfoModal] = useState<InfoKind | null>(null);

    const validate = (mode: RegisterMode): boolean => {
        const next: FormErrors = {};
        next.fullName = validateRequired(fullName, 'Tu nombre', 2);
        next.email = validateEmail(email);
        next.company = validateRequired(company, 'El nombre de la empresa');
        if (!country) next.country = 'Selecciona un país.';
        if (mode === 'email') next.password = validatePassword(password);

        const filtered: FormErrors = Object.fromEntries(
            Object.entries(next).filter(([, v]) => v),
        ) as FormErrors;
        setErrors(filtered);
        return Object.keys(filtered).length === 0;
    };

    const clearFieldError = (field: keyof FormErrors) => {
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleSubmitForm = (e: React.SyntheticEvent) => {
        e.preventDefault();
        setRegisterMode('email');
        if (!validate('email')) return;
        setStep('plan');
    };

    const handleGoogleClick = () => {
        setRegisterMode('google');
        setPassword('');
        if (!validate('google')) return;
        setStep('plan');
    };

    const completeRegistration = async () => {
        setLoading(true);
        let createdUserId: string | null = null;

        try {
            let user;
            if (registerMode === 'email') {
                const cred = await createUserWithEmailAndPassword(
                    auth,
                    email.trim().toLowerCase(),
                    password,
                );
                user = cred.user;
            } else {
                const cred = await signInWithPopup(auth, googleProvider);
                user = cred.user;
            }
            createdUserId = user.uid;

            await setDoc(doc(db, 'users', user.uid), {
                fullName: fullName.trim(),
                email: user.email,
                company: company.trim(),
                country,
                region: region.trim(),
                city: city.trim(),
                planId: selectedPlan,
                role: 'admin',
                createdAt: serverTimestamp(),
                status: 'active',
            });

            showToast('Cuenta creada correctamente.', 'success');
            navigate('/dashboard');
        } catch (err) {
            // Avoid leaving an orphan auth user when Firestore write fails
            if (createdUserId && auth.currentUser && auth.currentUser.uid === createdUserId) {
                try {
                    await deleteUser(auth.currentUser);
                } catch (cleanupErr) {
                    console.error('Failed to delete orphan auth user:', cleanupErr);
                }
            }

            showToast(describeAuthError(err, 'No fue posible crear la cuenta.'), 'error');
            console.error(err);
            setStep('form');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex">
            {loading && <LoadingOverlay />}

            <aside className="hidden lg:block lg:w-[44%] xl:w-[48%] relative overflow-hidden bg-slate-950 order-2">
                <AuthCarousel slides={REGISTER_SLIDES} />
            </aside>

            <main className="flex-1 flex flex-col bg-slate-50 order-1">
                <header className="h-16 px-6 lg:px-12 flex items-center justify-between">
                    <img src={logo} alt="TrackMySign" className="h-7 w-auto lg:hidden select-none" draggable={false} />
                    <div className="flex-1" />
                    <div className="flex items-center gap-3 text-sm">
                        <span className="text-slate-500 hidden sm:inline">¿Ya tienes cuenta?</span>
                        <button
                            onClick={() => navigate('/login')}
                            className="text-[#1e40af] font-medium hover:text-[#1e3a8a] transition-colors cursor-pointer"
                        >
                            Iniciar sesión →
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex items-center justify-center px-6 py-8">
                    <div className="w-full max-w-[520px] bg-white border border-slate-200 rounded-xl p-8 sm:p-10">
                        <AnimatePresence mode="wait">
                            {step === 'form' ? (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -8 }}
                                    transition={{ duration: 0.2, ease: 'easeOut' }}
                                >
                                    <FormStep
                                        fullName={fullName}
                                        email={email}
                                        company={company}
                                        country={country}
                                        region={region}
                                        city={city}
                                        password={password}
                                        showPassword={showPassword}
                                        errors={errors}
                                        loading={loading}
                                        countryOptions={countryOptions}
                                        onFullNameChange={(v) => { setFullName(v); clearFieldError('fullName'); }}
                                        onEmailChange={(v) => { setEmail(v); clearFieldError('email'); }}
                                        onCompanyChange={(v) => { setCompany(v); clearFieldError('company'); }}
                                        onCountryChange={(v) => { setCountry(v); clearFieldError('country'); }}
                                        onRegionChange={setRegion}
                                        onCityChange={setCity}
                                        onPasswordChange={(v) => { setPassword(v); clearFieldError('password'); }}
                                        onTogglePassword={() => setShowPassword((s) => !s)}
                                        onSubmit={handleSubmitForm}
                                        onGoogleClick={handleGoogleClick}
                                        onOpenTerms={() => setInfoModal('terms')}
                                        onOpenPrivacy={() => setInfoModal('privacy')}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="plan"
                                    initial={{ opacity: 0, x: 8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 8 }}
                                    transition={{ duration: 0.2, ease: 'easeOut' }}
                                >
                                    <PlanStep
                                        selectedPlan={selectedPlan}
                                        loading={loading}
                                        onBack={() => setStep('form')}
                                        onSelect={setSelectedPlan}
                                        onConfirm={completeRegistration}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
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

/* ---------- Form step ---------- */

interface FormStepProps {
    fullName: string;
    email: string;
    company: string;
    country: string;
    region: string;
    city: string;
    password: string;
    showPassword: boolean;
    errors: FormErrors;
    loading: boolean;
    countryOptions: CountryOption[];
    onFullNameChange: (v: string) => void;
    onEmailChange: (v: string) => void;
    onCompanyChange: (v: string) => void;
    onCountryChange: (v: string) => void;
    onRegionChange: (v: string) => void;
    onCityChange: (v: string) => void;
    onPasswordChange: (v: string) => void;
    onTogglePassword: () => void;
    onSubmit: (e: React.SyntheticEvent) => void;
    onGoogleClick: () => void;
    onOpenTerms: () => void;
    onOpenPrivacy: () => void;
}

function FormStep(props: FormStepProps) {
    const {
        fullName, email, company, country, region, city, password, showPassword,
        errors, loading, countryOptions,
        onFullNameChange, onEmailChange, onCompanyChange, onCountryChange,
        onRegionChange, onCityChange, onPasswordChange, onTogglePassword,
        onSubmit, onGoogleClick, onOpenTerms, onOpenPrivacy,
    } = props;

    return (
        <>
            <div className="mb-7">
                <img
                    src={logo}
                    alt="TrackMySign"
                    className="h-14 w-auto mb-6 select-none"
                    draggable={false}
                />
                <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-slate-900 leading-tight">
                    Crea tu cuenta
                </h2>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    Configura el espacio de trabajo de tu organización.
                </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                        id="fullName"
                        label="Nombre completo"
                        placeholder="Ej. Ana Pérez"
                        value={fullName}
                        onChange={onFullNameChange}
                        error={errors.fullName}
                        autoComplete="name"
                    />
                    <Field
                        id="company"
                        label="Empresa"
                        placeholder="Ej. Triga S.A."
                        value={company}
                        onChange={onCompanyChange}
                        error={errors.company}
                        autoComplete="organization"
                    />
                </div>

                <Field
                    id="email"
                    label="Correo electrónico"
                    type="email"
                    placeholder="nombre@empresa.com"
                    value={email}
                    onChange={onEmailChange}
                    error={errors.email}
                    autoComplete="email"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <CountrySelect
                        options={countryOptions}
                        value={country}
                        onChange={onCountryChange}
                        error={errors.country}
                    />
                    <Field id="region" label="Región" placeholder="Lima" value={region} onChange={onRegionChange} optional />
                    <Field id="city" label="Ciudad" placeholder="Miraflores" value={city} onChange={onCityChange} optional />
                </div>

                <div>
                    <label htmlFor="password" className="block text-[13px] font-medium text-slate-700 mb-1.5">
                        Contraseña
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => onPasswordChange(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            autoComplete="new-password"
                            aria-invalid={!!errors.password}
                            aria-describedby={errors.password ? 'password-error' : undefined}
                            className={`w-full h-10 pl-3 pr-10 bg-white border rounded-md text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 transition-all ${errors.password
                                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                                    : 'border-slate-200 focus:border-[#1e40af] focus:ring-[#1e40af]/15'
                                }`}
                        />
                        <button
                            type="button"
                            onClick={onTogglePassword}
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

                <button
                    type="submit"
                    disabled={loading}
                    className="group w-full h-10 bg-slate-950 text-white text-sm font-medium rounded-md hover:bg-slate-800 active:bg-slate-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                    Continuar
                    <BsArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
            </form>

            <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                    o regístrate con
                </span>
                <div className="flex-1 h-px bg-slate-200" />
            </div>

            <button
                type="button"
                onClick={onGoogleClick}
                disabled={loading}
                className="w-full h-10 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2.5"
            >
                <FcGoogle size={18} />
                Continuar con Google
            </button>

            <p className="text-[11px] text-slate-400 text-center mt-7 leading-relaxed">
                Al continuar aceptas los{' '}
                <button
                    type="button"
                    onClick={onOpenTerms}
                    className="text-slate-600 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
                >
                    Términos
                </button>
                {' '}y la{' '}
                <button
                    type="button"
                    onClick={onOpenPrivacy}
                    className="text-slate-600 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
                >
                    Política de privacidad
                </button>
                .
            </p>
        </>
    );
}

/* ---------- Plan step ---------- */

interface PlanStepProps {
    selectedPlan: PlanId;
    loading: boolean;
    onBack: () => void;
    onSelect: (plan: PlanId) => void;
    onConfirm: () => void;
}

function PlanStep({ selectedPlan, loading, onBack, onSelect, onConfirm }: PlanStepProps) {
    return (
        <>
            <button
                type="button"
                onClick={onBack}
                className="text-[12px] text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1.5 mb-5 cursor-pointer transition-colors"
            >
                <BsArrowLeft size={12} /> Volver
            </button>

            <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-slate-900 leading-tight">
                Elige tu plan
            </h2>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed mb-6">
                Puedes cambiarlo en cualquier momento desde la configuración.
            </p>

            <div className="space-y-3">
                {PLANS.map((plan) => {
                    const selected = selectedPlan === plan.id;
                    return (
                        <button
                            key={plan.id}
                            type="button"
                            onClick={() => onSelect(plan.id)}
                            aria-pressed={selected}
                            className={`w-full text-left border rounded-md p-4 transition-all cursor-pointer ${selected
                                    ? 'border-[#1e40af] bg-[#1e40af]/[0.03] ring-2 ring-[#1e40af]/15'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[15px] font-semibold text-slate-900">{plan.name}</span>
                                        {selected && (
                                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#1e40af] text-white">
                                                <BsCheck2 size={11} />
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[12px] text-slate-500 mt-0.5">{plan.description}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-[18px] font-semibold text-slate-900 tracking-tight">
                                        {plan.price}
                                    </span>
                                    <span className="text-[11px] text-slate-400 ml-0.5">{plan.priceHint}</span>
                                </div>
                            </div>
                            <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-slate-100">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-center gap-1.5 text-[12px] text-slate-600">
                                        <BsCheck2 size={12} className="text-[#1e40af] flex-shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </button>
                    );
                })}
            </div>

            <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="group w-full h-10 bg-slate-950 text-white text-sm font-medium rounded-md hover:bg-slate-800 active:bg-slate-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-6"
            >
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                {!loading && <BsArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />}
            </button>
        </>
    );
}

/* ---------- Country select (encapsulated styling) ---------- */

interface CountrySelectProps {
    options: CountryOption[];
    value: string;
    onChange: (label: string) => void;
    error?: string;
}

function CountrySelect({ options, value, onChange, error }: CountrySelectProps) {
    const selected = options.find((opt) => opt.label === value) ?? null;

    return (
        <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">País</label>
            <Select<CountryOption>
                options={options}
                value={selected}
                onChange={(opt) => onChange(opt?.label ?? '')}
                placeholder="Selecciona..."
                classNamePrefix="rs"
                components={{
                    Option: (props) => (
                        <components.Option {...props}>
                            <div className="flex items-center gap-2">
                                <ReactCountryFlag countryCode={props.data.value} svg style={{ width: '18px', height: '13px' }} />
                                <span className="text-[13px]">{props.data.label}</span>
                            </div>
                        </components.Option>
                    ),
                    SingleValue: (props) => (
                        <components.SingleValue {...props}>
                            <div className="flex items-center gap-2">
                                <ReactCountryFlag countryCode={props.data.value} svg style={{ width: '18px', height: '13px' }} />
                                <span className="text-[13px]">{props.data.label}</span>
                            </div>
                        </components.SingleValue>
                    ),
                }}
                styles={{
                    control: (base, state) => ({
                        ...base,
                        minHeight: '40px',
                        backgroundColor: 'white',
                        borderColor: error
                            ? '#fb7185'
                            : state.isFocused
                                ? '#1e40af'
                                : '#e2e8f0',
                        borderRadius: '6px',
                        boxShadow: state.isFocused
                            ? error
                                ? '0 0 0 2px rgba(244,63,94,0.15)'
                                : '0 0 0 2px rgba(30,64,175,0.15)'
                            : 'none',
                        '&:hover': { borderColor: state.isFocused ? '#1e40af' : '#cbd5e1' },
                    }),
                    valueContainer: (base) => ({ ...base, padding: '0 10px' }),
                    placeholder: (base) => ({ ...base, color: '#94a3b8', fontSize: '14px' }),
                    menu: (base) => ({
                        ...base,
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
                        marginTop: '4px',
                    }),
                    option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected
                            ? '#1e40af'
                            : state.isFocused
                                ? '#f1f5f9'
                                : 'transparent',
                        color: state.isSelected ? 'white' : '#1e293b',
                        cursor: 'pointer',
                        padding: '8px 10px',
                    }),
                }}
            />
            {error && <p className="text-[12px] text-rose-600 mt-1.5">{error}</p>}
        </div>
    );
}
