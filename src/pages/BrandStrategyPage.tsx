import { Component, Show, For, createSignal, createEffect } from 'solid-js';
import { useParams } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import { ProjectLayout } from '../components/ProjectLayout';

// Arquétipos de Jung
const ARCHETYPES = [
    { id: 'innocent', name: 'Inocente', icon: '😇' },
    { id: 'sage', name: 'Sábio', icon: '🧙' },
    { id: 'explorer', name: 'Explorador', icon: '🧭' },
    { id: 'outlaw', name: 'Fora-da-Lei', icon: '🏴‍☠️' },
    { id: 'magician', name: 'Mago', icon: '✨' },
    { id: 'hero', name: 'Herói', icon: '⚔️' },
    { id: 'lover', name: 'Amante', icon: '❤️' },
    { id: 'jester', name: 'Bobo', icon: '🃏' },
    { id: 'everyman', name: 'Cara Comum', icon: '👤' },
    { id: 'caregiver', name: 'Cuidador', icon: '🤲' },
    { id: 'ruler', name: 'Governante', icon: '👑' },
    { id: 'creator', name: 'Criador', icon: '🎨' },
];

interface BrandStrategy {
    id?: string;
    project_id: string;
    mission: string;
    vision: string;
    values: string[];
    purpose: string;
    what_we_do: string;
    differential: string;
    brand_story: string;
    manifesto: string;
    brand_promise: string;
    golden_why: string;
    golden_how: string;
    golden_what: string;
    archetypes: string[];
    target_audience: {
        demographics?: string;
        psychographics?: string;
        pain_points?: string;
        desires?: string;
    };
    original_briefing: string;
}

type TabId = 'pillars' | 'positioning' | 'storytelling' | 'golden' | 'personality';

const TABS: { id: TabId; label: string }[] = [
    { id: 'pillars', label: 'Pilares' },
    { id: 'positioning', label: 'Posicionamento' },
    { id: 'storytelling', label: 'Storytelling' },
    { id: 'golden', label: 'Golden Circle' },
    { id: 'personality', label: 'Personalidade' },
];

const defaultStrategy: Omit<BrandStrategy, 'project_id'> = {
    mission: '',
    vision: '',
    values: [],
    purpose: '',
    what_we_do: '',
    differential: '',
    brand_story: '',
    manifesto: '',
    brand_promise: '',
    golden_why: '',
    golden_how: '',
    golden_what: '',
    archetypes: [],
    target_audience: {},
    original_briefing: '',
};

export const BrandStrategyPage: Component = () => {
    const params = useParams();

    const [activeTab, setActiveTab] = createSignal<TabId>('pillars');
    const [strategy, setStrategy] = createSignal<BrandStrategy>({
        ...defaultStrategy,
        project_id: params.id || '',
    });
    const [loading, setLoading] = createSignal(true);
    const [saving, setSaving] = createSignal(false);
    const [saveStatus, setSaveStatus] = createSignal<'idle' | 'saving' | 'saved'>('idle');
    const [newValue, setNewValue] = createSignal('');
    const [activeGoldenRing, setActiveGoldenRing] = createSignal<'why' | 'how' | 'what'>('why');

    // Load strategy
    createEffect(async () => {
        try {
            const { data, error } = await supabase
                .from('brand_strategies')
                .select('*')
                .eq('project_id', params.id)
                .single();

            if (data) {
                setStrategy({ ...defaultStrategy, ...data });
            }
        } catch (error) {
            // No existing strategy - will create on first save
        } finally {
            setLoading(false);
        }
    });

    // Auto-save with debounce
    let saveTimeout: number;
    const saveStrategy = async () => {
        setSaving(true);
        setSaveStatus('saving');

        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
            try {
                const data = strategy();

                if (data.id) {
                    await supabase
                        .from('brand_strategies')
                        .update({
                            mission: data.mission,
                            vision: data.vision,
                            values: data.values,
                            purpose: data.purpose,
                            what_we_do: data.what_we_do,
                            differential: data.differential,
                            brand_story: data.brand_story,
                            manifesto: data.manifesto,
                            brand_promise: data.brand_promise,
                            golden_why: data.golden_why,
                            golden_how: data.golden_how,
                            golden_what: data.golden_what,
                            archetypes: data.archetypes,
                            target_audience: data.target_audience,
                            original_briefing: data.original_briefing,
                        })
                        .eq('id', data.id);
                } else {
                    const { data: newData, error } = await supabase
                        .from('brand_strategies')
                        .insert(data)
                        .select()
                        .single();

                    if (newData) {
                        setStrategy(prev => ({ ...prev, id: newData.id }));
                    }
                }

                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error('Error saving strategy:', error);
            } finally {
                setSaving(false);
            }
        }, 1000);
    };

    const updateField = (field: keyof BrandStrategy, value: any) => {
        setStrategy(prev => ({ ...prev, [field]: value }));
        saveStrategy();
    };

    const addValue = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && newValue().trim()) {
            e.preventDefault();
            const current = strategy().values || [];
            if (!current.includes(newValue().trim())) {
                updateField('values', [...current, newValue().trim()]);
            }
            setNewValue('');
        }
    };

    const removeValue = (value: string) => {
        updateField('values', strategy().values.filter(v => v !== value));
    };

    const toggleArchetype = (id: string) => {
        const current = strategy().archetypes || [];
        if (current.includes(id)) {
            updateField('archetypes', current.filter(a => a !== id));
        } else if (current.length < 3) {
            updateField('archetypes', [...current, id]);
        }
    };

    return (
        <ProjectLayout>
            <div class="brand-strategy-page">
                {/* Header */}
                <div class="brand-strategy-header">
                    <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'flex-start' }}>
                        <div>
                            <h1 class="brand-strategy-title">Estratégia de Marca</h1>
                            <p class="brand-strategy-description">
                                Defina os fundamentos estratégicos que guiarão toda a identidade da marca.
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
                    {/* Pilares Estratégicos */}
                    <Show when={activeTab() === 'pillars'}>
                        <div class="strategy-section">
                            <h2 class="strategy-section-title">Pilares Estratégicos</h2>
                            <p class="strategy-section-description">
                                Os fundamentos que definem a essência e direção da marca.
                            </p>

                            <div class="strategy-form">
                                <div class="strategy-field">
                                    <label class="strategy-field-label">Missão</label>
                                    <p class="strategy-field-description">O propósito da empresa - por que ela existe?</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: Democratizar o acesso à educação de qualidade..."
                                        value={strategy().mission}
                                        onInput={(e) => updateField('mission', e.currentTarget.value)}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Visão</label>
                                    <p class="strategy-field-description">Onde a empresa quer chegar? O futuro desejado.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: Ser a maior plataforma de ensino da América Latina..."
                                        value={strategy().vision}
                                        onInput={(e) => updateField('vision', e.currentTarget.value)}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Valores</label>
                                    <p class="strategy-field-description">Princípios que guiam as ações (pressione Enter para adicionar)</p>
                                    <div class="strategy-tags">
                                        <For each={strategy().values}>
                                            {(value) => (
                                                <span class="strategy-tag">
                                                    {value}
                                                    <button class="strategy-tag-remove" onClick={() => removeValue(value)}>×</button>
                                                </span>
                                            )}
                                        </For>
                                        <input
                                            type="text"
                                            class="strategy-tag-input"
                                            placeholder="Digite um valor..."
                                            value={newValue()}
                                            onInput={(e) => setNewValue(e.currentTarget.value)}
                                            onKeyDown={addValue}
                                        />
                                    </div>
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Propósito</label>
                                    <p class="strategy-field-description">A razão mais profunda de existir - o impacto que quer causar.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: Transformar vidas através do conhecimento..."
                                        value={strategy().purpose}
                                        onInput={(e) => updateField('purpose', e.currentTarget.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </Show>

                    {/* Posicionamento */}
                    <Show when={activeTab() === 'positioning'}>
                        <div class="strategy-section">
                            <h2 class="strategy-section-title">Posicionamento de Mercado</h2>
                            <p class="strategy-section-description">
                                Como a marca se posiciona frente à concorrência.
                            </p>

                            <div class="strategy-form">
                                <div class="strategy-field">
                                    <label class="strategy-field-label">O que fazemos</label>
                                    <p class="strategy-field-description">Descrição clara do produto ou serviço oferecido.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: Oferecemos cursos online de tecnologia..."
                                        value={strategy().what_we_do}
                                        onInput={(e) => updateField('what_we_do', e.currentTarget.value)}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Diferencial Competitivo</label>
                                    <p class="strategy-field-description">O que torna a marca única e superior aos concorrentes?</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: Metodologia prática com projetos reais e mentoria individual..."
                                        value={strategy().differential}
                                        onInput={(e) => updateField('differential', e.currentTarget.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </Show>

                    {/* Storytelling */}
                    <Show when={activeTab() === 'storytelling'}>
                        <div class="strategy-section">
                            <h2 class="strategy-section-title">Storytelling</h2>
                            <p class="strategy-section-description">
                                A narrativa que conecta emocionalmente com o público.
                            </p>

                            <div class="strategy-form">
                                <div class="strategy-field">
                                    <label class="strategy-field-label">História da Marca</label>
                                    <p class="strategy-field-description">A origem e jornada da empresa.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        style={{ 'min-height': '160px' }}
                                        placeholder="Ex: Tudo começou em 2020, quando dois amigos..."
                                        value={strategy().brand_story}
                                        onInput={(e) => updateField('brand_story', e.currentTarget.value)}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Manifesto</label>
                                    <p class="strategy-field-description">Declaração inspiradora sobre o que a marca acredita.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        style={{ 'min-height': '160px' }}
                                        placeholder="Ex: Acreditamos que todo ser humano merece..."
                                        value={strategy().manifesto}
                                        onInput={(e) => updateField('manifesto', e.currentTarget.value)}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Promessa da Marca</label>
                                    <p class="strategy-field-description">O compromisso que a marca faz com seus clientes.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: Prometemos simplificar sua vida financeira..."
                                        value={strategy().brand_promise}
                                        onInput={(e) => updateField('brand_promise', e.currentTarget.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </Show>

                    {/* Golden Circle */}
                    <Show when={activeTab() === 'golden'}>
                        <div class="strategy-section">
                            <h2 class="strategy-section-title">Golden Circle</h2>
                            <p class="strategy-section-description">
                                Framework de Simon Sinek: comece pelo porquê.
                            </p>

                            <div class="golden-circle-container">
                                <div class="golden-circle-visual">
                                    <div
                                        class="golden-circle-ring golden-circle-why"
                                        classList={{ active: activeGoldenRing() === 'why' }}
                                        onClick={() => setActiveGoldenRing('why')}
                                    >
                                        <span class="golden-circle-label">Why</span>
                                    </div>
                                    <div
                                        class="golden-circle-ring golden-circle-how"
                                        classList={{ active: activeGoldenRing() === 'how' }}
                                        onClick={() => setActiveGoldenRing('how')}
                                    >
                                        <span class="golden-circle-label">How</span>
                                    </div>
                                    <div
                                        class="golden-circle-ring golden-circle-what"
                                        classList={{ active: activeGoldenRing() === 'what' }}
                                        onClick={() => setActiveGoldenRing('what')}
                                    >
                                        <span class="golden-circle-label">What</span>
                                    </div>
                                </div>

                                <div class="golden-circle-forms">
                                    <Show when={activeGoldenRing() === 'why'}>
                                        <div class="strategy-field">
                                            <label class="strategy-field-label">Porquê (Why)</label>
                                            <p class="strategy-field-description">A causa, crença ou propósito que inspira a ação.</p>
                                            <textarea
                                                class="strategy-textarea"
                                                placeholder="Ex: Acreditamos que a criatividade transforma o mundo..."
                                                value={strategy().golden_why}
                                                onInput={(e) => updateField('golden_why', e.currentTarget.value)}
                                            />
                                        </div>
                                    </Show>

                                    <Show when={activeGoldenRing() === 'how'}>
                                        <div class="strategy-field">
                                            <label class="strategy-field-label">Como (How)</label>
                                            <p class="strategy-field-description">O processo ou metodologia que diferencia a empresa.</p>
                                            <textarea
                                                class="strategy-textarea"
                                                placeholder="Ex: Através de uma metodologia baseada em experiências reais..."
                                                value={strategy().golden_how}
                                                onInput={(e) => updateField('golden_how', e.currentTarget.value)}
                                            />
                                        </div>
                                    </Show>

                                    <Show when={activeGoldenRing() === 'what'}>
                                        <div class="strategy-field">
                                            <label class="strategy-field-label">O quê (What)</label>
                                            <p class="strategy-field-description">O produto ou serviço entregue ao mercado.</p>
                                            <textarea
                                                class="strategy-textarea"
                                                placeholder="Ex: Oferecemos cursos, mentorias e ferramentas digitais..."
                                                value={strategy().golden_what}
                                                onInput={(e) => updateField('golden_what', e.currentTarget.value)}
                                            />
                                        </div>
                                    </Show>
                                </div>
                            </div>
                        </div>
                    </Show>

                    {/* Personalidade */}
                    <Show when={activeTab() === 'personality'}>
                        <div class="strategy-section">
                            <h2 class="strategy-section-title">Personalidade e Público</h2>
                            <p class="strategy-section-description">
                                Defina a personalidade da marca e quem é o público-alvo.
                            </p>

                            <div class="strategy-form">
                                <div class="strategy-field">
                                    <label class="strategy-field-label">Arquétipos de Marca</label>
                                    <p class="strategy-field-description">Selecione até 3 arquétipos que representam a personalidade da marca.</p>
                                    <div class="archetypes-grid">
                                        <For each={ARCHETYPES}>
                                            {(archetype) => (
                                                <div
                                                    class="archetype-card"
                                                    classList={{ selected: strategy().archetypes?.includes(archetype.id) }}
                                                    onClick={() => toggleArchetype(archetype.id)}
                                                >
                                                    <span class="archetype-icon">{archetype.icon}</span>
                                                    <span class="archetype-name">{archetype.name}</span>
                                                </div>
                                            )}
                                        </For>
                                    </div>
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Público-Alvo: Demografia</label>
                                    <p class="strategy-field-description">Idade, gênero, localização, renda.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: Jovens de 25-35 anos, classe média, grandes centros urbanos..."
                                        value={strategy().target_audience?.demographics || ''}
                                        onInput={(e) => updateField('target_audience', {
                                            ...strategy().target_audience,
                                            demographics: e.currentTarget.value
                                        })}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Público-Alvo: Psicografia</label>
                                    <p class="strategy-field-description">Valores, interesses, estilo de vida.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: Valorizam experiências sobre bens materiais, são conectados digitalmente..."
                                        value={strategy().target_audience?.psychographics || ''}
                                        onInput={(e) => updateField('target_audience', {
                                            ...strategy().target_audience,
                                            psychographics: e.currentTarget.value
                                        })}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Dores do Cliente</label>
                                    <p class="strategy-field-description">Problemas e frustrações que o público enfrenta.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: Falta de tempo, dificuldade em encontrar soluções confiáveis..."
                                        value={strategy().target_audience?.pain_points || ''}
                                        onInput={(e) => updateField('target_audience', {
                                            ...strategy().target_audience,
                                            pain_points: e.currentTarget.value
                                        })}
                                    />
                                </div>

                                <div class="strategy-field">
                                    <label class="strategy-field-label">Desejos do Cliente</label>
                                    <p class="strategy-field-description">O que o público aspira e deseja alcançar.</p>
                                    <textarea
                                        class="strategy-textarea"
                                        placeholder="Ex: Crescimento profissional, reconhecimento, liberdade financeira..."
                                        value={strategy().target_audience?.desires || ''}
                                        onInput={(e) => updateField('target_audience', {
                                            ...strategy().target_audience,
                                            desires: e.currentTarget.value
                                        })}
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
