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
    onRowsPerPageChange
}: PaginationProps) {
    const startEntry = (currentPage - 1) * rowsPerPage + 1;
    const endEntry = Math.min(currentPage * rowsPerPage, totalEntries);

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            // Logic for ellipsis if needed, but for now simple range
            let start = Math.max(1, currentPage - 2);
            let end = Math.min(totalPages, start + maxVisible - 1);

            if (end === totalPages) start = Math.max(1, end - maxVisible + 1);

            for (let i = start; i <= end; i++) pages.push(i);
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white">
            {/* Left: Info */}
            <div className="text-sm text-slate-500 mb-4 sm:mb-0 font-medium">
                Showing <span className="font-semibold text-slate-700">{totalEntries === 0 ? 0 : startEntry}</span> to <span className="font-semibold text-slate-700">{endEntry}</span> of <span className="font-semibold text-slate-700">{totalEntries}</span> entries
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
                {/* Center: Rows per page */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 font-medium">Rows per page:</span>
                    <select
                        value={rowsPerPage}
                        onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-sm font-semibold text-slate-600 outline-none focus:border-blue-500 cursor-pointer hover:bg-white transition-colors"
                    >
                        {[5, 10, 25, 50].map(val => (
                            <option key={val} value={val}>{val}</option>
                        ))}
                    </select>
                </div>

                {/* Right: Controls */}
                <nav className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                        title="Previous Page"
                    >
                        <BsChevronLeft size={14} />
                    </button>

                    <div className="flex items-center gap-1 mx-1">
                        {getPageNumbers().map(page => (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-all cursor-pointer ${currentPage === page
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                        title="Next Page"
                    >
                        <BsChevronRight size={14} />
                    </button>
                </nav>
            </div>
        </div>
    );
}
