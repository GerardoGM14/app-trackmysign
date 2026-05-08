import type { ReactNode } from 'react';

interface PlaceholderPageProps {
    icon: ReactNode;
    title: string;
    description: string;
    comingSoon?: string;
}

export default function PlaceholderPage({ icon, title, description, comingSoon }: PlaceholderPageProps) {
    return (
        <div className="space-y-5">
            <header>
                <h1 className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight">
                    {title}
                </h1>
                <p className="text-sm text-slate-500 mt-1.5">{description}</p>
            </header>

            <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-8 py-20 flex flex-col items-center text-center">
                    <span className="w-12 h-12 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
                        {icon}
                    </span>
                    <p className="text-[14px] font-semibold text-slate-700">Sección en construcción</p>
                    <p className="text-[12px] text-slate-500 mt-1.5 max-w-md leading-relaxed">
                        {comingSoon ?? 'Estamos trabajando en esta vista. Estará disponible próximamente.'}
                    </p>
                </div>
            </section>
        </div>
    );
}
