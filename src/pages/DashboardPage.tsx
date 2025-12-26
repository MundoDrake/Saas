import { Component, Show, For, createSignal, createEffect, createMemo } from 'solid-js';
import { A } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import { useProfileContext } from '../contexts/ProfileContext';
import { AppLayout } from '../components/AppLayout';
import { RadarChart } from '../components/RadarChart';
import { DonutChart } from '../components/DonutChart';
import { BarChart } from '../components/BarChart';
import { Button, Badge } from '../components/ui';
import type { Project, Task, Client, TaskStatus, ProjectStatus } from '../types/database';

// Colors for charts
const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
    draft: 'var(--color-gray)',
    active: 'var(--color-green)',
    paused: 'var(--color-orange)',
    completed: 'var(--color-blue)',
    cancelled: 'var(--color-red)',
};

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
    draft: 'Rascunho',
    active: 'Ativo',
    paused: 'Pausado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
};

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
    backlog: 'Backlog',
    todo: 'A Fazer',
    in_progress: 'Em Progresso',
    review: 'Revisão',
    done: 'Concluído',
};

interface DashboardStats {
    totalProjects: number;
    activeProjects: number;
    totalClients: number;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    projectsByStatus: Record<ProjectStatus, number>;
    tasksByStatus: Record<TaskStatus, number>;
}

interface AnalyticsData {
    hoursThisMonth: number;
    revenueThisMonth: number;
    expenseThisMonth: number;
    pendingAmount: number;
    hoursPerWeek: { label: string; value: number }[];
}

interface RecentActivity {
    recentProjects: Project[];
    upcomingTasks: Task[];
    recentClients: Client[];
}

type TabId = 'overview' | 'analytics';

export const DashboardPage: Component = () => {
    const { profile, loading: profileLoading } = useProfileContext();

    const [activeTab, setActiveTab] = createSignal<TabId>('overview');

    const [stats, setStats] = createSignal<DashboardStats>({
        totalProjects: 0,
        activeProjects: 0,
        totalClients: 0,
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        projectsByStatus: { draft: 0, active: 0, paused: 0, completed: 0, cancelled: 0 },
        tasksByStatus: { backlog: 0, todo: 0, in_progress: 0, review: 0, done: 0 },
    });

    const [analytics, setAnalytics] = createSignal<AnalyticsData>({
        hoursThisMonth: 0,
        revenueThisMonth: 0,
        expenseThisMonth: 0,
        pendingAmount: 0,
        hoursPerWeek: [],
    });

    const [activity, setActivity] = createSignal<RecentActivity>({
        recentProjects: [],
        upcomingTasks: [],
        recentClients: [],
    });

    const [loading, setLoading] = createSignal(true);

    createEffect(async () => {
        if (profileLoading()) return;

        try {
            const today = new Date().toISOString().split('T')[0];
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            // Fetch all projects
            const { data: projects } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

            // Fetch all tasks
            const { data: tasks } = await supabase
                .from('tasks')
                .select('*, project:projects(name)')
                .order('due_date', { ascending: true });

            // Fetch clients
            const { data: clients } = await supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false });

            // Calculate project stats
            const projectsByStatus: Record<ProjectStatus, number> = {
                draft: 0, active: 0, paused: 0, completed: 0, cancelled: 0,
            };
            (projects || []).forEach(p => {
                projectsByStatus[p.status as ProjectStatus]++;
            });

            // Calculate task stats
            const tasksByStatus: Record<TaskStatus, number> = {
                backlog: 0, todo: 0, in_progress: 0, review: 0, done: 0,
            };
            let overdueTasks = 0;
            (tasks || []).forEach(t => {
                tasksByStatus[t.status as TaskStatus]++;
                if (t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done') {
                    overdueTasks++;
                }
            });

            setStats({
                totalProjects: (projects || []).length,
                activeProjects: projectsByStatus.active,
                totalClients: (clients || []).length,
                totalTasks: (tasks || []).length,
                completedTasks: tasksByStatus.done,
                overdueTasks,
                projectsByStatus,
                tasksByStatus,
            });

            // Recent activity
            const recentProjects = (projects || []).slice(0, 5);
            const upcomingTasks = (tasks || [])
                .filter(t => t.status !== 'done' && t.due_date)
                .slice(0, 5);
            const recentClients = (clients || []).slice(0, 5);

            setActivity({ recentProjects, upcomingTasks, recentClients });

            // Analytics data
            // Get hours this month
            const { data: timeEntries } = await supabase
                .from('time_entries')
                .select('duration, start_time')
                .gte('start_time', startOfMonth.toISOString())
                .lte('start_time', endOfMonth.toISOString());

            const totalMinutes = timeEntries?.reduce((sum, e) => sum + (e.duration || 0), 0) || 0;

            // Get finance summary
            const { data: transactions } = await supabase
                .from('finance_transactions')
                .select('type, amount, status')
                .gte('date', startOfMonth.toISOString().split('T')[0])
                .lte('date', endOfMonth.toISOString().split('T')[0]);

            const revenue = transactions
                ?.filter(t => t.type === 'income')
                .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

            const expense = transactions
                ?.filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

            const pending = transactions
                ?.filter(t => t.status === 'pending')
                .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

            // Get hours per week (last 4 weeks)
            const weeks: { label: string; value: number }[] = [];
            for (let i = 3; i >= 0; i--) {
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - (i + 1) * 7);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 7);

                const { data: weekEntries } = await supabase
                    .from('time_entries')
                    .select('duration')
                    .gte('start_time', weekStart.toISOString())
                    .lt('start_time', weekEnd.toISOString());

                const weekHours = weekEntries?.reduce((sum, e) => sum + (e.duration || 0), 0) || 0;
                weeks.push({
                    label: `Sem ${4 - i}`,
                    value: Math.round(weekHours / 60),
                });
            }

            setAnalytics({
                hoursThisMonth: Math.round(totalMinutes / 60),
                revenueThisMonth: revenue,
                expenseThisMonth: expense,
                pendingAmount: pending,
                hoursPerWeek: weeks,
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    });

    const displayName = () => {
        const p = profile();
        if (p?.full_name) return p.full_name;
        return 'Usuário';
    };

    const completionRate = () => {
        const total = stats().totalTasks;
        if (total === 0) return 0;
        return Math.round((stats().completedTasks / total) * 100);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const isOverdue = (dateStr: string) => {
        return new Date(dateStr) < new Date();
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const donutData = createMemo(() => {
        const status = stats().projectsByStatus;
        return [
            { label: 'Ativos', value: status.active, color: '#22c55e' },
            { label: 'Concluídos', value: status.completed, color: '#3b82f6' },
            { label: 'Pausados', value: status.paused, color: '#f59e0b' },
            { label: 'Rascunho', value: status.draft, color: '#94a3b8' },
        ].filter(d => d.value > 0);
    });

    return (
        <AppLayout>
            <Show
                when={!loading()}
                fallback={
                    <div class="loading-container">
                        <div class="spinner spinner-lg" />
                    </div>
                }
            >
                {/* Header */}
                <div class="page-header">
                    <div>
                        <h2 class="page-title">Olá, {displayName()}! 👋</h2>
                        <p class="page-description">Aqui está o resumo da sua operação.</p>
                    </div>
                </div>

                {/* Horizontal Tabs */}
                <div class="dashboard-tabs">
                    <button
                        class="dashboard-tab"
                        classList={{ active: activeTab() === 'overview' }}
                        onClick={() => setActiveTab('overview')}
                    >
                        <i class="ci-House_01"></i>
                        Resumo
                    </button>
                    <button
                        class="dashboard-tab"
                        classList={{ active: activeTab() === 'analytics' }}
                        onClick={() => setActiveTab('analytics')}
                    >
                        <i class="ci-Bar_Chart_Vertical_01"></i>
                        Analytics
                    </button>
                </div>

                {/* Overview Tab */}
                <Show when={activeTab() === 'overview'}>
                    {/* Quick Stats */}
                    <div class="quick-stats">
                        <A href="/projects?status=active" class="quick-stat" style={{ "text-decoration": "none" }}>
                            <div class="quick-stat-icon report-card-icon-primary">
                                <i class="ci-Folder"></i>
                            </div>
                            <div class="quick-stat-content">
                                <div class="quick-stat-label">Projetos Ativos</div>
                                <div class="quick-stat-value">{stats().activeProjects}</div>
                            </div>
                        </A>

                        <A href="/clients" class="quick-stat" style={{ "text-decoration": "none" }}>
                            <div class="quick-stat-icon report-card-icon-success">
                                <i class="ci-User_02"></i>
                            </div>
                            <div class="quick-stat-content">
                                <div class="quick-stat-label">Clientes</div>
                                <div class="quick-stat-value">{stats().totalClients}</div>
                            </div>
                        </A>

                        <div class="quick-stat">
                            <div class="quick-stat-icon report-card-icon-info">
                                <i class="ci-Check_Big"></i>
                            </div>
                            <div class="quick-stat-content">
                                <div class="quick-stat-label">Taxa de Conclusão</div>
                                <div class="quick-stat-value">{completionRate()}%</div>
                            </div>
                        </div>

                        <div class="quick-stat" style={{ "border-color": stats().overdueTasks > 0 ? "var(--color-red)" : undefined }}>
                            <div class="quick-stat-icon report-card-icon-warning">
                                <i class="ci-Warning"></i>
                            </div>
                            <div class="quick-stat-content">
                                <div class="quick-stat-label">Tarefas Atrasadas</div>
                                <div class="quick-stat-value" style={{ color: stats().overdueTasks > 0 ? "var(--color-red)" : undefined }}>
                                    {stats().overdueTasks}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div class="content-grid">

                        {/* Projects by Status Chart */}
                        <div class="card">
                            <div class="card-header card-header-flex">
                                <h3 class="card-title">Projetos por Status</h3>
                            </div>
                            <div class="card-body">
                                <RadarChart
                                    data={Object.entries(stats().projectsByStatus).map(([status, count]) => ({
                                        label: PROJECT_STATUS_LABELS[status as ProjectStatus],
                                        value: count,
                                        color: PROJECT_STATUS_COLORS[status as ProjectStatus],
                                    }))}
                                    size={240}
                                />
                            </div>
                        </div>

                        {/* Task Progress */}
                        <div class="card">
                            <div class="card-header card-header-flex">
                                <h3 class="card-title">Progresso de Tarefas</h3>
                            </div>
                            <div class="card-body">
                                <div class="progress-list">
                                    <For each={Object.entries(stats().tasksByStatus)}>
                                        {([status, count]) => {
                                            const total = stats().totalTasks || 1;
                                            const percentage = Math.round((count / total) * 100);
                                            return (
                                                <div class="progress-item">
                                                    <div class="progress-item-header">
                                                        <span class="progress-item-label">{TASK_STATUS_LABELS[status as TaskStatus]}</span>
                                                        <span class="progress-item-value">{count} ({percentage}%)</span>
                                                    </div>
                                                    <div class="progress-bar">
                                                        <div
                                                            class="progress-bar-fill progress-bar-fill-primary"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        }}
                                    </For>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activity Section */}
                    <div class="content-grid-2">

                        {/* Recent Projects */}
                        <div class="card">
                            <div class="card-header card-header-flex">
                                <h3 class="card-title">Projetos Recentes</h3>
                                <Button variant="ghost" size="sm" onClick={() => window.location.href = '/projects'}>Ver todos</Button>
                            </div>
                            <div class="card-body" style={{ padding: 0 }}>
                                <Show
                                    when={activity().recentProjects.length > 0}
                                    fallback={
                                        <div style={{ padding: "var(--spacing-4)", "text-align": "center", color: "var(--color-text-muted)", "font-size": "var(--font-size-sm)" }}>
                                            Nenhum projeto
                                        </div>
                                    }
                                >
                                    <For each={activity().recentProjects}>
                                        {(project) => (
                                            <A
                                                href={`/projects/${project.id}`}
                                                style={{
                                                    display: "flex",
                                                    "align-items": "center",
                                                    "justify-content": "space-between",
                                                    padding: "var(--spacing-3) var(--spacing-4)",
                                                    "border-bottom": "1px solid var(--color-border)",
                                                    "text-decoration": "none",
                                                    transition: "background var(--transition-fast)",
                                                }}
                                            >
                                                <div style={{ flex: 1, "min-width": 0 }}>
                                                    <div style={{ "font-size": "var(--font-size-sm)", "font-weight": "500", color: "var(--color-text)" }}>
                                                        {project.name}
                                                    </div>
                                                    <div style={{ "font-size": "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                                                        {formatDate(project.created_at)}
                                                    </div>
                                                </div>
                                                <span
                                                    class="badge"
                                                    style={{
                                                        "background-color": `${PROJECT_STATUS_COLORS[project.status]}20`,
                                                        color: PROJECT_STATUS_COLORS[project.status],
                                                    }}
                                                >
                                                    {PROJECT_STATUS_LABELS[project.status]}
                                                </span>
                                            </A>
                                        )}
                                    </For>
                                </Show>
                            </div>
                        </div>

                        {/* Upcoming Tasks */}
                        <div class="card">
                            <div class="card-header card-header-flex">
                                <h3 class="card-title">Próximas Tarefas</h3>
                            </div>
                            <div class="card-body" style={{ padding: 0 }}>
                                <Show
                                    when={activity().upcomingTasks.length > 0}
                                    fallback={
                                        <div style={{ padding: "var(--spacing-4)", "text-align": "center", color: "var(--color-text-muted)", "font-size": "var(--font-size-sm)" }}>
                                            Nenhuma tarefa com prazo
                                        </div>
                                    }
                                >
                                    <For each={activity().upcomingTasks}>
                                        {(task) => (
                                            <A
                                                href={`/projects/${task.project_id}`}
                                                style={{
                                                    display: "flex",
                                                    "align-items": "center",
                                                    gap: "var(--spacing-3)",
                                                    padding: "var(--spacing-3) var(--spacing-4)",
                                                    "border-bottom": "1px solid var(--color-border)",
                                                    "text-decoration": "none",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: "8px",
                                                        height: "8px",
                                                        "border-radius": "50%",
                                                        "flex-shrink": 0,
                                                        background: task.due_date && isOverdue(task.due_date) ? "var(--color-red)" : "var(--color-blue)",
                                                    }}
                                                />
                                                <div style={{ flex: 1, "min-width": 0 }}>
                                                    <div style={{ "font-size": "var(--font-size-sm)", "font-weight": "500", color: "var(--color-text)" }}>
                                                        {task.title}
                                                    </div>
                                                    <div style={{ "font-size": "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                                                        {(task as any).project?.name}
                                                    </div>
                                                </div>
                                                <div
                                                    style={{
                                                        "font-size": "var(--font-size-xs)",
                                                        color: task.due_date && isOverdue(task.due_date) ? "var(--color-red)" : "var(--color-text-muted)",
                                                        "flex-shrink": 0,
                                                    }}
                                                >
                                                    {task.due_date ? formatDate(task.due_date) : '—'}
                                                </div>
                                            </A>
                                        )}
                                    </For>
                                </Show>
                            </div>
                        </div>

                        {/* Recent Clients */}
                        <div class="card">
                            <div class="card-header card-header-flex">
                                <h3 class="card-title">Clientes Recentes</h3>
                                <Button variant="ghost" size="sm" onClick={() => window.location.href = '/clients'}>Ver todos</Button>
                            </div>
                            <div class="card-body" style={{ padding: 0 }}>
                                <Show
                                    when={activity().recentClients.length > 0}
                                    fallback={
                                        <div style={{ padding: "var(--spacing-4)", "text-align": "center", color: "var(--color-text-muted)", "font-size": "var(--font-size-sm)" }}>
                                            Nenhum cliente
                                        </div>
                                    }
                                >
                                    <For each={activity().recentClients}>
                                        {(client) => (
                                            <A
                                                href={`/clients/${client.id}`}
                                                style={{
                                                    display: "flex",
                                                    "align-items": "center",
                                                    gap: "var(--spacing-3)",
                                                    padding: "var(--spacing-3) var(--spacing-4)",
                                                    "border-bottom": "1px solid var(--color-border)",
                                                    "text-decoration": "none",
                                                }}
                                            >
                                                <div
                                                    class="avatar avatar-sm"
                                                    style={{ "background-color": "var(--color-orange-bg)", color: "var(--color-orange)" }}
                                                >
                                                    {client.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1, "min-width": 0 }}>
                                                    <div style={{ "font-size": "var(--font-size-sm)", "font-weight": "500", color: "var(--color-text)" }}>
                                                        {client.name}
                                                    </div>
                                                    <Show when={client.email}>
                                                        <div style={{ "font-size": "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                                                            {client.email}
                                                        </div>
                                                    </Show>
                                                </div>
                                            </A>
                                        )}
                                    </For>
                                </Show>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div class="action-bar">
                        <Button variant="primary" onClick={() => window.location.href = '/clients/new'} icon={<i class="ci-Add"></i>}>
                            Novo Cliente
                        </Button>
                        <Button variant="secondary" onClick={() => window.location.href = '/projects/new'} icon={<i class="ci-Add"></i>}>
                            Novo Projeto
                        </Button>
                    </div>
                </Show>

                {/* Analytics Tab */}
                <Show when={activeTab() === 'analytics'}>
                    {/* Quick Stats - same structure as Resumo */}
                    <div class="quick-stats">
                        <div class="quick-stat">
                            <div class="quick-stat-icon report-card-icon-primary">
                                <i class="ci-Folder"></i>
                            </div>
                            <div class="quick-stat-content">
                                <div class="quick-stat-label">Projetos Ativos</div>
                                <div class="quick-stat-value">{stats().activeProjects}</div>
                            </div>
                        </div>

                        <div class="quick-stat">
                            <div class="quick-stat-icon report-card-icon-success">
                                <i class="ci-Clock"></i>
                            </div>
                            <div class="quick-stat-content">
                                <div class="quick-stat-label">Horas no Mês</div>
                                <div class="quick-stat-value">{analytics().hoursThisMonth}h</div>
                            </div>
                        </div>

                        <div class="quick-stat">
                            <div class="quick-stat-icon report-card-icon-info">
                                <i class="ci-Dollar"></i>
                            </div>
                            <div class="quick-stat-content">
                                <div class="quick-stat-label">Receita no Mês</div>
                                <div class="quick-stat-value">{formatCurrency(analytics().revenueThisMonth)}</div>
                            </div>
                        </div>

                        <div class="quick-stat" style={{ "border-color": analytics().pendingAmount > 0 ? "var(--color-orange)" : undefined }}>
                            <div class="quick-stat-icon report-card-icon-warning">
                                <i class="ci-Warning"></i>
                            </div>
                            <div class="quick-stat-content">
                                <div class="quick-stat-label">Pendências</div>
                                <div class="quick-stat-value" style={{ color: analytics().pendingAmount > 0 ? "var(--color-orange)" : undefined }}>
                                    {formatCurrency(analytics().pendingAmount)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts - same structure as Resumo */}
                    <div class="content-grid">
                        <div class="card">
                            <div class="card-header card-header-flex">
                                <h3 class="card-title">Projetos por Status</h3>
                            </div>
                            <div class="card-body">
                                <Show when={donutData().length > 0} fallback={
                                    <div class="empty-state" style={{ padding: 'var(--spacing-4)' }}>
                                        <p class="empty-state-description">Nenhum projeto encontrado</p>
                                    </div>
                                }>
                                    <DonutChart data={donutData()} size={200} />
                                </Show>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-header card-header-flex">
                                <h3 class="card-title">Horas por Semana</h3>
                            </div>
                            <div class="card-body">
                                <BarChart
                                    data={analytics().hoursPerWeek}
                                    height={200}
                                    formatValue={(v) => `${v}h`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quick Links to Reports */}
                    <div class="action-bar">
                        <Button variant="secondary" onClick={() => window.location.href = '/reports/timesheet'}>📊 Relatório de Horas</Button>
                        <Button variant="secondary" onClick={() => window.location.href = '/reports/finance'}>💵 Relatório Financeiro</Button>
                    </div>
                </Show>
            </Show>
        </AppLayout >
    );
};
