import { Component, Show, For, createSignal, createEffect } from 'solid-js';
import { useParams } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import { ProjectLayout } from '../components/ProjectLayout';

// Categorias de cores
const COLOR_CATEGORIES = [
    { id: 'primary', name: 'Cores Primárias', description: 'As cores principais da marca' },
    { id: 'secondary', name: 'Cores Secundárias', description: 'Cores de apoio e complementares' },
    { id: 'neutral', name: 'Neutros', description: 'Cinzas e tons neutros' },
    { id: 'accent', name: 'Destaques', description: 'Cores para chamar atenção' },
    { id: 'alert', name: 'Alertas', description: 'Sucesso, erro, aviso' },
];

interface BrandColor {
    id?: string;
    project_id: string;
    category: string;
    name: string;
    hex_code: string;
    sort_order: number;
}

// Utilitários de conversão de cores
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    } : null;
};

const hexToCmyk = (hex: string): { c: number; m: number; y: number; k: number } | null => {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;

    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const k = 1 - Math.max(r, g, b);
    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };

    const c = (1 - r - k) / (1 - k);
    const m = (1 - g - k) / (1 - k);
    const y = (1 - b - k) / (1 - k);

    return {
        c: Math.round(c * 100),
        m: Math.round(m * 100),
        y: Math.round(y * 100),
        k: Math.round(k * 100),
    };
};

const copyToClipboard = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
    } catch (error) {
        console.error('Failed to copy:', error);
    }
};

export const BrandColorsPage: Component = () => {
    const params = useParams();

    const [colors, setColors] = createSignal<BrandColor[]>([]);
    const [loading, setLoading] = createSignal(true);
    const [editingColor, setEditingColor] = createSignal<BrandColor | null>(null);
    const [newColorCategory, setNewColorCategory] = createSignal<string | null>(null);
    const [copiedId, setCopiedId] = createSignal<string | null>(null);

    // Form state
    const [formName, setFormName] = createSignal('');
    const [formHex, setFormHex] = createSignal('#3B82F6');

    // Load colors
    createEffect(async () => {
        try {
            const { data, error } = await supabase
                .from('brand_colors')
                .select('*')
                .eq('project_id', params.id)
                .order('category')
                .order('sort_order');

            if (data) {
                setColors(data);
            }
        } catch (error) {
            console.error('Error loading colors:', error);
        } finally {
            setLoading(false);
        }
    });

    const getColorsByCategory = (category: string) => {
        return colors().filter(c => c.category === category);
    };

    const handleCopy = async (text: string, id: string) => {
        await copyToClipboard(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const openAddColor = (category: string) => {
        setNewColorCategory(category);
        setFormName('');
        setFormHex('#3B82F6');
        setEditingColor(null);
    };

    const openEditColor = (color: BrandColor) => {
        setEditingColor(color);
        setFormName(color.name);
        setFormHex(color.hex_code);
        setNewColorCategory(null);
    };

    const closeModal = () => {
        setNewColorCategory(null);
        setEditingColor(null);
    };

    const saveColor = async () => {
        const editing = editingColor();
        const category = newColorCategory();

        if (!formName().trim() || !formHex().trim()) return;

        try {
            if (editing) {
                // Update
                const { error } = await supabase
                    .from('brand_colors')
                    .update({
                        name: formName().trim(),
                        hex_code: formHex().trim(),
                    })
                    .eq('id', editing.id);

                if (!error) {
                    setColors(prev => prev.map(c =>
                        c.id === editing.id
                            ? { ...c, name: formName().trim(), hex_code: formHex().trim() }
                            : c
                    ));
                }
            } else if (category) {
                // Insert
                const { data, error } = await supabase
                    .from('brand_colors')
                    .insert({
                        project_id: params.id,
                        category,
                        name: formName().trim(),
                        hex_code: formHex().trim(),
                        sort_order: getColorsByCategory(category).length,
                    })
                    .select()
                    .single();

                if (data) {
                    setColors(prev => [...prev, data]);
                }
            }

            closeModal();
        } catch (error) {
            console.error('Error saving color:', error);
        }
    };

    const deleteColor = async (id: string) => {
        if (!confirm('Remover esta cor?')) return;

        try {
            const { error } = await supabase
                .from('brand_colors')
                .delete()
                .eq('id', id);

            if (!error) {
                setColors(prev => prev.filter(c => c.id !== id));
            }
        } catch (error) {
            console.error('Error deleting color:', error);
        }
    };

    return (
        <ProjectLayout>
            <div class="brand-colors-page">
                {/* Header */}
                <div class="brand-colors-header">
                    <h1 class="brand-colors-title">Paleta de Cores</h1>
                    <p class="brand-colors-description">
                        Gerencie as cores da identidade visual do projeto.
                    </p>
                </div>

                <Show when={!loading()} fallback={<div class="spinner spinner-lg" style={{ margin: '2rem auto' }} />}>
                    {/* Categories */}
                    <div class="color-categories">
                        <For each={COLOR_CATEGORIES}>
                            {(category) => (
                                <div class="color-category">
                                    <div class="color-category-header">
                                        <div>
                                            <h3 class="color-category-title">{category.name}</h3>
                                            <p class="color-category-description">{category.description}</p>
                                        </div>
                                        <button
                                            class="btn btn-secondary btn-sm"
                                            onClick={() => openAddColor(category.id)}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <line x1="12" y1="5" x2="12" y2="19" />
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>
                                            Adicionar
                                        </button>
                                    </div>

                                    <Show
                                        when={getColorsByCategory(category.id).length > 0}
                                        fallback={
                                            <div class="color-empty">
                                                Nenhuma cor nesta categoria
                                            </div>
                                        }
                                    >
                                        <div class="color-grid">
                                            <For each={getColorsByCategory(category.id)}>
                                                {(color) => {
                                                    const rgb = hexToRgb(color.hex_code);
                                                    const cmyk = hexToCmyk(color.hex_code);

                                                    return (
                                                        <div class="color-card">
                                                            <div
                                                                class="color-preview"
                                                                style={{ background: color.hex_code }}
                                                                onClick={() => openEditColor(color)}
                                                            />
                                                            <div class="color-info">
                                                                <div class="color-name">{color.name}</div>

                                                                <div class="color-codes">
                                                                    <button
                                                                        class="color-code"
                                                                        onClick={() => handleCopy(color.hex_code, `${color.id}-hex`)}
                                                                        title="Copiar HEX"
                                                                    >
                                                                        <span class="color-code-label">HEX</span>
                                                                        <span class="color-code-value">{color.hex_code.toUpperCase()}</span>
                                                                        <Show when={copiedId() === `${color.id}-hex`}>
                                                                            <span class="copied-badge">✓</span>
                                                                        </Show>
                                                                    </button>

                                                                    <Show when={rgb}>
                                                                        <button
                                                                            class="color-code"
                                                                            onClick={() => handleCopy(`rgb(${rgb!.r}, ${rgb!.g}, ${rgb!.b})`, `${color.id}-rgb`)}
                                                                            title="Copiar RGB"
                                                                        >
                                                                            <span class="color-code-label">RGB</span>
                                                                            <span class="color-code-value">{rgb!.r}, {rgb!.g}, {rgb!.b}</span>
                                                                            <Show when={copiedId() === `${color.id}-rgb`}>
                                                                                <span class="copied-badge">✓</span>
                                                                            </Show>
                                                                        </button>
                                                                    </Show>

                                                                    <Show when={cmyk}>
                                                                        <button
                                                                            class="color-code"
                                                                            onClick={() => handleCopy(`cmyk(${cmyk!.c}%, ${cmyk!.m}%, ${cmyk!.y}%, ${cmyk!.k}%)`, `${color.id}-cmyk`)}
                                                                            title="Copiar CMYK"
                                                                        >
                                                                            <span class="color-code-label">CMYK</span>
                                                                            <span class="color-code-value">{cmyk!.c}, {cmyk!.m}, {cmyk!.y}, {cmyk!.k}</span>
                                                                            <Show when={copiedId() === `${color.id}-cmyk`}>
                                                                                <span class="copied-badge">✓</span>
                                                                            </Show>
                                                                        </button>
                                                                    </Show>
                                                                </div>
                                                            </div>

                                                            <button
                                                                class="color-delete"
                                                                onClick={() => deleteColor(color.id!)}
                                                                title="Remover cor"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                    <polyline points="3 6 5 6 21 6" />
                                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    );
                                                }}
                                            </For>
                                        </div>
                                    </Show>
                                </div>
                            )}
                        </For>
                    </div>
                </Show>

                {/* Modal */}
                <Show when={newColorCategory() || editingColor()}>
                    <div class="modal-overlay" onClick={closeModal}>
                        <div class="modal color-modal" onClick={(e) => e.stopPropagation()}>
                            <div class="modal-header">
                                <h3 class="modal-title">
                                    {editingColor() ? 'Editar Cor' : 'Nova Cor'}
                                </h3>
                                <button class="modal-close" onClick={closeModal}>×</button>
                            </div>

                            <div class="modal-body">
                                <div class="form-group">
                                    <label class="form-label">Nome da Cor</label>
                                    <input
                                        type="text"
                                        class="form-input"
                                        placeholder="Ex: Azul Principal"
                                        value={formName()}
                                        onInput={(e) => setFormName(e.currentTarget.value)}
                                    />
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Código Hexadecimal</label>
                                    <div class="color-picker-row">
                                        <input
                                            type="color"
                                            class="color-picker-input"
                                            value={formHex()}
                                            onInput={(e) => setFormHex(e.currentTarget.value)}
                                        />
                                        <input
                                            type="text"
                                            class="form-input"
                                            placeholder="#000000"
                                            value={formHex()}
                                            onInput={(e) => setFormHex(e.currentTarget.value)}
                                            style={{ flex: 1 }}
                                        />
                                    </div>
                                </div>

                                <div
                                    class="color-preview-large"
                                    style={{ background: formHex() }}
                                />
                            </div>

                            <div class="modal-footer">
                                <button class="btn btn-ghost" onClick={closeModal}>
                                    Cancelar
                                </button>
                                <button class="btn btn-primary" onClick={saveColor}>
                                    {editingColor() ? 'Salvar' : 'Adicionar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </Show>
            </div>
        </ProjectLayout>
    );
};
