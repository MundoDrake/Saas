import { Component, Show, createSignal, createEffect, For } from 'solid-js';
import { supabase } from '../lib/supabase';
import { Button } from './ui';
import type { BioCategoria, EnergyLevel, SatisfactionLevel, TimeCategory } from '../types/database';

interface TimeEntry {
    id: string;
    user_id: string;
    description: string | null;
    activity_name?: string | null;
    created_at: string;
    categoria?: BioCategoria;
    energia?: EnergyLevel | null;
    satisfacao?: SatisfactionLevel | null;
    start_time: string;
    end_time?: string | null;
    duration_minutes?: number | null;
}

interface TimeEntryDetailModalProps {
    entry: TimeEntry | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (entry: TimeEntry) => void;
    onDelete: (id: string) => void;
}

const ENERGIA_OPTIONS: { value: EnergyLevel; label: string; icon: string }[] = [
    { value: 1, label: 'Baixa', icon: '🟢' },
    { value: 2, label: 'Média', icon: '🟡' },
    { value: 3, label: 'Alta', icon: '🔴' },
];

const SATISFACAO_OPTIONS: { value: SatisfactionLevel; label: string; icon: string }[] = [
    { value: 1, label: 'Negativo', icon: '😞' },
    { value: 2, label: 'Neutro', icon: '😐' },
    { value: 3, label: 'Positivo', icon: '😊' },
];

export const TimeEntryDetailModal: Component<TimeEntryDetailModalProps> = (props) => {
    const [isEditing, setIsEditing] = createSignal(false);
    const [saving, setSaving] = createSignal(false);

    // Form state
    const [activityName, setActivityName] = createSignal('');
    const [description, setDescription] = createSignal('');
    const [categoria, setCategoria] = createSignal<BioCategoria>('outros');
    const [energia, setEnergia] = createSignal<EnergyLevel | null>(null);
    const [satisfacao, setSatisfacao] = createSignal<SatisfactionLevel | null>(null);
    const [categories, setCategories] = createSignal<TimeCategory[]>([]);

    // Sync form with entry when it changes
    createEffect(() => {
        const entry = props.entry;
        if (entry) {
            setActivityName(entry.activity_name || '');
            setDescription(entry.description || '');
            setCategoria(entry.categoria || 'Outros');
            setEnergia(entry.energia || null);
            setSatisfacao(entry.satisfacao || null);
        }
    });

    // Fetch categories
    createEffect(async () => {
        const { data } = await supabase
            .from('time_categories')
            .select('*')
            .order('is_default', { ascending: false })
            .order('name');
        setCategories(data || []);
    });

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDuration = (minutes: number | null | undefined) => {
        if (!minutes) return '0m';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) {
            return m > 0 ? `${h}h ${m}m` : `${h}h`;
        }
        return `${m}m`;
    };

    const handleSave = async () => {
        if (!props.entry) return;

        setSaving(true);
        try {
            const { data, error } = await supabase
                .from('time_entries')
                .update({
                    activity_name: activityName(),
                    description: description() || null,
                    categoria: categoria(),
                    energia: energia(),
                    satisfacao: satisfacao(),
                })
                .eq('id', props.entry.id)
                .select()
                .single();

            if (error) {
                console.error('Error updating:', error);
                alert('Erro ao salvar: ' + error.message);
            } else if (data) {
                props.onUpdate(data);
                setIsEditing(false);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        if (!props.entry) return;
        if (confirm('Tem certeza que deseja excluir este registro?')) {
            props.onDelete(props.entry.id);
        }
    };

    const handleClose = () => {
        setIsEditing(false);
        props.onClose();
    };

    return (
        <Show when={props.isOpen && props.entry}>
            <div class="modal-overlay" onClick={handleClose}>
                <div class="modal time-entry-detail-modal" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div class="modal-header">
                        <h3 class="modal-title">
                            {isEditing() ? 'Editar Registro' : 'Detalhes do Registro'}
                        </h3>
                        <button class="modal-close" onClick={handleClose}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <div class="modal-body">
                        {/* Duration Banner */}
                        <div class="detail-duration-banner">
                            <span class="detail-duration-value">
                                {formatDuration(props.entry?.duration_minutes)}
                            </span>
                            <span class="detail-duration-label">Duração Total</span>
                        </div>

                        {/* Time Info */}
                        <div class="detail-time-info">
                            <div class="detail-time-row">
                                <span class="detail-time-icon">📅</span>
                                <span>{formatDate(props.entry!.start_time)}</span>
                            </div>
                            <div class="detail-time-row">
                                <span class="detail-time-icon">🕐</span>
                                <span>
                                    {formatTime(props.entry!.start_time)}
                                    {props.entry?.end_time && ` - ${formatTime(props.entry.end_time)}`}
                                </span>
                            </div>
                        </div>

                        {/* Editable Fields */}
                        <div class="detail-section">
                            <label class="detail-label">Nome da Atividade</label>
                            <Show
                                when={isEditing()}
                                fallback={
                                    <div class="detail-value">{props.entry?.activity_name || '-'}</div>
                                }
                            >
                                <input
                                    type="text"
                                    class="form-input"
                                    value={activityName()}
                                    onInput={(e) => setActivityName(e.currentTarget.value)}
                                />
                            </Show>
                        </div>

                        <div class="detail-section">
                            <label class="detail-label">Categoria</label>
                            <Show
                                when={isEditing()}
                                fallback={
                                    <div class="detail-value detail-tag">
                                        {categories().find(c => c.name === props.entry?.categoria)?.icon || '📋'}
                                        {' '}
                                        {props.entry?.categoria || '-'}
                                    </div>
                                }
                            >
                                <div class="detail-options">
                                    <For each={categories()}>
                                        {(cat) => (
                                            <button
                                                type="button"
                                                class="detail-option"
                                                classList={{ active: categoria() === cat.name }}
                                                onClick={() => setCategoria(cat.name)}
                                            >
                                                <span>{cat.icon}</span>
                                                <span>{cat.name}</span>
                                            </button>
                                        )}
                                    </For>
                                </div>
                            </Show>
                        </div>

                        <div class="detail-grid">
                            <div class="detail-section">
                                <label class="detail-label">Energia Gasta</label>
                                <Show
                                    when={isEditing()}
                                    fallback={
                                        <div class="detail-value detail-tag">
                                            {ENERGIA_OPTIONS.find(e => e.value === props.entry?.energia)?.icon || '—'}
                                            {' '}
                                            {ENERGIA_OPTIONS.find(e => e.value === props.entry?.energia)?.label || '-'}
                                        </div>
                                    }
                                >
                                    <div class="detail-options">
                                        {ENERGIA_OPTIONS.map(opt => (
                                            <button
                                                type="button"
                                                class="detail-option"
                                                classList={{ active: energia() === opt.value }}
                                                onClick={() => setEnergia(opt.value)}
                                            >
                                                <span>{opt.icon}</span>
                                                <span>{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </Show>
                            </div>

                            <div class="detail-section">
                                <label class="detail-label">Sentimento</label>
                                <Show
                                    when={isEditing()}
                                    fallback={
                                        <div class="detail-value detail-tag">
                                            {SATISFACAO_OPTIONS.find(s => s.value === props.entry?.satisfacao)?.icon || '—'}
                                            {' '}
                                            {SATISFACAO_OPTIONS.find(s => s.value === props.entry?.satisfacao)?.label || '-'}
                                        </div>
                                    }
                                >
                                    <div class="detail-options">
                                        {SATISFACAO_OPTIONS.map(opt => (
                                            <button
                                                type="button"
                                                class="detail-option"
                                                classList={{ active: satisfacao() === opt.value }}
                                                onClick={() => setSatisfacao(opt.value)}
                                            >
                                                <span>{opt.icon}</span>
                                                <span>{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </Show>
                            </div>
                        </div>

                        <div class="detail-section">
                            <label class="detail-label">Observações</label>
                            <Show
                                when={isEditing()}
                                fallback={
                                    <div class="detail-value detail-description">
                                        {props.entry?.description || 'Nenhuma observação'}
                                    </div>
                                }
                            >
                                <textarea
                                    class="form-input"
                                    rows={3}
                                    value={description()}
                                    onInput={(e) => setDescription(e.currentTarget.value)}
                                    placeholder="Adicione observações..."
                                />
                            </Show>
                        </div>
                    </div>

                    {/* Footer */}
                    <div class="modal-footer">
                        <Button variant="danger" onClick={handleDelete} icon={<i class="ci-Trash_Empty"></i>}>
                            Excluir
                        </Button>
                        <div style={{ flex: 1 }} />
                        <Show
                            when={isEditing()}
                            fallback={
                                <Button variant="primary" onClick={() => setIsEditing(true)} icon={<i class="ci-Edit_Pencil_01"></i>}>
                                    Editar
                                </Button>
                            }
                        >
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>
                                Cancelar
                            </Button>
                            <Button variant="primary" onClick={handleSave} loading={saving()}>
                                Salvar
                            </Button>
                        </Show>
                    </div>
                </div>
            </div>
        </Show>
    );
};
