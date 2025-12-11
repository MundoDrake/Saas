import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

export interface SelectionOption {
    id: string;
    label: string;
    icon: LucideIcon;
    description?: string;
    onClick: () => void;
    disabled?: boolean;
}

interface SelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    options: SelectionOption[];
}

export const SelectionModal = ({
    isOpen,
    onClose,
    title,
    description,
    options
}: SelectionModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg p-6 space-y-6"
            >
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
                    {description && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {options.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => {
                                if (!option.disabled) {
                                    option.onClick();
                                    onClose();
                                }
                            }}
                            disabled={option.disabled}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all duration-200 group text-left",
                                option.disabled && "opacity-50 cursor-not-allowed hover:border-zinc-200 dark:hover:border-zinc-800 hover:bg-transparent"
                            )}
                        >
                            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full group-hover:bg-white dark:group-hover:bg-zinc-700 transition-colors shadow-sm">
                                <option.icon size={24} className="text-zinc-500 group-hover:text-indigo-500 transition-colors" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{option.label}</h3>
                                {option.description && (
                                    <p className="text-xs text-zinc-500 mt-0.5">{option.description}</p>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};
