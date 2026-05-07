interface AuthFooterProps {
    onOpenStatus: () => void;
    onOpenDocs: () => void;
}

export default function AuthFooter({ onOpenStatus, onOpenDocs }: AuthFooterProps) {
    return (
        <footer className="bg-[#1e40af] text-white text-[11px]">
            <div className="px-6 lg:px-12 py-3 flex items-center justify-center gap-4 text-center">
                <span className="text-white/90">
                    © {new Date().getFullYear()} TrackMySign · Desarrollado por Triga S.A.
                </span>
                <span className="text-white/40">·</span>
                <button
                    type="button"
                    onClick={onOpenStatus}
                    className="text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                    Estado del servicio
                </button>
                <button
                    type="button"
                    onClick={onOpenDocs}
                    className="text-white/80 hover:text-white transition-colors hidden sm:inline cursor-pointer"
                >
                    Documentación
                </button>
            </div>
        </footer>
    );
}
