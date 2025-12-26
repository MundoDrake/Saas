import { Component, Show, For, createSignal, createEffect, createMemo } from 'solid-js';
import { supabase } from '../lib/supabase';
import { AppLayout } from '../components/AppLayout';
import { BarChart } from '../components/BarChart';

interface TimeEntry {
    id: string;
    project_id: string;
    task_id: string | null;
    description: string;
    duration: number;
    start_time: string;
    end_time: string | null;
    projects?: { name: string; client_id?: string };
}

interface Project {
    id: string;
    name: string;
}

export const ReportsTimesheetPage: Component = () => {
    const [loading, setLoading] = createSignal(true);
    const [entries, setEntries] = createSignal<TimeEntry[]>([]);
    const [projects, setProjects] = createSignal<Project[]>([]);

    // Filters
    const [period, setPeriod] = createSignal<'week' | 'month' | 'quarter'>('month');
    const [selectedProject, setSelectedProject] = createSignal<string>('all');

    // Calculate date range
    const dateRange = createMemo(() => {
        const now = new Date();
        let start: Date;
        let end: Date = now;

        switch (period()) {
            case 'week':
                start = new Date(now);
                start.setDate(now.getDate() - 7);
                break;
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                start = new Date(now.getFullYear(), quarter * 3, 1);
                break;
            default:
                start = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        return { start, end };
    });

    // Load data
    createEffect(async () => {
        setLoading(true);
        try {
            const { start, end } = dateRange();

            // Get projects for filter
            const { data: projectsData } = await supabase
                .from('projects')
                .select('id, name')
                .order('name');

            if (projectsData) {
                setProjects(projectsData);
            }

            // Build query
            let query = supabase
                .from('time_entries')
                .select('*, projects(name)')
                .gte('start_time', start.toISOString())
                .lte('start_time', end.toISOString())
                .order('start_time', { ascending: false });

            if (selectedProject() !== 'all') {
                query = query.eq('project_id', selectedProject());
            }

            const { data } = await query;

            if (data) {
                setEntries(data);
            }
        } catch (error) {
            console.error('Error loading timesheet:', error);
        } finally {
            setLoading(false);
        }
    });

    // Calculate summary
    const summary = createMemo(() => {
        const all = entries();
        const totalMinutes = all.reduce((sum, e) => sum + (e.duration || 0), 0);
        const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
        const totalDays = Math.round(totalHours / 8 * 10) / 10;

        return { totalMinutes, totalHours, totalDays, entriesCount: all.length };
    });

    // Chart data - hours per day
    const chartData = createMemo(() => {
        const byDay: Record<string, number> = {};
        const all = entries();

        all.forEach(e => {
            const date = new Date(e.start_time).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
            byDay[date] = (byDay[date] || 0) + (e.duration || 0);
        });

        return Object.entries(byDay)
            .slice(-7)
            .map(([label, minutes]) => ({
                label,
                value: Math.round(minutes / 60 * 10) / 10,
                color: 'var(--color-blue)',
            }));
    });

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
        });
    };

    return (
        <AppLayout>
            <div class="page-header">
                <div>
                    <h2 class="page-title">Relatório de Horas</h2>
                    <p class="page-description">
                        Acompanhe o tempo investido em projetos.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div class="report-filters">
                <div class="report-filter">
                    <span class="report-filter-label">Período</span>
                    <select
                        class="form-input report-filter-select"
                        value={period()}
                        onChange={(e) => setPeriod(e.currentTarget.value as any)}
                    >
                        <option value="week">Última Semana</option>
                        <option value="month">Este Mês</option>
                        <option value="quarter">Este Trimestre</option>
                    </select>
                </div>

                <div class="report-filter">
                    <span class="report-filter-label">Projeto</span>
                    <select
                        class="form-input report-filter-select"
                        value={selectedProject()}
                        onChange={(e) => setSelectedProject(e.currentTarget.value)}
                    >
                        <option value="all">Todos os Projetos</option>
                        <For each={projects()}>
                            {(project) => (
                                <option value={project.id}>{project.name}</option>
                            )}
                        </For>
                    </select>
                </div>
            </div>

            <Show when={!loading()} fallback={<div class="spinner spinner-lg" style={{ margin: '2rem auto' }} />}>
                {/* Summary */}
                <div class="report-summary">
                    <div class="report-summary-item">
                        <div class="report-summary-label">Total de Horas</div>
                        <div class="report-summary-value">{summary().totalHours}h</div>
                    </div>
                    <div class="report-summary-item">
                        <div class="report-summary-label">Dias Equivalentes</div>
                        <div class="report-summary-value">{summary().totalDays}d</div>
                    </div>
                    <div class="report-summary-item">
                        <div class="report-summary-label">Registros</div>
                        <div class="report-summary-value">{summary().entriesCount}</div>
                    </div>
                </div>

                {/* Chart */}
                <div class="chart-card" style={{ 'margin-bottom': 'var(--spacing-6)' }}>
                    <h3 class="chart-card-title">Horas por Dia</h3>
                    <BarChart
                        data={chartData()}
                        height={200}
                        formatValue={(v) => `${v}h`}
                    />
                </div>

                {/* Table */}
                <div class="report-table-container">
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Projeto</th>
                                <th>Descrição</th>
                                <th style={{ 'text-align': 'right' }}>Duração</th>
                            </tr>
                        </thead>
                        <tbody>
                            <For each={entries()}>
                                {(entry) => (
                                    <tr>
                                        <td>{formatDate(entry.start_time)}</td>
                                        <td>{entry.projects?.name || '-'}</td>
                                        <td>{entry.description || '-'}</td>
                                        <td style={{ 'text-align': 'right', 'font-weight': '500' }}>
                                            {formatDuration(entry.duration)}
                                        </td>
                                    </tr>
                                )}
                            </For>
                            <Show when={entries().length === 0}>
                                <tr>
                                    <td colspan="4" style={{ 'text-align': 'center', padding: 'var(--spacing-6)', color: 'var(--color-text-muted)' }}>
                                        Nenhum registro encontrado no período.
                                    </td>
                                </tr>
                            </Show>
                        </tbody>
                    </table>
                </div>
            </Show>
        </AppLayout>
    );
};
