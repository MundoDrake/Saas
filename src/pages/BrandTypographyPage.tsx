import { Component, Show, For, createSignal, createEffect } from 'solid-js';
import { useParams } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import { ProjectLayout } from '../components/ProjectLayout';

// Papéis tipográficos
const FONT_ROLES = [
    { id: 'heading', name: 'Títulos', description: 'Usado em headings (H1-H6)', icon: 'H' },
    { id: 'body', name: 'Corpo de Texto', description: 'Texto principal e parágrafos', icon: 'Aa' },
    { id: 'accent', name: 'Destaque', description: 'Chamadas e citações', icon: '★' },
    { id: 'caption', name: 'Legendas', description: 'Textos pequenos e notas', icon: 'a' },
    { id: 'monospace', name: 'Código', description: 'Textos técnicos e código', icon: '</>' },
];

// Pesos de fonte comuns
const FONT_WEIGHTS = [
    { value: '100', label: 'Thin' },
    { value: '200', label: 'Extra Light' },
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' },
    { value: '800', label: 'Extra Bold' },
    { value: '900', label: 'Black' },
];

// Fontes populares do Google Fonts
const POPULAR_FONTS = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
    'Raleway', 'Nunito', 'Playfair Display', 'Merriweather', 'Source Sans Pro',
    'Ubuntu', 'DM Sans', 'Work Sans', 'Outfit', 'Space Grotesk',
    'JetBrains Mono', 'Fira Code', 'Source Code Pro',
];

interface BrandFont {
    id?: string;
    project_id: string;
    role: string;
    family_name: string;
    font_url: string;
    font_weight: string;
    font_style: string;
    fallback_stack: string;
    sample_text: string;
    sort_order: number;
}

export const BrandTypographyPage: Component = () => {
    const params = useParams();

    const [fonts, setFonts] = createSignal<BrandFont[]>([]);
    const [loading, setLoading] = createSignal(true);
    const [editingFont, setEditingFont] = createSignal<BrandFont | null>(null);
    const [newFontRole, setNewFontRole] = createSignal<string | null>(null);

    // Form state
    const [formFamily, setFormFamily] = createSignal('');
    const [formWeight, setFormWeight] = createSignal('400');
    const [formStyle, setFormStyle] = createSignal('normal');
    const [formFallback, setFormFallback] = createSignal('sans-serif');
    const [formSample, setFormSample] = createSignal('');

    // Load fonts
    createEffect(async () => {
        try {
            const { data, error } = await supabase
                .from('brand_fonts')
                .select('*')
                .eq('project_id', params.id)
                .order('role')
                .order('sort_order');

            if (data) {
                setFonts(data);
                // Load Google Fonts
                loadGoogleFonts(data);
            }
        } catch (error) {
            console.error('Error loading fonts:', error);
        } finally {
            setLoading(false);
        }
    });

    const loadGoogleFonts = (fontList: BrandFont[]) => {
        const families = [...new Set(fontList.map(f => f.family_name))];
        if (families.length === 0) return;

        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?family=${families.map(f => f.replace(/ /g, '+')).join('&family=')}&display=swap`;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    };

    const getFontsByRole = (role: string) => {
        return fonts().filter(f => f.role === role);
    };

    const openAddFont = (role: string) => {
        setNewFontRole(role);
        setFormFamily('');
        setFormWeight('400');
        setFormStyle('normal');
        setFormFallback('sans-serif');
        setFormSample('');
        setEditingFont(null);
    };

    const openEditFont = (font: BrandFont) => {
        setEditingFont(font);
        setFormFamily(font.family_name);
        setFormWeight(font.font_weight);
        setFormStyle(font.font_style);
        setFormFallback(font.fallback_stack);
        setFormSample(font.sample_text || '');
        setNewFontRole(null);
    };

    const closeModal = () => {
        setNewFontRole(null);
        setEditingFont(null);
    };

    const saveFont = async () => {
        const editing = editingFont();
        const role = newFontRole();

        if (!formFamily().trim()) return;

        const googleUrl = `https://fonts.googleapis.com/css2?family=${formFamily().replace(/ /g, '+')}&display=swap`;

        try {
            if (editing) {
                const { error } = await supabase
                    .from('brand_fonts')
                    .update({
                        family_name: formFamily().trim(),
                        font_url: googleUrl,
                        font_weight: formWeight(),
                        font_style: formStyle(),
                        fallback_stack: formFallback(),
                        sample_text: formSample(),
                    })
                    .eq('id', editing.id);

                if (!error) {
                    setFonts(prev => prev.map(f =>
                        f.id === editing.id
                            ? { ...f, family_name: formFamily().trim(), font_url: googleUrl, font_weight: formWeight(), font_style: formStyle(), fallback_stack: formFallback(), sample_text: formSample() }
                            : f
                    ));
                    loadGoogleFonts(fonts());
                }
            } else if (role) {
                const { data, error } = await supabase
                    .from('brand_fonts')
                    .insert({
                        project_id: params.id,
                        role,
                        family_name: formFamily().trim(),
                        font_url: googleUrl,
                        font_weight: formWeight(),
                        font_style: formStyle(),
                        fallback_stack: formFallback(),
                        sample_text: formSample() || getDefaultSampleText(role),
                        sort_order: getFontsByRole(role).length,
                    })
                    .select()
                    .single();

                if (data) {
                    setFonts(prev => [...prev, data]);
                    loadGoogleFonts([...fonts(), data]);
                }
            }

            closeModal();
        } catch (error) {
            console.error('Error saving font:', error);
        }
    };

    const getDefaultSampleText = (role: string) => {
        switch (role) {
            case 'heading': return 'Título de Exemplo';
            case 'body': return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
            case 'accent': return 'Destaque Especial';
            case 'caption': return 'Texto de legenda ou nota de rodapé';
            case 'monospace': return 'const hello = "world";';
            default: return 'Texto de exemplo';
        }
    };

    const deleteFont = async (id: string) => {
        if (!confirm('Remover esta fonte?')) return;

        try {
            const { error } = await supabase
                .from('brand_fonts')
                .delete()
                .eq('id', id);

            if (!error) {
                setFonts(prev => prev.filter(f => f.id !== id));
            }
        } catch (error) {
            console.error('Error deleting font:', error);
        }
    };

    const getFontPreviewStyle = (font: BrandFont) => ({
        'font-family': `"${font.family_name}", ${font.fallback_stack}`,
        'font-weight': font.font_weight,
        'font-style': font.font_style,
    });

    return (
        <ProjectLayout>
            <div class="brand-typography-page">
                {/* Header */}
                <div class="brand-typography-header">
                    <h1 class="brand-typography-title">Tipografia</h1>
                    <p class="brand-typography-description">
                        Defina as fontes utilizadas na identidade visual do projeto.
                    </p>
                </div>

                <Show when={!loading()} fallback={<div class="spinner spinner-lg" style={{ margin: '2rem auto' }} />}>
                    {/* Font Roles */}
                    <div class="font-roles">
                        <For each={FONT_ROLES}>
                            {(role) => (
                                <div class="font-role-section">
                                    <div class="font-role-header">
                                        <div class="font-role-icon">{role.icon}</div>
                                        <div>
                                            <h3 class="font-role-title">{role.name}</h3>
                                            <p class="font-role-description">{role.description}</p>
                                        </div>
                                        <button
                                            class="btn btn-secondary btn-sm"
                                            onClick={() => openAddFont(role.id)}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <line x1="12" y1="5" x2="12" y2="19" />
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>
                                            Adicionar
                                        </button>
                                    </div>

                                    <Show
                                        when={getFontsByRole(role.id).length > 0}
                                        fallback={
                                            <div class="font-empty">
                                                Nenhuma fonte definida para {role.name.toLowerCase()}
                                            </div>
                                        }
                                    >
                                        <div class="font-list">
                                            <For each={getFontsByRole(role.id)}>
                                                {(font) => (
                                                    <div class="font-card" onClick={() => openEditFont(font)}>
                                                        <div class="font-card-preview" style={getFontPreviewStyle(font)}>
                                                            {font.sample_text || getDefaultSampleText(font.role)}
                                                        </div>
                                                        <div class="font-card-info">
                                                            <div class="font-card-name">{font.family_name}</div>
                                                            <div class="font-card-meta">
                                                                {FONT_WEIGHTS.find(w => w.value === font.font_weight)?.label || font.font_weight}
                                                                {font.font_style !== 'normal' && `, ${font.font_style}`}
                                                            </div>
                                                        </div>
                                                        <button
                                                            class="font-delete"
                                                            onClick={(e) => { e.stopPropagation(); deleteFont(font.id!); }}
                                                            title="Remover fonte"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                <polyline points="3 6 5 6 21 6" />
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </For>
                                        </div>
                                    </Show>
                                </div>
                            )}
                        </For>
                    </div>
                </Show>

                {/* Modal */}
                <Show when={newFontRole() || editingFont()}>
                    <div class="modal-overlay" onClick={closeModal}>
                        <div class="modal font-modal" onClick={(e) => e.stopPropagation()}>
                            <div class="modal-header">
                                <h3 class="modal-title">
                                    {editingFont() ? 'Editar Fonte' : 'Nova Fonte'}
                                </h3>
                                <button class="modal-close" onClick={closeModal}>×</button>
                            </div>

                            <div class="modal-body">
                                <div class="form-group">
                                    <label class="form-label">Família da Fonte</label>
                                    <input
                                        type="text"
                                        class="form-input"
                                        placeholder="Ex: Inter, Roboto, Playfair Display"
                                        value={formFamily()}
                                        onInput={(e) => setFormFamily(e.currentTarget.value)}
                                        list="font-suggestions"
                                    />
                                    <datalist id="font-suggestions">
                                        <For each={POPULAR_FONTS}>
                                            {(font) => <option value={font} />}
                                        </For>
                                    </datalist>
                                </div>

                                <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: 'var(--spacing-4)' }}>
                                    <div class="form-group">
                                        <label class="form-label">Peso</label>
                                        <select
                                            class="form-select"
                                            value={formWeight()}
                                            onChange={(e) => setFormWeight(e.currentTarget.value)}
                                        >
                                            <For each={FONT_WEIGHTS}>
                                                {(weight) => (
                                                    <option value={weight.value}>{weight.label}</option>
                                                )}
                                            </For>
                                        </select>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">Estilo</label>
                                        <select
                                            class="form-select"
                                            value={formStyle()}
                                            onChange={(e) => setFormStyle(e.currentTarget.value)}
                                        >
                                            <option value="normal">Normal</option>
                                            <option value="italic">Itálico</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Fallback</label>
                                    <select
                                        class="form-select"
                                        value={formFallback()}
                                        onChange={(e) => setFormFallback(e.currentTarget.value)}
                                    >
                                        <option value="sans-serif">Sans-serif</option>
                                        <option value="serif">Serif</option>
                                        <option value="monospace">Monospace</option>
                                        <option value="cursive">Cursive</option>
                                        <option value="fantasy">Fantasy</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Texto de Exemplo</label>
                                    <input
                                        type="text"
                                        class="form-input"
                                        placeholder="Texto para preview..."
                                        value={formSample()}
                                        onInput={(e) => setFormSample(e.currentTarget.value)}
                                    />
                                </div>

                                <Show when={formFamily()}>
                                    <div class="font-preview-box">
                                        <link
                                            rel="stylesheet"
                                            href={`https://fonts.googleapis.com/css2?family=${formFamily().replace(/ /g, '+')}&display=swap`}
                                        />
                                        <p style={{
                                            'font-family': `"${formFamily()}", ${formFallback()}`,
                                            'font-weight': formWeight(),
                                            'font-style': formStyle(),
                                            'font-size': '24px',
                                            margin: 0,
                                        }}>
                                            {formSample() || 'Exemplo de texto com esta fonte'}
                                        </p>
                                    </div>
                                </Show>
                            </div>

                            <div class="modal-footer">
                                <button class="btn btn-ghost" onClick={closeModal}>
                                    Cancelar
                                </button>
                                <button class="btn btn-primary" onClick={saveFont}>
                                    {editingFont() ? 'Salvar' : 'Adicionar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </Show>
            </div>
        </ProjectLayout>
    );
};
