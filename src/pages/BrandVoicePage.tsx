import { Component, Show, For, createSignal, createEffect } from 'solid-js';
import { useParams } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import { ProjectLayout } from '../components/ProjectLayout';

interface BrandVoice {
    id?: string;
    project_id: string;
    tone_formal: number;
    tone_technical: number;
    tone_playful: number;
    tone_bold: number;
    tone_personal: number;
    vocabulary_do: string[];
    vocabulary_dont: string[];
    writing_style: string;
    grammar_rules: string;
    example_headline: string;
    example_body: string;
    example_cta: string;
    example_social: string;
    taglines: string[];
}

type TabId = 'tone' | 'vocabulary' | 'style' | 'examples';

const TABS: { id: TabId; label: string }[] = [
    { id: 'tone', label: 'Tom de Voz' },
    { id: 'vocabulary', label: 'Vocabulário' },
    { id: 'style', label: 'Estilo' },
    { id: 'examples', label: 'Exemplos' },
];

const TONE_SLIDERS = [
    { key: 'tone_formal', left: 'Informal', right: 'Formal' },
    { key: 'tone_technical', left: 'Simples', right: 'Técnico' },
    { key: 'tone_playful', left: 'Sério', right: 'Divertido' },
    { key: 'tone_bold', left: 'Discreto', right: 'Ousado' },
    { key: 'tone_personal', left: 'Institucional', right: 'Pessoal' },
];

const defaultVoice: Omit<BrandVoice, 'project_id'> = {
    tone_formal: 50,
    tone_technical: 50,
    tone_playful: 50,
    tone_bold: 50,
    tone_personal: 50,
    vocabulary_do: [],
    vocabulary_dont: [],
    writing_style: '',
    grammar_rules: '',
    example_headline: '',
    example_body: '',
    example_cta: '',
    example_social: '',
    taglines: [],
};

export const BrandVoicePage: Component = () => {
    const params = useParams();

    const [activeTab, setActiveTab] = createSignal<TabId>('tone');
    const [voice, setVoice] = createSignal<BrandVoice>({
        ...defaultVoice,
        project_id: params.id || '',
    });
    const [loading, setLoading] = createSignal(true);
    const [saveStatus, setSaveStatus] = createSignal<'idle' | 'saving' | 'saved'>('idle');
    const [newDoWord, setNewDoWord] = createSignal('');
    const [newDontWord, setNewDontWord] = createSignal('');
    const [newTagline, setNewTagline] = createSignal('');

    // Load voice
    createEffect(async () => {
        try {
            const { data } = await supabase
                .from('brand_voice')
                .select('*')
                .eq('project_id', params.id)
                .single();

            if (data) {
                setVoice({ ...defaultVoice, ...data });
            }
        } catch (error) {
            // No existing voice - will create on first save
        } finally {
            setLoading(false);
        }
    });

    // Auto-save with debounce
    let saveTimeout: number;
    const saveVoice = async () => {
        setSaveStatus('saving');

        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
            try {
                const data = voice();

                if (data.id) {
                    await supabase
                        .from('brand_voice')
                        .update({
                            tone_formal: data.tone_formal,
                            tone_technical: data.tone_technical,
                            tone_playful: data.tone_playful,
                            tone_bold: data.tone_bold,
                            tone_personal: data.tone_personal,
                            vocabulary_do: data.vocabulary_do,
                            vocabulary_dont: data.vocabulary_dont,
                            writing_style: data.writing_style,
                            grammar_rules: data.grammar_rules,
                            example_headline: data.example_headline,
                            example_body: data.example_body,
                            example_cta: data.example_cta,
                            example_social: data.example_social,
                            taglines: data.taglines,
                        })
                        .eq('id', data.id);
                } else {
                    const { data: newData } = await supabase
                        .from('brand_voice')
                        .insert(data)
                        .select()
                        .single();

                    if (newData) {
                        setVoice(prev => ({ ...prev, id: newData.id }));
                    }
                }

                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error('Error saving voice:', error);
                setSaveStatus('idle');
            }
        }, 1000);
    };

    const updateField = (field: keyof BrandVoice, value: any) => {
        setVoice(prev => ({ ...prev, [field]: value }));
        saveVoice();
    };

    const addWord = (field: 'vocabulary_do' | 'vocabulary_dont', word: string, e: KeyboardEvent) => {
        if (e.key === 'Enter' && word.trim()) {
            e.preventDefault();
            const current = voice()[field] || [];
            if (!current.includes(word.trim())) {
                updateField(field, [...current, word.trim()]);
            }
            if (field === 'vocabulary_do') setNewDoWord('');
            else setNewDontWord('');
        }
    };

    const removeWord = (field: 'vocabulary_do' | 'vocabulary_dont', word: string) => {
        updateField(field, voice()[field].filter(w => w !== word));
    };

    const addTagline = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && newTagline().trim()) {
            e.preventDefault();
            const current = voice().taglines || [];
            if (!current.includes(newTagline().trim())) {
                updateField('taglines', [...current, newTagline().trim()]);
            }
            setNewTagline('');
        }
    };

    const removeTagline = (tagline: string) => {
        updateField('taglines', voice().taglines.filter(t => t !== tagline));
    };

    return (
        <ProjectLayout>
            <div class="brand-strategy-page">
                {/* Header */}
                <div class="brand-strategy-header">
                    <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'flex-start' }}>
                        <div>
                            <h1 class="brand-strategy-title">Tom de Voz</h1>
                            <p class="brand-strategy-description">
                                Defina como a marca se comunica e expressa sua personalidade.
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
                    {/* Tom de Voz */}
                    <Show when={activeTab() === 'tone'}>
                        <div class="strategy-section">
                            <h2 class="strategy-section-title">Atributos de Tom</h2>
                            <p class="strategy-section-description">
                                Ajuste os sliders para definir onde a marca se posiciona em cada espectro.
                            </p>

                            <div class="voice-sliders">
                                <For each={TONE_SLIDERS}>
                                    {(slider) => (
                                        <div class="voice-slider-item">
                                            <div class="voice-slider-labels">
                                                <span>{slider.left}</span>
                                                <span>{slider.right}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={voice()[slider.key as keyof BrandVoice] as number}
                                                onInput={(e) => updateField(slider.key as keyof BrandVoice, parseInt(e.currentTarget.value))}
                                                class="voice-slider"
                                            />
                                            <div class="voice-slider-value">
                                                {voice()[slider.key as keyof BrandVoice]}%
                                            </div>
                                        </div>
                                    )}
                                </For>
                            </div>
                        </div>
                    </Show>

                    {/* Vocabulário */}
                    <Show when={activeTab() === 'vocabulary'}>
                        <div class="strategy-section">
                            <h2 class="strategy-section-title">Vocabulário da Marca</h2>
                            <p class="strategy-section-description">
                                Defina as palavras que a marca usa e as que deve evitar.
                            </p>

                            <div class="vocabulary-grid">
                                <div class="vocabulary-column vocabulary-do">
                                    <h3 class="vocabulary-title">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Use
                                    </h3>
                                    <div class="strategy-tags">
                                        <For each={voice().vocabulary_do}>
                                            {(word) => (
                                                <span class="strategy-tag vocabulary-tag-do">
                                                    {word}
                                                    <button class="strategy-tag-remove" onClick={() => removeWord('vocabulary_do', word)}>×</button>
                                                </span>
                                            )}
                                        </For>
                                        <input
                                            type="text"
                                            class="strategy-tag-input"
                                            placeholder="Digite e pressione Enter..."
                                            value={newDoWord()}
                                            onInput={(e) => setNewDoWord(e.currentTarget.value)}
                                            onKeyDown={(e) => addWord('vocabulary_do', newDoWord(), e)}
                                        />
                                    </div>
                                </div>

                                <div class="vocabulary-column vocabulary-dont">
                                    <h3 class="vocabulary-title">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                        Evite
                                    </h3>
                                    <div class="strategy-tags">
                                        <For each={voice().vocabulary_dont}>
                                            {(word) => (
                                                <span class="strategy-tag vocabulary-tag-dont">
                                                    {word}
                                                    <button class="strategy-tag-remove" onClick={() => removeWord('vocabulary_dont', word)}>×</button>
                                                </span>
                                            )}
                                        </For>
                                        <input
                                            type="text"
                                            class="strategy-tag-input"
                                            placeholder="Digite e pressione Enter..."
                                            value={newDontWord()}
                                            onInput={(e) => setNewDontWord(e.currentTarget.value)}
                                            onKeyDown={(e) => addWord('vocabulary_dont', newDontWord(), e)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Show>

                    {/* Estilo */}
                    <Show when={activeTab() === 'style'}>
                        <div class="strategy-section">
                            <h2 class="strategy-section-title">Estilo de Escrita</h2>
                            <p class="strategy-section-description">
                                Guidelines gerais para a comunicação escrita da marca.
                            </p>

                            <div class="strategy-form">
                                <div class="strategy-field">
                                    <label class="strategy-field-label">Diretrizes de Escrita</label>
                                    <p class="strategy-field-description">Como a marca escreve: tom, estrutura, formato.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        style={{ 'min-height': '160px' }}
                                        placeholder="Ex: Use frases curtas e diretas. Prefira voz ativa. Evite jargões técnicos..."
                                        value={voice().writing_style}
                                        onInput={(e) => updateField('writing_style', e.currentTarget.value)}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Regras Gramaticais</label>
                                    <p class="strategy-field-description">Convenções específicas de gramática e pontuação.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: Usar vírgula de Oxford. Evitar exclamações excessivas..."
                                        value={voice().grammar_rules}
                                        onInput={(e) => updateField('grammar_rules', e.currentTarget.value)}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Taglines e Slogans</label>
                                    <p class="strategy-field-description">Frases de efeito da marca (pressione Enter para adicionar).</p>
                                    <div class="strategy-tags">
                                        <For each={voice().taglines}>
                                            {(tagline) => (
                                                <span class="strategy-tag">
                                                    {tagline}
                                                    <button class="strategy-tag-remove" onClick={() => removeTagline(tagline)}>×</button>
                                                </span>
                                            )}
                                        </For>
                                        <input
                                            type="text"
                                            class="strategy-tag-input"
                                            placeholder="Digite uma tagline..."
                                            value={newTagline()}
                                            onInput={(e) => setNewTagline(e.currentTarget.value)}
                                            onKeyDown={addTagline}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Show>

                    {/* Exemplos */}
                    <Show when={activeTab() === 'examples'}>
                        <div class="strategy-section">
                            <h2 class="strategy-section-title">Exemplos de Comunicação</h2>
                            <p class="strategy-section-description">
                                Exemplos práticos de como a marca se comunica em diferentes contextos.
                            </p>

                            <div class="strategy-form">
                                <div class="strategy-field">
                                    <label class="strategy-field-label">Exemplo de Título</label>
                                    <p class="strategy-field-description">Como escrever headlines e títulos.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: 'Transforme seu negócio em 30 dias'"
                                        value={voice().example_headline}
                                        onInput={(e) => updateField('example_headline', e.currentTarget.value)}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Exemplo de Corpo de Texto</label>
                                    <p class="strategy-field-description">Tom e estilo para textos mais longos.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        style={{ 'min-height': '140px' }}
                                        placeholder="Ex: 'Nós acreditamos que cada empresa tem um potencial único...'"
                                        value={voice().example_body}
                                        onInput={(e) => updateField('example_body', e.currentTarget.value)}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Exemplo de Call-to-Action</label>
                                    <p class="strategy-field-description">Como criar CTAs que convertem.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: 'Comece agora — é grátis'"
                                        value={voice().example_cta}
                                        onInput={(e) => updateField('example_cta', e.currentTarget.value)}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Exemplo de Post Social</label>
                                    <p class="strategy-field-description">Tom para redes sociais.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: '✨ Novidade: lançamos a feature que vocês pediram!'"
                                        value={voice().example_social}
                                        onInput={(e) => updateField('example_social', e.currentTarget.value)}
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
