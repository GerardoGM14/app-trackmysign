interface FieldProps {
    id: string;
    label: string;
    placeholder?: string;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    autoComplete?: string;
    optional?: boolean;
}

export default function Field({
    id,
    label,
    placeholder,
    type = 'text',
    value,
    onChange,
    error,
    autoComplete,
    optional,
}: FieldProps) {
    const errorId = error ? `${id}-error` : undefined;

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
                aria-invalid={!!error}
                aria-describedby={errorId}
                className={`w-full h-10 px-3 bg-white border rounded-md text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 transition-all ${error
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                        : 'border-slate-200 focus:border-[#1e40af] focus:ring-[#1e40af]/15'
                    }`}
            />
            {error && (
                <p id={errorId} className="text-[12px] text-rose-600 mt-1.5">
                    {error}
                </p>
            )}
        </div>
    );
}
