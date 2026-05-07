import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    rowsPerPage: number;
    totalEntries: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rows: number) => void;
}

export default function Pagination({
    currentPage,
    totalPages,
    rowsPerPage,
    totalEntries,
    onPageChange,
    onRowsPerPageChange,
}: PaginationProps) {
    const startEntry = (currentPage - 1) * rowsPerPage + 1;
    const endEntry = Math.min(currentPage * rowsPerPage, totalEntries);

    const getPageNumbers = () => {
        const pages: number[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            let start = Math.max(1, currentPage - 2);
            const end = Math.min(totalPages, start + maxVisible - 1);
            if (end === totalPages) start = Math.max(1, end - maxVisible + 1);
            for (let i = start; i <= end; i++) pages.push(i);
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 bg-white border-t border-slate-200">
            <div className="text-[12px] text-slate-500">
                Mostrando{' '}
                <span className="font-semibold text-slate-700 tabular-nums">
                    {totalEntries === 0 ? 0 : startEntry}
                </span>
                {'–'}
                <span className="font-semibold text-slate-700 tabular-nums">{endEntry}</span> de{' '}
                <span className="font-semibold text-slate-700 tabular-nums">{totalEntries}</span>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-[12px] text-slate-500">Filas por página</span>
                    <select
                        value={rowsPerPage}
                        onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
                        className="h-8 bg-white border border-slate-200 rounded-md px-2 text-[12px] font-medium text-slate-700 outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/15 cursor-pointer"
                    >
                        {[5, 10, 25, 50].map((val) => (
                            <option key={val} value={val}>{val}</option>
                        ))}
                    </select>
                </div>

                <nav className="flex items-center gap-0.5" aria-label="Paginación">
                    <button
                        type="button"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        aria-label="Página anterior"
                        className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                        <BsChevronLeft size={12} />
                    </button>

                    {getPageNumbers().map((page) => (
                        <button
                            key={page}
                            type="button"
                            onClick={() => onPageChange(page)}
                            aria-current={currentPage === page ? 'page' : undefined}
                            className={`min-w-[28px] h-7 px-1 flex items-center justify-center rounded text-[12px] font-medium transition-colors cursor-pointer tabular-nums ${currentPage === page
                                    ? 'bg-[#1e40af] text-white'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        aria-label="Página siguiente"
                        className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                        <BsChevronRight size={12} />
                    </button>
                </nav>
            </div>
        </div>
    );
}
