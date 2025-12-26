import { Component, Show, createSignal, For } from 'solid-js';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui';
import type { TimeCategory } from '../types/database';

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCategoryAdded: (category: TimeCategory) => void;
    categories: TimeCategory[];
}

// Common emoji options for categories
const EMOJI_OPTIONS = [
    '📋', '🎨', '💻', '📱', '🍸', '😴', '🏃', '📚', '🎵', '🎮',
    '✏️', '📷', '🎬', '🛠️', '💼', '📊', '🧹', '🍳', '🚗', '✈️',
    '🏠', '🛒', '💰', '📞', '✉️', '📝', '🎯', '⚡', '🔧', '🌟'
];

// Color options
const COLOR_OPTIONS = [
    '#8b5cf6', // Purple
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#ec4899', // Pink
    '#6366f1', // Indigo
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#6b7280', // Gray
];

export const CategoryModal: Component<CategoryModalProps> = (props) => {
    const { user } = useAuth();
    const [name, setName] = createSignal('');
    const [icon, setIcon] = createSignal('📋');
    const [color, setColor] = createSignal('#6366f1');
    const [saving, setSaving] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        if (!name().trim()) return;

        setSaving(true);
        setError(null);

        try {
            const { data, error: insertError } = await supabase
                .from('time_categories')
                .insert({
                    name: name().trim(),
                    icon: icon(),
                    color: color(),
                    user_id: user()?.id,
                    is_default: false,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            props.onCategoryAdded(data);
            setName('');
            setIcon('📋');
            setColor('#6366f1');
            props.onClose();
        } catch (err: any) {
            setError(err.message || 'Erro ao criar categoria');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setName('');
        setIcon('📋');
        setColor('#6366f1');
        setError(null);
        props.onClose();
    };

    return (
        <Show when={props.isOpen}>
            <div class="modal-overlay" onClick={handleClose}>
                <div class="modal category-modal" onClick={(e) => e.stopPropagation()}>
                    <div class="modal-header">
                        <h3 class="modal-title">Nova Categoria</h3>
                        <button class="modal-close" onClick={handleClose}>
                            <i class="ci-Close_MD"></i>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div class="modal-body">
                            <Show when={error()}>
                                <div class="alert alert-error" style={{ "margin-bottom": "var(--spacing-4)" }}>
                                    {error()}
                                </div>
                            </Show>

                            {/* Preview */}
                            <div class="category-preview">
                                <div
                                    class="category-preview-badge"
                                    style={{ "background-color": color() }}
                                >
                                    <span class="category-preview-icon">{icon()}</span>
                                    <span class="category-preview-name">{name() || 'Nova Categoria'}</span>
                                </div>
                            </div>

                            {/* Name Input */}
                            <div class="form-group">
                                <label class="form-label">Nome da Categoria *</label>
                                <input
                                    type="text"
                                    class="form-input"
                                    value={name()}
                                    onInput={(e) => setName(e.currentTarget.value)}
                                    placeholder="Ex: Reuniões, Estudos, Exercícios..."
                                    required
                                    maxLength={30}
                                />
                            </div>

                            {/* Emoji Picker */}
                            <div class="form-group">
                                <label class="form-label">Ícone</label>
                                <div class="emoji-picker">
                                    <For each={EMOJI_OPTIONS}>
                                        {(emoji) => (
                                            <button
                                                type="button"
                                                class="emoji-option"
                                                classList={{ active: icon() === emoji }}
                                                onClick={() => setIcon(emoji)}
                                            >
                                                {emoji}
                                            </button>
                                        )}
                                    </For>
                                </div>
                            </div>

                            {/* Color Picker */}
                            <div class="form-group">
                                <label class="form-label">Cor</label>
                                <div class="color-picker">
                                    <For each={COLOR_OPTIONS}>
                                        {(c) => (
                                            <button
                                                type="button"
                                                class="color-option"
                                                classList={{ active: color() === c }}
                                                style={{ "background-color": c }}
                                                onClick={() => setColor(c)}
                                            />
                                        )}
                                    </For>
                                </div>
                            </div>
                        </div>

                        <div class="modal-footer">
                            <Button type="button" variant="ghost" onClick={handleClose}>
                                Cancelar
                            </Button>
                            <Button type="submit" variant="primary" loading={saving()} disabled={!name().trim()}>
                                Criar Categoria
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Show>
    );
};
