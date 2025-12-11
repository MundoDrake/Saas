import { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface InputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (value: string) => Promise<void | boolean | { error?: string } | any>;
    title: string;
    description?: string;
    placeholder?: string;
    buttonLabel?: string;
}

export const InputModal = ({
    isOpen,
    onClose,
    onSubmit,
    title,
    description,
    placeholder = "Type here...",
    buttonLabel = "Create"
}: InputModalProps) => {
    const [value, setValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setValue('');
            setError(null);
            setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!value.trim()) return;

        setIsLoading(true);
        try {
            // onSubmit can return void, boolean, or object { error: string }
            // We cast to any to safely check properties without complex generics
            const result = await onSubmit(value.trim()) as any;

            // If result explicitly says false (legacy)
            if (result === false) {
                setError("Falha na operação");
                setIsLoading(false);
                return;
            }

            // Check for error object
            if (result && typeof result === 'object' && result.error) {
                setError(result.error);
                setIsLoading(false);
                return;
            }

            // Success (void, true, or {success: true})
            onClose();
        } catch (err: any) {
            console.error("InputModal Error:", err);
            setError(err.message || "Ocorreu um erro inesperado");
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-card border border-border rounded-lg shadow-lg animate-in zoom-in-95 duration-200 p-6 space-y-4">
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                    <X size={18} />
                </button>

                <div>
                    <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                    {description && (
                        <p className="text-sm text-muted-foreground mt-1">{description}</p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={value}
                            onChange={(e) => {
                                setValue(e.target.value);
                                if (error) setError(null);
                            }}
                            disabled={isLoading}
                            placeholder={placeholder}
                            className={cn(
                                "flex-1 h-10 px-3 rounded-md border bg-transparent text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                error ? "border-red-500 focus-visible:ring-red-500" : "border-input"
                            )}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !value.trim()}
                            className="h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-w-[80px]"
                        >
                            {isLoading ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                buttonLabel
                            )}
                        </button>
                    </div>
                    {error && (
                        <p className="text-sm text-red-500 font-medium animate-in slide-in-from-top-1">
                            {error}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
};
