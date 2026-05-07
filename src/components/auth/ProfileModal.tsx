import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BsX, BsCheck2 } from 'react-icons/bs';
import { useToast } from '../../context/ToastContext';
import { validateEmail, validateRequired } from '../../utils/validators';

interface ProfileData {
    fullName: string;
    email: string;
    company: string;
    phone: string;
    timezone: string;
    language: 'es' | 'en';
}

interface ProfileModalProps {
    initial: ProfileData;
    onClose: () => void;
    onSave: (data: ProfileData) => Promise<void> | void;
}

const TIMEZONES = [
    'America/Lima',
    'America/Bogota',
    'America/Mexico_City',
    'America/Santiago',
    'America/Buenos_Aires',
    'Europe/Madrid',
    'UTC',
];

export default function ProfileModal({ initial, onClose, onSave }: ProfileModalProps) {
    const { showToast } = useToast();
    const [form, setForm] = useState<ProfileData>(initial);
    const [errors, setErrors] = useState<Partial<Record<keyof ProfileData, string>>>({});
    const [saving, setSaving] = useState(false);

    const dirty =
        form.fullName !== initial.fullName ||
        form.email !== initial.email ||
        form.company !== initial.company ||
        form.phone !== initial.phone ||
        form.timezone !== initial.timezone ||
        form.language !== initial.language;

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !saving && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, saving]);

    const update = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const validate = (): boolean => {
        const next: Partial<Record<keyof ProfileData, string>> = {};
        next.fullName = validateRequired(form.fullName, 'El nombre', 2);
        next.email = validateEmail(form.email);
        next.company = validateRequired(form.company, 'La empresa');
        const filtered = Object.fromEntries(Object.entries(next).filter(([, v]) => v));
        setErrors(filtered);
        return Object.keys(filtered).length === 0;
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            await onSave({
                ...form,
                fullName: form.fullName.trim(),
                email: form.email.trim().toLowerCase(),
                company: form.company.trim(),
                phone: form.phone.trim(),
            });
            showToast('Perfil actualizado correctamente.', 'success');
            onClose();
        } catch {
            showToast('No fue posible guardar los cambios. Intenta nuevamente.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/50"
            onClick={() => !saving && onClose()}
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
                aria-labelledby="profile-title"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="px-6 py-4 bg-[#1e40af] flex items-center justify-between">
                    <h3 id="profile-title" className="text-[15px] font-semibold text-white tracking-tight">
                        Editar perfil
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="w-7 h-7 rounded hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Cerrar"
                    >
                        <BsX size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar" noValidate>
                    <div className="px-6 py-5 space-y-4">
                        <Field
                            id="fullName"
                            label="Nombre completo"
                            value={form.fullName}
                            onChange={(v) => update('fullName', v)}
                            error={errors.fullName}
                            autoComplete="name"
                            disabled={saving}
                        />
                        <Field
                            id="email"
                            label="Correo electrónico"
                            type="email"
                            value={form.email}
                            onChange={(v) => update('email', v)}
                            error={errors.email}
                            autoComplete="email"
                            disabled={saving}
                        />
                        <Field
                            id="company"
                            label="Empresa"
                            value={form.company}
                            onChange={(v) => update('company', v)}
                            error={errors.company}
                            autoComplete="organization"
                            disabled={saving}
                        />
                        <Field
                            id="phone"
                            label="Teléfono"
                            type="tel"
                            placeholder="+51 999 999 999"
                            value={form.phone}
                            onChange={(v) => update('phone', v)}
                            optional
                            autoComplete="tel"
                            disabled={saving}
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="timezone" className="block text-[13px] font-medium text-slate-700 mb-1.5">
                                    Zona horaria
                                </label>
                                <select
                                    id="timezone"
                                    value={form.timezone}
                                    onChange={(e) => update('timezone', e.target.value)}
                                    disabled={saving}
                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-900 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 transition-all disabled:opacity-60 cursor-pointer"
                                >
                                    {TIMEZONES.map((tz) => (
                                        <option key={tz} value={tz}>{tz}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Idioma</label>
                                <div className="inline-flex h-10 w-full bg-slate-50 border border-slate-200 rounded-md p-0.5">
                                    {(['es', 'en'] as const).map((lang) => (
                                        <button
                                            key={lang}
                                            type="button"
                                            onClick={() => update('language', lang)}
                                            disabled={saving}
                                            className={`flex-1 text-[13px] font-medium rounded transition-colors cursor-pointer disabled:cursor-not-allowed ${form.language === lang
                                                    ? 'bg-white text-slate-900 border border-slate-200'
                                                    : 'text-slate-500 hover:text-slate-900'
                                                }`}
                                        >
                                            {lang === 'es' ? 'Español' : 'English'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                        <span className="text-[11px] text-slate-400">
                            {dirty ? 'Cambios sin guardar' : 'Sin cambios'}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                className="h-9 px-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-md hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={!dirty || saving}
                                className="h-9 px-3 bg-slate-950 text-white text-[13px] font-medium rounded-md hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

interface FieldProps {
    id: string;
    label: string;
    type?: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    placeholder?: string;
    autoComplete?: string;
    optional?: boolean;
    disabled?: boolean;
}

function Field({ id, label, type = 'text', value, onChange, error, placeholder, autoComplete, optional, disabled }: FieldProps) {
    return (
        <div>
            <label htmlFor={id} className="block text-[13px] font-medium text-slate-700 mb-1.5">
                {label}
                {optional && <span className="text-slate-400 font-normal ml-1">(opcional)</span>}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                autoComplete={autoComplete}
                disabled={disabled}
                aria-invalid={!!error}
                className={`w-full h-10 px-3 bg-white border rounded-md text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 transition-all disabled:opacity-60 disabled:bg-slate-50 ${error
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                        : 'border-slate-200 focus:border-[#1e40af] focus:ring-[#1e40af]/15'
                    }`}
            />
            {error && <p className="text-[12px] text-rose-600 mt-1.5">{error}</p>}
        </div>
    );
}

export type { ProfileData };
