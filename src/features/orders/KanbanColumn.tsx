import { useDroppable } from '@dnd-kit/core';
import { type OrderStatus, STATUS_CONFIG, type Order } from './types';
import KanbanCard from './KanbanCard';

interface KanbanColumnProps {
    status: OrderStatus;
    orders: Order[];
    onCardClick: (order: Order) => void;
}

export default function KanbanColumn({ status, orders, onCardClick }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: status,
    });

    const config = STATUS_CONFIG[status];

    return (
        <div className="flex flex-col min-w-[280px] w-[280px] shrink-0">
            {/* Column header */}
            <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                    <span className="text-[12px] font-semibold text-slate-700">{config.text}</span>
                    <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                        {orders.length}
                    </span>
                </div>
            </div>

            {/* Drop area */}
            <div
                ref={setNodeRef}
                className={`flex-1 ${config.columnBg} border ${isOver ? 'border-[#1e40af] border-dashed' : 'border-slate-200'} rounded-lg p-2 space-y-2 min-h-[120px] transition-colors`}
            >
                {orders.length === 0 ? (
                    <div className="h-20 flex items-center justify-center text-[11px] text-slate-400 italic">
                        {isOver ? 'Suelta aquí' : 'Sin órdenes'}
                    </div>
                ) : (
                    orders.map((order) => (
                        <KanbanCard
                            key={order.id}
                            order={order}
                            onClick={() => onCardClick(order)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
