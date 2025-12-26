import { Component, Show, For, createSignal, createEffect } from 'solid-js';
import { supabase } from '../lib/supabase';
import { AppLayout } from '../components/AppLayout';
import { useTimer } from '../contexts/TimerContext';
import { TimeEntryDetailModal } from '../components/TimeEntryDetailModal';
import { CategoryModal } from '../components/CategoryModal';
import { Button } from '../components/ui';
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

// Sentimento options for display
const SENTIMENTO_OPTIONS: { value: SatisfactionLevel; label: string; icon: string }[] = [
    { value: 1, label: 'Negativo', icon: '😞' },
    { value: 2, label: 'Neutro', icon: '😐' },
    { value: 3, label: 'Positivo', icon: '😊' },
];

export const TimesheetPage: Component = () => {
    const timer = useTimer();

    const [entries, setEntries] = createSignal<TimeEntry[]>([]);
    const [loading, setLoading] = createSignal(true);
    const [dateFilter, setDateFilter] = createSignal<'today' | 'week' | 'month' | 'all'>('week');

    // Form fields - Informações Básicas
    const [activityName, setActivityName] = createSignal('');
    const [selectedCategoria, setSelectedCategoria] = createSignal<BioCategoria>('design');
    const [selectedDate, setSelectedDate] = createSignal(new Date().toISOString().split('T')[0]);

    // Detail modal state
    const [selectedEntry, setSelectedEntry] = createSignal<TimeEntry | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = createSignal(false);

    // Category modal state
    const [categories, setCategories] = createSignal<TimeCategory[]>([]);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = createSignal(false);

    // Fetch entries
    const fetchEntries = async () => {
        setLoading(true);
        const now = new Date();
        let startDate: string | undefined;

        switch (dateFilter()) {
            case 'today':
                startDate = now.toISOString().split('T')[0];
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                startDate = weekAgo.toISOString().split('T')[0];
                break;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                startDate = monthAgo.toISOString().split('T')[0];
                break;
        }

        let query = supabase
            .from('time_entries')
            .select('*')
            .order('start_time', { ascending: false });

        if (startDate) {
            query = query.gte('start_time', startDate);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching entries:', error);
        }

        setEntries(data || []);
        setLoading(false);
    };

    createEffect(() => {
        fetchEntries();
        fetchCategories();
    });

    // Fetch categories
    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from('time_categories')
            .select('*')
            .order('is_default', { ascending: false })
            .order('name');

        if (error) {
            console.error('Error fetching categories:', error);
            return;
        }

        setCategories(data || []);

        // Set default selection to first category if none selected
        if (data && data.length > 0 && !selectedCategoria()) {
            setSelectedCategoria(data[0].name);
        }
    };

    // Refetch when timer state changes (checkout completed)
    createEffect(() => {
        if (!timer.activeTimer() && !timer.pendingCheckout()) {
            fetchEntries();
        }
    });

    const handleStartTimer = () => {
        const name = activityName().trim();
        const categoria = selectedCategoria();

        if (!name) {
            alert('Por favor, informe o nome da atividade');
            return;
        }

        timer.startTimer(name, categoria);
        setActivityName(''); // Clear form
    };

    const canStartTimer = () => {
        return activityName().trim().length > 0 && !timer.activeTimer();
    };

    const formatMinutes = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) {
            return m > 0 ? `${h}h ${m}m` : `${h}h`;
        }
        return `${m}m`;
    };

    const getTotalMinutes = () => entries().reduce((sum, e) => sum + (e.duration_minutes || 0), 0);

    const handleDelete = async (id: string) => {
        if (confirm('Excluir este registro?')) {
            await supabase.from('time_entries').delete().eq('id', id);
            setEntries(prev => prev.filter(e => e.id !== id));
            setIsDetailModalOpen(false);
            setSelectedEntry(null);
        }
    };

    const handleEntryClick = (entry: TimeEntry) => {
        setSelectedEntry(entry);
        setIsDetailModalOpen(true);
    };

    const handleEntryUpdate = (updatedEntry: TimeEntry) => {
        setEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
        setSelectedEntry(updatedEntry);
    };

    // Group entries by date (using start_time)
    const entriesByDate = () => {
        const groups: Record<string, TimeEntry[]> = {};
        entries().forEach(entry => {
            const dateStr = entry.start_time
                ? new Date(entry.start_time).toLocaleDateString('pt-BR', {
                    weekday: 'long', day: '2-digit', month: 'long',
                })
                : 'Sem data';
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(entry);
        });
        return Object.entries(groups);
    };

    const getDayTotal = (dayEntries: TimeEntry[]) => dayEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return '';
        return new Date(timeStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <AppLayout>
            <div class="timesheet-page">
                {/* Header */}
                <div class="page-header">
                    <div>
                        <h2 class="page-title">Timesheet</h2>
                        <p class="page-description">Registre e acompanhe suas atividades</p>
                    </div>
                </div>

                {/* Main Form Card */}
                <div class="card timesheet-form-card">
                    {/* Section 1: Informações Básicas */}
                    <div class="timesheet-section">
                        <div class="timesheet-section-header">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <h3>Informações Básicas</h3>
                        </div>

                        <div class="timesheet-form-grid">
                            <div class="form-group">
                                <label class="form-label">Nome da Atividade *</label>
                                <input
                                    type="text"
                                    class="form-input"
                                    placeholder="Ex: Revisão de emails"
                                    value={activityName()}
                                    onInput={(e) => setActivityName(e.currentTarget.value)}
                                    disabled={!!timer.activeTimer()}
                                />
                            </div>

                            <div class="form-group">
                                <label class="form-label">
                                    Categoria *
                                    <button
                                        type="button"
                                        class="category-settings-btn"
                                        onClick={() => setIsCategoryModalOpen(true)}
                                        title="Adicionar nova categoria"
                                    >
                                        <i class="ci-Add"></i>
                                    </button>
                                </label>
                                <select
                                    class="form-input form-select-with-icon"
                                    value={selectedCategoria()}
                                    onChange={(e) => setSelectedCategoria(e.currentTarget.value as BioCategoria)}
                                    disabled={!!timer.activeTimer()}
                                >
                                    <For each={categories()}>
                                        {(cat) => <option value={cat.name}>{cat.icon} {cat.name}</option>}
                                    </For>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Data *</label>
                                <input
                                    type="date"
                                    class="form-input"
                                    value={selectedDate()}
                                    onInput={(e) => setSelectedDate(e.currentTarget.value)}
                                    disabled={!!timer.activeTimer()}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Cronômetro */}
                    <div class="timesheet-section">
                        <div class="timesheet-section-header">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-red)" stroke-width="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <h3>Cronômetro</h3>
                        </div>

                        <div class="timer-display-card">
                            <div class="timer-display-time" classList={{
                                'timer-active': !!timer.activeTimer() && timer.isRunning(),
                                'timer-paused': !!timer.activeTimer() && !timer.isRunning()
                            }}>
                                {timer.formatDuration(timer.elapsedSeconds())}
                            </div>

                            <Show when={timer.activeTimer()}>
                                <div class="timer-active-info">
                                    <span class="timer-active-name">{timer.activeTimer()?.activityName}</span>
                                    <span class="timer-active-categoria">
                                        {categories().find((c: TimeCategory) => c.name === timer.activeTimer()?.categoria)?.icon}
                                    </span>
                                </div>
                            </Show>

                            <Show
                                when={timer.activeTimer()}
                                fallback={
                                    <button
                                        class="btn btn-timer"
                                        classList={{ 'btn-timer-disabled': !canStartTimer() }}
                                        onClick={handleStartTimer}
                                        disabled={!canStartTimer()}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <polygon points="5 3 19 12 5 21 5 3" />
                                        </svg>
                                        {canStartTimer() ? 'Iniciar' : 'Preencha os campos'}
                                    </button>
                                }
                            >
                                <div class="timer-controls">
                                    <Show
                                        when={timer.isRunning()}
                                        fallback={
                                            <button class="btn btn-timer btn-timer-resume" onClick={timer.resumeTimer}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                    <polygon points="5 3 19 12 5 21 5 3" />
                                                </svg>
                                                Retomar
                                            </button>
                                        }
                                    >
                                        <button class="btn btn-timer btn-timer-pause" onClick={timer.pauseTimer}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <rect x="6" y="4" width="4" height="16" />
                                                <rect x="14" y="4" width="4" height="16" />
                                            </svg>
                                            Pausar
                                        </button>
                                    </Show>
                                    <button class="btn btn-timer btn-timer-stop" onClick={timer.requestCheckout}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                            <rect x="4" y="4" width="16" height="16" rx="2" />
                                        </svg>
                                        Finalizar
                                    </button>
                                </div>
                            </Show>
                        </div>
                    </div>
                </div>

                {/* Stats Dashboard */}
                <Show when={dateFilter() === 'week'}>
                    <div class="bio-dashboard">
                        <div class="bio-stat-card">
                            <div class="bio-stat-value">{formatMinutes(getTotalMinutes())}</div>
                            <div class="bio-stat-label">Horas Semana</div>
                        </div>
                        <div class="bio-stat-card">
                            <div class="bio-stat-value">{entries().length}</div>
                            <div class="bio-stat-label">Atividades</div>
                        </div>
                        <div class="bio-stat-card">
                            <div class="bio-stat-value">
                                {entries().length > 0 ? formatMinutes(Math.floor(getTotalMinutes() / entries().length)) : '0m'}
                            </div>
                            <div class="bio-stat-label">Média Duração</div>
                        </div>
                    </div>
                </Show>

                {/* Filters */}
                <div class="filter-bar" style={{ "justify-content": "space-between", "margin-top": "var(--spacing-4)" }}>
                    <div class="view-tabs">
                        <button class="view-tab" classList={{ active: dateFilter() === 'today' }} onClick={() => setDateFilter('today')}>
                            Hoje
                        </button>
                        <button class="view-tab" classList={{ active: dateFilter() === 'week' }} onClick={() => setDateFilter('week')}>
                            Semana
                        </button>
                        <button class="view-tab" classList={{ active: dateFilter() === 'month' }} onClick={() => setDateFilter('month')}>
                            Mês
                        </button>
                        <button class="view-tab" classList={{ active: dateFilter() === 'all' }} onClick={() => setDateFilter('all')}>
                            Tudo
                        </button>
                    </div>

                    <div class="section-title" style={{ margin: 0 }}>
                        Total: {formatMinutes(getTotalMinutes())}
                    </div>
                </div>

                {/* Entries List */}
                <Show
                    when={!loading()}
                    fallback={
                        <div class="loading-container">
                            <div class="spinner spinner-lg" />
                        </div>
                    }
                >
                    <Show
                        when={entries().length > 0}
                        fallback={
                            <div class="empty-state">
                                <div class="empty-state-icon">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                </div>
                                <h3 class="empty-state-title">Nenhum registro de tempo</h3>
                                <p class="empty-state-description">
                                    Preencha os dados acima e inicie o cronômetro para registrar.
                                </p>
                            </div>
                        }
                    >
                        <For each={entriesByDate()}>
                            {([date, dayEntries]) => (
                                <div class="timesheet-day-group">
                                    <div class="timesheet-day-header">
                                        <span class="timesheet-day-date">{date}</span>
                                        <span class="timesheet-day-total">{formatMinutes(getDayTotal(dayEntries))}</span>
                                    </div>
                                    <div class="timesheet-entries">
                                        <For each={dayEntries}>
                                            {(entry) => (
                                                <div
                                                    class="timesheet-entry timesheet-entry-clickable"
                                                    onClick={() => handleEntryClick(entry)}
                                                >
                                                    <div class="timesheet-entry-main">
                                                        <div class="timesheet-entry-task">
                                                            {entry.activity_name || entry.description || 'Atividade sem nome'}
                                                        </div>
                                                        <div class="timesheet-entry-project">
                                                            {formatTime(entry.start_time)} - {formatTime(entry.end_time ?? undefined)}
                                                            <Show when={entry.description}>
                                                                <span style={{ "margin-left": "var(--spacing-2)", opacity: 0.7 }}>
                                                                    • {entry.description}
                                                                </span>
                                                            </Show>
                                                        </div>
                                                    </div>
                                                    <div class="timesheet-entry-meta">
                                                        <Show when={entry.categoria}>
                                                            <span class="timesheet-entry-tag">
                                                                {categories().find((c: TimeCategory) => c.name === entry.categoria)?.icon}
                                                                {entry.categoria}
                                                            </span>
                                                        </Show>
                                                        <Show when={entry.satisfacao}>
                                                            <span class="timesheet-entry-tag">
                                                                {SENTIMENTO_OPTIONS.find(s => s.value === entry.satisfacao)?.icon}
                                                            </span>
                                                        </Show>
                                                    </div>
                                                    <div class="timesheet-entry-hours">
                                                        {formatMinutes(entry.duration_minutes || 0)}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e: MouseEvent) => {
                                                            e.stopPropagation();
                                                            handleDelete(entry.id);
                                                        }}
                                                        icon={<i class="ci-Trash_Empty"></i>}
                                                    />
                                                </div>
                                            )}
                                        </For>
                                    </div>
                                </div>
                            )}
                        </For>
                    </Show>
                </Show>

                {/* Detail Modal */}
                <TimeEntryDetailModal
                    entry={selectedEntry()}
                    isOpen={isDetailModalOpen()}
                    onClose={() => {
                        setIsDetailModalOpen(false);
                        setSelectedEntry(null);
                    }}
                    onUpdate={handleEntryUpdate}
                    onDelete={handleDelete}
                />

                {/* Category Modal */}
                <CategoryModal
                    isOpen={isCategoryModalOpen()}
                    onClose={() => setIsCategoryModalOpen(false)}
                    onCategoryAdded={(category) => {
                        setCategories(prev => [...prev, category]);
                        setSelectedCategoria(category.name);
                    }}
                    categories={categories()}
                />
            </div>
        </AppLayout>
    );
};
