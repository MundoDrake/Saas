import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import { A, useParams } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import type { Project, Client, Task, TaskStatus, TaskPriority } from '../types/database';
import { ProjectLayout } from '../components/ProjectLayout';

const STATUS_LABELS: Record<string, string> = {
    draft: 'Rascunho',
    active: 'Ativo',
    paused: 'Pausado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
    draft: 'badge-neutral',
    active: 'badge-success',
    paused: 'badge-warning',
    completed: 'badge-primary',
    cancelled: 'badge-error',
};

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
    backlog: 'Backlog',
    todo: 'A Fazer',
    in_progress: 'Em Progresso',
    review: 'Revisão',
    done: 'Concluído',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    urgent: 'Urgente',
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
    low: 'var(--color-neutral-400)',
    medium: 'var(--color-info-500)',
    high: 'var(--color-warning-500)',
    urgent: 'var(--color-error-500)',
};

interface ProjectWithClient extends Project {
    client: Client;
}

export const ProjectDetailPage: Component = () => {
    const params = useParams();

    const [project, setProject] = createSignal<ProjectWithClient | null>(null);
    const [tasks, setTasks] = createSignal<Task[]>([]);
    const [loading, setLoading] = createSignal(true);
    const [error, setError] = createSignal<string | null>(null);

    // Task stats
    const taskStats = () => {
        const all = tasks();
        return {
            total: all.length,
            done: all.filter(t => t.status === 'done').length,
            inProgress: all.filter(t => t.status === 'in_progress').length,
            review: all.filter(t => t.status === 'review').length,
            todo: all.filter(t => t.status === 'todo').length,
            backlog: all.filter(t => t.status === 'backlog').length,
            overdue: all.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length,
        };
    };

    // Progress percentage
    const progressPercent = () => {
        const stats = taskStats();
        if (stats.total === 0) return 0;
        return Math.round((stats.done / stats.total) * 100);
    };

    const fetchProject = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data: projectData, error: projectError } = await supabase
                .from('projects')
                .select(`
          *,
          client:clients(*)
        `)
                .eq('id', params.id)
                .single();

            if (projectError) throw projectError;
            setProject(projectData as ProjectWithClient);

            await fetchTasks();
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar projeto');
        } finally {
            setLoading(false);
        }
    };

    const fetchTasks = async () => {
        const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', params.id)
            .order('sort_order', { ascending: true });

        if (tasksError) throw tasksError;
        setTasks(tasksData || []);
    };

    createEffect(() => {
        if (params.id) {
            fetchProject();
        }
    });

    const formatCurrency = (value: number | null) => {
        if (!value) return '—';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    // Get recent/urgent tasks for quick view
    const urgentTasks = () => {
        return tasks()
            .filter(t => t.status !== 'done' && (t.priority === 'urgent' || t.priority === 'high'))
            .slice(0, 5);
    };

    const recentTasks = () => {
        return tasks()
            .filter(t => t.status !== 'done')
            .sort((a, b) => {
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            })
            .slice(0, 5);
    };

    return (
        <ProjectLayout>
            <Show
                when={!loading()}
                fallback={
                    <div class="loading-container">
                        <div class="spinner spinner-lg" />
                    </div>
                }
            >
                <Show when={error()}>
                    <div class="alert alert-error">{error()}</div>
                </Show>

                <Show when={project()}>
                    {(proj) => (
                        <>
                            {/* Header */}
                            <div style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-start", "margin-bottom": "var(--spacing-6)" }}>
                                <div>
                                    <div style={{ display: "flex", "align-items": "center", gap: "var(--spacing-3)", "margin-bottom": "var(--spacing-2)" }}>
                                        <A href="/projects" style={{ color: "var(--color-neutral-400)", "font-size": "var(--font-size-sm)" }}>
                                            Projetos
                                        </A>
                                        <span style={{ color: "var(--color-neutral-300)" }}>/</span>
                                        <span style={{ color: "var(--color-neutral-500)", "font-size": "var(--font-size-sm)" }}>
                                            {proj().client?.name}
                                        </span>
                                    </div>
                                    <h2 class="page-title" style={{ display: "flex", "align-items": "center", gap: "var(--spacing-3)" }}>
                                        {proj().name}
                                        <span class={`badge ${STATUS_COLORS[proj().status]}`}>
                                            {STATUS_LABELS[proj().status]}
                                        </span>
                                    </h2>
                                </div>
                            </div>

                            {/* Progress Bar Card */}
                            <div class="card" style={{ "margin-bottom": "var(--spacing-6)" }}>
                                <div class="card-body" style={{ padding: "var(--spacing-5)" }}>
                                    <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "var(--spacing-3)" }}>
                                        <h3 style={{ "font-size": "var(--font-size-sm)", "font-weight": "600", margin: 0 }}>
                                            Progresso do Projeto
                                        </h3>
                                        <span style={{ "font-size": "var(--font-size-2xl)", "font-weight": "700", color: "var(--color-success-500)" }}>
                                            {progressPercent()}%
                                        </span>
                                    </div>
                                    <div style={{
                                        height: "8px",
                                        background: "var(--color-bg-secondary)",
                                        "border-radius": "var(--radius-full)",
                                        overflow: "hidden",
                                        "margin-bottom": "var(--spacing-4)"
                                    }}>
                                        <div style={{
                                            height: "100%",
                                            width: `${progressPercent()}%`,
                                            background: "var(--color-success-500)",
                                            "border-radius": "var(--radius-full)",
                                            transition: "width 0.3s ease"
                                        }} />
                                    </div>
                                    <div style={{ display: "flex", gap: "var(--spacing-6)", "flex-wrap": "wrap" }}>
                                        <div style={{ display: "flex", "align-items": "center", gap: "var(--spacing-2)" }}>
                                            <div style={{ width: "8px", height: "8px", "border-radius": "50%", background: "var(--color-success-500)" }} />
                                            <span style={{ "font-size": "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                                                {taskStats().done} concluídas
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", "align-items": "center", gap: "var(--spacing-2)" }}>
                                            <div style={{ width: "8px", height: "8px", "border-radius": "50%", background: "var(--color-warning-500)" }} />
                                            <span style={{ "font-size": "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                                                {taskStats().inProgress} em progresso
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", "align-items": "center", gap: "var(--spacing-2)" }}>
                                            <div style={{ width: "8px", height: "8px", "border-radius": "50%", background: "var(--color-info-500)" }} />
                                            <span style={{ "font-size": "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                                                {taskStats().todo + taskStats().backlog} pendentes
                                            </span>
                                        </div>
                                        <Show when={taskStats().overdue > 0}>
                                            <div style={{ display: "flex", "align-items": "center", gap: "var(--spacing-2)" }}>
                                                <div style={{ width: "8px", height: "8px", "border-radius": "50%", background: "var(--color-error-500)" }} />
                                                <span style={{ "font-size": "var(--font-size-sm)", color: "var(--color-error-500)", "font-weight": "500" }}>
                                                    {taskStats().overdue} atrasadas
                                                </span>
                                            </div>
                                        </Show>
                                    </div>
                                </div>
                            </div>

                            {/* Info Cards */}
                            <div style={{ display: "grid", "grid-template-columns": "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--spacing-4)", "margin-bottom": "var(--spacing-6)" }}>
                                <div class="card">
                                    <div class="card-body" style={{ padding: "var(--spacing-4)" }}>
                                        <div style={{ "font-size": "var(--font-size-xs)", color: "var(--color-neutral-500)", "margin-bottom": "var(--spacing-1)" }}>
                                            Cliente
                                        </div>
                                        <div style={{ "font-weight": "500" }}>
                                            {proj().client?.name || '—'}
                                        </div>
                                    </div>
                                </div>

                                <div class="card">
                                    <div class="card-body" style={{ padding: "var(--spacing-4)" }}>
                                        <div style={{ "font-size": "var(--font-size-xs)", color: "var(--color-neutral-500)", "margin-bottom": "var(--spacing-1)" }}>
                                            Período
                                        </div>
                                        <div style={{ "font-weight": "500" }}>
                                            {proj().start_date ? new Date(proj().start_date!).toLocaleDateString('pt-BR') : '—'}
                                            {' → '}
                                            {proj().end_date ? new Date(proj().end_date!).toLocaleDateString('pt-BR') : '—'}
                                        </div>
                                    </div>
                                </div>

                                <div class="card">
                                    <div class="card-body" style={{ padding: "var(--spacing-4)" }}>
                                        <div style={{ "font-size": "var(--font-size-xs)", color: "var(--color-neutral-500)", "margin-bottom": "var(--spacing-1)" }}>
                                            Orçamento
                                        </div>
                                        <div style={{ "font-weight": "500" }}>
                                            {formatCurrency(proj().budget)}
                                        </div>
                                    </div>
                                </div>

                                <div class="card">
                                    <div class="card-body" style={{ padding: "var(--spacing-4)" }}>
                                        <div style={{ "font-size": "var(--font-size-xs)", color: "var(--color-neutral-500)", "margin-bottom": "var(--spacing-1)" }}>
                                            Total de Tarefas
                                        </div>
                                        <div style={{ "font-weight": "500" }}>
                                            {taskStats().total}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <Show when={proj().description}>
                                <div class="card" style={{ "margin-bottom": "var(--spacing-6)" }}>
                                    <div class="card-body">
                                        <h3 style={{ "font-size": "var(--font-size-sm)", "font-weight": "600", "margin-bottom": "var(--spacing-2)" }}>
                                            Descrição
                                        </h3>
                                        <p style={{ color: "var(--color-neutral-600)", "white-space": "pre-wrap" }}>
                                            {proj().description}
                                        </p>
                                    </div>
                                </div>
                            </Show>

                            {/* Quick Actions - Link to Global Kanban */}
                            <div class="card" style={{ "margin-bottom": "var(--spacing-6)", background: "var(--color-primary-50)", border: "1px solid var(--color-blue-bg)" }}>
                                <div class="card-body" style={{ padding: "var(--spacing-4)", display: "flex", "justify-content": "space-between", "align-items": "center" }}>
                                    <div>
                                        <h3 style={{ "font-size": "var(--font-size-base)", "font-weight": "600", "margin-bottom": "var(--spacing-1)" }}>
                                            Gerenciar Tarefas
                                        </h3>
                                        <p style={{ "font-size": "var(--font-size-sm)", color: "var(--color-text-secondary)", margin: 0 }}>
                                            Use o Kanban Global para visualizar e gerenciar todas as tarefas
                                        </p>
                                    </div>
                                    <div style={{ display: "flex", gap: "var(--spacing-3)" }}>
                                        <A href={`/projects/${params.id}/tasks/new`} class="btn btn-secondary">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <line x1="12" y1="5" x2="12" y2="19" />
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>
                                            Nova Tarefa
                                        </A>
                                        <A href="/kanban" class="btn btn-primary">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <rect x="3" y="3" width="7" height="7" />
                                                <rect x="14" y="3" width="7" height="7" />
                                                <rect x="14" y="14" width="7" height="7" />
                                                <rect x="3" y="14" width="7" height="7" />
                                            </svg>
                                            Abrir Kanban
                                        </A>
                                    </div>
                                </div>
                            </div>

                            {/* Urgent/Priority Tasks */}
                            <Show when={urgentTasks().length > 0}>
                                <div class="card" style={{ "margin-bottom": "var(--spacing-6)" }}>
                                    <div class="card-header" style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
                                        <h3 style={{ "font-size": "var(--font-size-sm)", "font-weight": "600", margin: 0, display: "flex", "align-items": "center", gap: "var(--spacing-2)" }}>
                                            <span style={{ color: "var(--color-error-500)" }}>⚡</span>
                                            Tarefas Prioritárias
                                        </h3>
                                    </div>
                                    <div class="card-body" style={{ padding: 0 }}>
                                        <For each={urgentTasks()}>
                                            {(task) => (
                                                <A
                                                    href={`/projects/${params.id}/tasks/${task.id}/edit`}
                                                    style={{
                                                        display: "flex",
                                                        "align-items": "center",
                                                        gap: "var(--spacing-3)",
                                                        padding: "var(--spacing-3) var(--spacing-4)",
                                                        "border-bottom": "1px solid var(--color-border)",
                                                        "text-decoration": "none",
                                                        color: "var(--color-text)"
                                                    }}
                                                >
                                                    <div style={{
                                                        width: "4px",
                                                        height: "24px",
                                                        "border-radius": "2px",
                                                        background: PRIORITY_COLORS[task.priority]
                                                    }} />
                                                    <div style={{ flex: 1, "min-width": 0 }}>
                                                        <div style={{ "font-weight": "500", "font-size": "var(--font-size-sm)" }}>
                                                            {task.title}
                                                        </div>
                                                        <div style={{ "font-size": "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                                                            {TASK_STATUS_LABELS[task.status]}
                                                            {task.due_date && (
                                                                <span style={{ "margin-left": "var(--spacing-2)" }}>
                                                                    • {new Date(task.due_date).toLocaleDateString('pt-BR')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span style={{
                                                        "font-size": "var(--font-size-xs)",
                                                        "font-weight": "500",
                                                        color: PRIORITY_COLORS[task.priority]
                                                    }}>
                                                        {PRIORITY_LABELS[task.priority]}
                                                    </span>
                                                </A>
                                            )}
                                        </For>
                                    </div>
                                </div>
                            </Show>

                            {/* Próximas Entregas */}
                            <Show when={recentTasks().length > 0}>
                                <div class="card" style={{ "margin-bottom": "var(--spacing-6)" }}>
                                    <div class="card-header" style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
                                        <h3 style={{ "font-size": "var(--font-size-sm)", "font-weight": "600", margin: 0, display: "flex", "align-items": "center", gap: "var(--spacing-2)" }}>
                                            <span>📅</span>
                                            Próximas Entregas
                                        </h3>
                                    </div>
                                    <div class="card-body" style={{ padding: 0 }}>
                                        <For each={recentTasks()}>
                                            {(task) => (
                                                <A
                                                    href={`/projects/${params.id}/tasks/${task.id}/edit`}
                                                    style={{
                                                        display: "flex",
                                                        "align-items": "center",
                                                        gap: "var(--spacing-3)",
                                                        padding: "var(--spacing-3) var(--spacing-4)",
                                                        "border-bottom": "1px solid var(--color-border)",
                                                        "text-decoration": "none",
                                                        color: "var(--color-text)"
                                                    }}
                                                >
                                                    <div style={{
                                                        width: "4px",
                                                        height: "24px",
                                                        "border-radius": "2px",
                                                        background: task.due_date && new Date(task.due_date) < new Date()
                                                            ? "var(--color-error-500)"
                                                            : "var(--color-info-500)"
                                                    }} />
                                                    <div style={{ flex: 1, "min-width": 0 }}>
                                                        <div style={{ "font-weight": "500", "font-size": "var(--font-size-sm)" }}>
                                                            {task.title}
                                                        </div>
                                                        <div style={{ "font-size": "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                                                            {TASK_STATUS_LABELS[task.status]}
                                                        </div>
                                                    </div>
                                                    <Show when={task.due_date}>
                                                        <span style={{
                                                            "font-size": "var(--font-size-xs)",
                                                            "font-weight": "500",
                                                            color: new Date(task.due_date!) < new Date()
                                                                ? "var(--color-error-500)"
                                                                : "var(--color-text-secondary)"
                                                        }}>
                                                            {new Date(task.due_date!).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </Show>
                                                </A>
                                            )}
                                        </For>
                                    </div>
                                </div>
                            </Show>

                            {/* Empty State when no tasks */}
                            <Show when={tasks().length === 0}>
                                <div class="card">
                                    <div class="card-body" style={{ padding: "var(--spacing-8)", "text-align": "center" }}>
                                        <div style={{ "font-size": "3rem", "margin-bottom": "var(--spacing-4)", opacity: 0.3 }}>📋</div>
                                        <h3 style={{ "font-size": "var(--font-size-lg)", "font-weight": "600", "margin-bottom": "var(--spacing-2)" }}>
                                            Nenhuma tarefa ainda
                                        </h3>
                                        <p style={{ color: "var(--color-text-secondary)", "margin-bottom": "var(--spacing-4)" }}>
                                            Crie tarefas para acompanhar o progresso do projeto
                                        </p>
                                        <A href={`/projects/${params.id}/tasks/new`} class="btn btn-primary">
                                            Criar Primeira Tarefa
                                        </A>
                                    </div>
                                </div>
                            </Show>
                        </>
                    )}
                </Show>
            </Show>
        </ProjectLayout>
    );
};
