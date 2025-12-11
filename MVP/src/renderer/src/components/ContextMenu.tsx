import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { cn } from '../lib/utils';

interface ContextMenuProps {
    onDelete?: () => void;
    onEdit?: () => void;
    showEdit?: boolean;
}

export const ContextMenu = ({ onDelete, onEdit, showEdit = false }: ContextMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(false);
        onDelete?.();
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(false);
        onEdit?.();
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <MoreHorizontal size={14} className="text-gray-400" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[140px] z-50">
                    {showEdit && onEdit && (
                        <button
                            onClick={handleEdit}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            <Edit size={14} />
                            <span>Editar Item</span>
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                            <Trash2 size={14} />
                            <span>Excluir</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
