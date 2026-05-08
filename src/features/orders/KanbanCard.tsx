import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
    BsClock,
    BsExclamationTriangle,
    BsPersonCheck,
    BsThreeDots,
} from 'react-icons/bs';
import { type Order, PRIORITY_CONFIG } from './types';
import { getDueUrgency } from './mockData';
import { formatPrice } from '../quotes/pricing';

interface KanbanCardProps {
    order: Order;
    onClick: () => void;
    isOverlay?: boolean;
}

export default function KanbanCard({ order, onClick, isOverlay = false }: KanbanCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: order.id,
        data: { order },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging && !isOverlay ? 0.4 : 1,
    };

    const priority = PRIORITY_CONFIG[order.priority];
    const urgency = getDueUrgency(order.dueDate);

    const dueColor =
        urgency.tone === 'overdue' ? 'text-rose-700 font-semibold'
            : urgency.tone === 'urgent' ? 'text-rose-700'
                : urgency.tone === 'soon' ? 'text-amber-700'
                    : 'text-slate-500';

    const dueLabel =
        urgency.daysLeft === null ? 'Sin fecha'
            : urgency.tone === 'overdue' ? `Vencida (${Math.abs(urgency.daysLeft)}d)`
                : urgency.daysLeft === 0 ? 'Hoy'
                    : urgency.daysLeft === 1 ? 'Mañana'
                        : `${urgency.daysLeft}d`;

    const initials = order.customer.name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <article
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={(e) => {
                // Prevent click while dragging
                if (isDragging) return;
                e.stopPropagation();
                onClick();
            }}
            className={`bg-white border border-slate-200 rounded-md p-3 cursor-grab active:cursor-grabbing hover:border-slate-300 transition-colors ${isOverlay ? 'shadow-lg rotate-2' : ''
                } ${order.priority === 'urgent' ? 'border-l-4 border-l-rose-500' : order.priority === 'high' ? 'border-l-4 border-l-amber-500' : ''}`}
        >
            {/* Header: ID + priority + kebab */}
            <div className="flex items-center justify-between mb-2 gap-2">
                <span className="text-[10px] font-mono text-slate-400">{order.id}</span>
                <div className="flex items-center gap-1">
                    {order.priority !== 'normal' && order.priority !== 'low' && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${priority.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                            {priority.text}
                        </span>
                    )}
                    <BsThreeDots size={11} className="text-slate-300" />
                </div>
            </div>

            {/* Title (first item description) */}
            <h4 className="text-[13px] font-semibold text-slate-900 leading-snug mb-2 line-clamp-2">
                {order.items[0]?.description ?? 'Sin descripción'}
                {order.items.length > 1 && (
                    <span className="text-[11px] text-slate-400 font-normal ml-1">
                        + {order.items.length - 1} más
                    </span>
                )}
            </h4>

            {/* Customer */}
            <div className="flex items-center gap-2 mb-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] font-semibold text-slate-600 shrink-0">
                    {initials}
                </span>
                <span className="text-[11px] text-slate-600 truncate">
                    {order.customer.company ?? order.customer.name}
                </span>
            </div>

            {/* Footer: total + assignee + due */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                <span className="text-[12px] font-semibold text-slate-900 tabular-nums">
                    {formatPrice(order.total)}
                </span>
                <div className="flex items-center gap-2 text-[10.5px]">
                    {order.assignedTo && (
                        <span className="inline-flex items-center gap-1 text-slate-500" title={order.assignedTo}>
                            <BsPersonCheck size={10} />
                            <span className="truncate max-w-[60px]">
                                {order.assignedTo.split(' ')[0]}
                            </span>
                        </span>
                    )}
                    {urgency.tone !== 'normal' && urgency.tone === 'overdue' ? (
                        <span className={`inline-flex items-center gap-1 ${dueColor}`}>
                            <BsExclamationTriangle size={10} />
                            {dueLabel}
                        </span>
                    ) : (
                        <span className={`inline-flex items-center gap-1 ${dueColor}`}>
                            <BsClock size={10} />
                            {dueLabel}
                        </span>
                    )}
                </div>
            </div>
        </article>
    );
}
