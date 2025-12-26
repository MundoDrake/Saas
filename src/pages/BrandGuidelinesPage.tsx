import { Component, Show, For, createSignal, createEffect } from 'solid-js';
import { useParams } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import { ProjectLayout } from '../components/ProjectLayout';

interface BrandGuidelines {
    id?: string;
    project_id: string;
    // Logo
    logo_usage: string;
    logo_minimum_size: string;
    logo_clear_space: string;
    logo_incorrect_usage: string;
    // Colors
    color_primary_usage: string;
    color_secondary_usage: string;
    color_backgrounds: string;
    color_combinations: string;
    // Typography
    typography_hierarchy: string;
    typography_sizes: string;
    typography_spacing: string;
    // Imagery
    imagery_style: string;
    imagery_filters: string;
    imagery_subjects: string;
    // Applications
    application_digital: string;
    application_print: string;
    application_social: string;
    // Spacing
    spacing_rules: string;
    grid_system: string;
    // Meta
    version: number;
    notes: string;
}

type TabId = 'logo' | 'colors' | 'typography' | 'imagery' | 'applications';

const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: 'logo', label: 'Logo', icon: '🎨' },
    { id: 'colors', label: 'Cores', icon: '🎨' },
    { id: 'typography', label: 'Tipografia', icon: '🔤' },
    { id: 'imagery', label: 'Imagens', icon: '📷' },
    { id: 'applications', label: 'Aplicações', icon: '📱' },
];

const defaultGuidelines: Omit<BrandGuidelines, 'project_id'> = {
    logo_usage: '',
    logo_minimum_size: '',
    logo_clear_space: '',
    logo_incorrect_usage: '',
    color_primary_usage: '',
    color_secondary_usage: '',
    color_backgrounds: '',
    color_combinations: '',
    typography_hierarchy: '',
    typography_sizes: '',
    typography_spacing: '',
    imagery_style: '',
    imagery_filters: '',
    imagery_subjects: '',
    application_digital: '',
    application_print: '',
    application_social: '',
    spacing_rules: '',
    grid_system: '',
    version: 1,
    notes: '',
};

export const BrandGuidelinesPage: Component = () => {
    const params = useParams();

    const [activeTab, setActiveTab] = createSignal<TabId>('logo');
    const [guidelines, setGuidelines] = createSignal<BrandGuidelines>({
        ...defaultGuidelines,
        project_id: params.id || '',
    });
    const [loading, setLoading] = createSignal(true);
    const [saveStatus, setSaveStatus] = createSignal<'idle' | 'saving' | 'saved'>('idle');

    // Load guidelines
    createEffect(async () => {
        try {
            const { data } = await supabase
                .from('brand_guidelines')
                .select('*')
                .eq('project_id', params.id)
                .single();

            if (data) {
                setGuidelines({ ...defaultGuidelines, ...data });
            }
        } catch (error) {
            // No existing guidelines
        } finally {
            setLoading(false);
        }
    });

    // Auto-save with debounce
    let saveTimeout: number;
    const saveGuidelines = async () => {
        setSaveStatus('saving');

        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
            try {
                const data = guidelines();

                if (data.id) {
                    const { id, project_id, ...updateData } = data;
                    await supabase
                        .from('brand_guidelines')
                        .update(updateData)
                        .eq('id', id);
                } else {
                    const { data: newData } = await supabase
                        .from('brand_guidelines')
                        .insert(data)
                        .select()
                        .single();

                    if (newData) {
                        setGuidelines(prev => ({ ...prev, id: newData.id }));
                    }
                }

                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error('Error saving guidelines:', error);
                setSaveStatus('idle');
            }
        }, 1000);
    };

    const updateField = (field: keyof BrandGuidelines, value: any) => {
        setGuidelines(prev => ({ ...prev, [field]: value }));
        saveGuidelines();
    };

    return (
        <ProjectLayout>
            <div class="brand-guidelines-page">
                {/* Header */}
                <div class="brand-strategy-header">
                    <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'flex-start' }}>
                        <div>
                            <h1 class="brand-strategy-title">Diretrizes de Marca</h1>
                            <p class="brand-strategy-description">
                                Documente as regras de uso de todos os elementos da identidade visual.
                            </p>
                        </div>
                        <Show when={saveStatus() !== 'idle'}>
                            <div class={`autosave-indicator ${saveStatus()}`}>
                                <Show when={saveStatus() === 'saving'}>
                                    <div class="spinner spinner-sm" />
                                    <span>Salvando...</span>
                                </Show>
                                <Show when={saveStatus() === 'saved'}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    <span>Salvo</span>
                                </Show>
                            </div>
                        </Show>
                    </div>
                </div>

                {/* Tabs */}
                <div class="strategy-tabs">
                    <For each={TABS}>
                        {(tab) => (
                            <button
                                class="strategy-tab"
                                classList={{ active: activeTab() === tab.id }}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        )}
                    </For>
                </div>

                <Show when={!loading()} fallback={<div class="spinner spinner-lg" style={{ margin: '2rem auto' }} />}>
                    {/* Logo Tab */}
                    <Show when={activeTab() === 'logo'}>
                        <div class="strategy-section">
                            <h2 class="strategy-section-title">Regras de Uso do Logo</h2>
                            <p class="strategy-section-description">
                                Defina como o logo deve ser aplicado corretamente.
                            </p>

                            <div class="strategy-form">
                                <div class="strategy-field">
                                    <label class="strategy-field-label">Uso Correto</label>
                                    <p class="strategy-field-description">Como o logo deve ser aplicado.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: O logo deve sempre aparecer sobre fundos claros com contraste adequado..."
                                        value={guidelines().logo_usage}
                                        onInput={(e) => updateField('logo_usage', e.currentTarget.value)}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Tamanho Mínimo</label>
                                    <p class="strategy-field-description">Dimensões mínimas para garantir legibilidade.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: Digital: 100px de largura. Impresso: 25mm de largura..."
                                        value={guidelines().logo_minimum_size}
                                        onInput={(e) => updateField('logo_minimum_size', e.currentTarget.value)}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Área de Proteção</label>
                                    <p class="strategy-field-description">Espaço livre ao redor do logo.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: Manter uma margem mínima equivalente à altura do símbolo..."
                                        value={guidelines().logo_clear_space}
                                        onInput={(e) => updateField('logo_clear_space', e.currentTarget.value)}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Usos Incorretos</label>
                                    <p class="strategy-field-description">O que NÃO fazer com o logo.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: Não distorcer, não alterar cores, não rotacionar..."
                                        value={guidelines().logo_incorrect_usage}
                                        onInput={(e) => updateField('logo_incorrect_usage', e.currentTarget.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </Show>

                    {/* Colors Tab */}
                    <Show when={activeTab() === 'colors'}>
                        <div class="strategy-section">
                            <h2 class="strategy-section-title">Aplicação de Cores</h2>
                            <p class="strategy-section-description">
                                Como as cores da marca devem ser usadas.
                            </p>

                            <div class="strategy-form">
                                <div class="strategy-field">
                                    <label class="strategy-field-label">Cores Primárias</label>
                                    <p class="strategy-field-description">Quando e como usar as cores principais.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: A cor primária deve ser usada em elementos de destaque, CTAs..."
                                        value={guidelines().color_primary_usage}
                                        onInput={(e) => updateField('color_primary_usage', e.currentTarget.value)}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Cores Secundárias</label>
                                    <p class="strategy-field-description">Uso das cores de suporte.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: Cores secundárias em elementos complementares, ícones..."
                                        value={guidelines().color_secondary_usage}
                                        onInput={(e) => updateField('color_secondary_usage', e.currentTarget.value)}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Fundos Permitidos</label>
                                    <p class="strategy-field-description">Cores de fundo onde os elementos podem aparecer.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: Fundos claros brancos ou cinza claro (#F5F5F5)..."
                                        value={guidelines().color_backgrounds}
                                        onInput={(e) => updateField('color_backgrounds', e.currentTarget.value)}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Combinações Recomendadas</label>
                                    <p class="strategy-field-description">Pares de cores que funcionam bem juntos.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: Primária + Branco, Secundária + Cinza escuro..."
                                        value={guidelines().color_combinations}
                                        onInput={(e) => updateField('color_combinations', e.currentTarget.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </Show>

                    {/* Typography Tab */}
                    <Show when={activeTab() === 'typography'}>
                        <div class="strategy-section">
                            <h2 class="strategy-section-title">Regras Tipográficas</h2>
                            <p class="strategy-section-description">
                                Como aplicar as fontes da marca.
                            </p>

                            <div class="strategy-form">
                                <div class="strategy-field">
                                    <label class="strategy-field-label">Hierarquia</label>
                                    <p class="strategy-field-description">Qual fonte usar para cada tipo de texto.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        style={{ 'min-height': '140px' }}
                                        placeholder="Ex: H1: Display Bold / H2: Display Medium / Body: Sans Regular..."
                                        value={guidelines().typography_hierarchy}
                                        onInput={(e) => updateField('typography_hierarchy', e.currentTarget.value)}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Tamanhos</label>
                                    <p class="strategy-field-description">Escala tipográfica recomendada.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: H1: 48px / H2: 36px / H3: 24px / Body: 16px / Small: 14px..."
                                        value={guidelines().typography_sizes}
                                        onInput={(e) => updateField('typography_sizes', e.currentTarget.value)}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Espaçamento</label>
                                    <p class="strategy-field-description">Entrelinhas e espaçamento entre letras.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: Títulos: line-height 1.2 / Corpo: line-height 1.5..."
                                        value={guidelines().typography_spacing}
                                        onInput={(e) => updateField('typography_spacing', e.currentTarget.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </Show>

                    {/* Imagery Tab */}
                    <Show when={activeTab() === 'imagery'}>
                        <div class="strategy-section">
                            <h2 class="strategy-section-title">Estilo de Imagens</h2>
                            <p class="strategy-section-description">
                                Diretrizes para fotografia e ilustrações.
                            </p>

                            <div class="strategy-form">
                                <div class="strategy-field">
                                    <label class="strategy-field-label">Estilo Fotográfico</label>
                                    <p class="strategy-field-description">Características visuais das imagens.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        style={{ 'min-height': '140px' }}
                                        placeholder="Ex: Fotos naturais e autênticas, iluminação suave, pessoas reais..."
                                        value={guidelines().imagery_style}
                                        onInput={(e) => updateField('imagery_style', e.currentTarget.value)}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Tratamento e Filtros</label>
                                    <p class="strategy-field-description">Edição e pós-processamento.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: Contraste leve, saturação natural, sem filtros pesados..."
                                        value={guidelines().imagery_filters}
                                        onInput={(e) => updateField('imagery_filters', e.currentTarget.value)}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Temas e Assuntos</label>
                                    <p class="strategy-field-description">O que as imagens devem retratar.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: Pessoas colaborando, momentos de conquista, ambientes modernos..."
                                        value={guidelines().imagery_subjects}
                                        onInput={(e) => updateField('imagery_subjects', e.currentTarget.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </Show>

                    {/* Applications Tab */}
                    <Show when={activeTab() === 'applications'}>
                        <div class="strategy-section">
                            <h2 class="strategy-section-title">Aplicações</h2>
                            <p class="strategy-section-description">
                                Como a marca aparece em diferentes contextos.
                            </p>

                            <div class="strategy-form">
                                <div class="strategy-field">
                                    <label class="strategy-field-label">Digital</label>
                                    <p class="strategy-field-description">Websites, apps, email marketing.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        style={{ 'min-height': '140px' }}
                                        placeholder="Ex: Header com logo à esquerda, cores primárias em CTAs..."
                                        value={guidelines().application_digital}
                                        onInput={(e) => updateField('application_digital', e.currentTarget.value)}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Impresso</label>
                                    <p class="strategy-field-description">Cartões, folders, papelaria.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        style={{ 'min-height': '140px' }}
                                        placeholder="Ex: Logo centralizado no cartão, fonte mínima 8pt..."
                                        value={guidelines().application_print}
                                        onInput={(e) => updateField('application_print', e.currentTarget.value)}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Redes Sociais</label>
                                    <p class="strategy-field-description">Posts, stories, capas de perfil.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        style={{ 'min-height': '140px' }}
                                        placeholder="Ex: Templates com logo no canto inferior, paleta de cores vibrantes..."
                                        value={guidelines().application_social}
                                        onInput={(e) => updateField('application_social', e.currentTarget.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </Show>
                </Show>
            </div>
        </ProjectLayout>
    );
};
