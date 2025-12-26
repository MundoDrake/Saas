import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import { supabase } from '../lib/supabase';
import { AppLayout } from '../components/AppLayout';
import { GlobalKanbanCard, type GlobalTask } from '../components/GlobalKanbanCard';
import { CheckoutModal } from '../components/CheckoutModal';
import { useTimer } from '../contexts/TimerContext';
import type { TaskStatus, TaskPriority } from '../types/database';
import '../styles/global-kanban.css';

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'backlog', label: 'Backlog', color: 'var(--color-neutral-400)' },
    { status: 'todo', label: 'A Fazer', color: 'var(--color-info-500)' },
    { status: 'in_progress', label: 'Em Progresso', color: 'var(--color-warning-500)' },
    { status: 'review', label: 'Revisão', color: 'var(--color-purple-500)' },
    { status: 'done', label: 'Concluído', color: 'var(--color-success-500)' },
];

const PRIORITY_FILTERS: { value: TaskPriority | 'all'; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'urgent', label: 'Urgente' },
    { value: 'high', label: 'Alta' },
    { value: 'medium', label: 'Média' },
    { value: 'low', label: 'Baixa' },
];

const DEADLINE_FILTERS = [
    { value: 'all', label: 'Todos' },
    { value: 'overdue', label: 'Atrasados' },
    { value: 'today', label: 'Hoje' },
    { value: 'week', label: 'Esta Semana' },
];

const STORAGE_KEY = 'studio-manager-kanban-filters';

interface KanbanFilters {
    priority: TaskPriority | 'all';
    deadline: string;
}

const loadFilters = (): KanbanFilters => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error('Error loading filters:', e);
    }
    return { priority: 'all', deadline: 'all' };
};

const saveFilters = (filters: KanbanFilters) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (e) {
        console.error('Error saving filters:', e);
    }
};

export const GlobalKanbanPage: Component = () => {
    const timer = useTimer();
    const [tasks, setTasks] = createSignal<GlobalTask[]>([]);
    const [loading, setLoading] = createSignal(true);
    const [draggingTaskId, setDraggingTaskId] = createSignal<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = createSignal<TaskStatus | null>(null);
    const [updating, setUpdating] = createSignal(false);

    // Filters
    const initialFilters = loadFilters();
    const [priorityFilter, setPriorityFilter] = createSignal<TaskPriority | 'all'>(initialFilters.priority);
    const [deadlineFilter, setDeadlineFilter] = createSignal(initialFilters.deadline);

    // Checkout modal for bio-tracking
    const [pendingDoneTask, setPendingDoneTask] = createSignal<GlobalTask | null>(null);
    const [showCheckoutModal, setShowCheckoutModal] = createSignal(false);

    // Save filters on change
    createEffect(() => {
        saveFilters({
            priority: priorityFilter(),
            deadline: deadlineFilter(),
        });
    });

    // Fetch tasks
    const fetchTasks = async () => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select(`
                    id,
                    title,
                    description,
                    status,
                    priority,
                    due_date,
                    estimated_hours,
                    project:projects!inner(
                        id,
                        name,
                        client:clients(id, name)
                    )
                `)
                .order('priority', { ascending: false })
                .order('due_date', { ascending: true, nullsFirst: false });

            if (error) throw error;

            // Transform data to match GlobalTask interface
            const transformedTasks: GlobalTask[] = (data || []).map((task: any) => ({
                id: task.id,
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                due_date: task.due_date,
                estimated_hours: task.estimated_hours,
                project: {
                    id: task.project.id,
                    name: task.project.name,
                    client: task.project.client,
                },
            }));

            setTasks(transformedTasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    createEffect(() => {
        fetchTasks();
    });

    // Filter tasks
    const filteredTasks = () => {
        let result = tasks();

        // Priority filter
        if (priorityFilter() !== 'all') {
            result = result.filter((t) => t.priority === priorityFilter());
        }

        // Deadline filter
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);

        if (deadlineFilter() === 'overdue') {
            result = result.filter((t) => t.due_date && new Date(t.due_date) < today && t.status !== 'done');
        } else if (deadlineFilter() === 'today') {
            result = result.filter((t) => {
                if (!t.due_date) return false;
                const dueDate = new Date(t.due_date);
                dueDate.setHours(0, 0, 0, 0);
                return dueDate.getTime() === today.getTime();
            });
        } else if (deadlineFilter() === 'week') {
            result = result.filter((t) => {
                if (!t.due_date) return false;
                const dueDate = new Date(t.due_date);
                return dueDate >= today && dueDate <= weekEnd;
            });
        }

        return result;
    };

    const tasksByStatus = (status: TaskStatus) => {
        return filteredTasks().filter((t) => t.status === status);
    };

    // Drag & Drop handlers
    const handleDragStart = (e: DragEvent, taskId: string) => {
        setDraggingTaskId(taskId);
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', taskId);
        }
    };

    const handleDragOver = (e: DragEvent, status: TaskStatus) => {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
        setDragOverColumn(status);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = async (e: DragEvent, newStatus: TaskStatus) => {
        e.preventDefault();
        const taskId = draggingTaskId();
        setDraggingTaskId(null);
        setDragOverColumn(null);

        if (!taskId) return;

        const task = tasks().find((t) => t.id === taskId);
        if (!task || task.status === newStatus) return;

        // If moving to "done", trigger checkout modal
        if (newStatus === 'done' && task.status !== 'done') {
            setPendingDoneTask({ ...task, status: newStatus });
            setShowCheckoutModal(true);
            return;
        }

        // Otherwise, update directly
        await updateTaskStatus(taskId, newStatus);
    };

    const handleDragEnd = () => {
        setDraggingTaskId(null);
        setDragOverColumn(null);
    };

    const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
        setUpdating(true);
        try {
            await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
            await fetchTasks();
        } catch (err) {
            console.error('Error updating task:', err);
        } finally {
            setUpdating(false);
        }
    };

    // Checkout handlers
    const handleCheckoutConfirm = async (data: { categoria: string; energia: number; satisfacao: number; observacoes?: string }) => {
        const task = pendingDoneTask();
        if (!task) return;

        setUpdating(true);
        try {
            // Update task to done
            await supabase.from('tasks').update({ status: 'done' }).eq('id', task.id);

            // Create time entry with bio-tracking data (optional)
            // This connects the task completion to the bio-tracking system
            // The user can also track time separately via the timer

            await fetchTasks();
        } catch (err) {
            console.error('Error completing task:', err);
        } finally {
            setUpdating(false);
            setShowCheckoutModal(false);
            setPendingDoneTask(null);
        }
    };

    const handleCheckoutCancel = () => {
        setShowCheckoutModal(false);
        setPendingDoneTask(null);
    };

    // Stats
    const stats = () => {
        const all = tasks();
        return {
            total: all.length,
            done: all.filter((t) => t.status === 'done').length,
            overdue: all.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length,
            inProgress: all.filter((t) => t.status === 'in_progress').length,
        };
    };

    return (
        <AppLayout>
            <div class="global-kanban-page">
                {/* Header */}
                <header class="global-kanban-header">
                    <h1 class="global-kanban-title">Kanban Global</h1>
                    <div class="kanban-filters">
                        {/* Priority Filter */}
                        <div class="kanban-filter-group">
                            <span class="kanban-filter-label">Prioridade:</span>
                            <For each={PRIORITY_FILTERS}>
                                {(filter) => (
                                    <button
                                        class={`kanban-filter-btn priority-${filter.value}`}
                                        classList={{ active: priorityFilter() === filter.value }}
                                        onClick={() => setPriorityFilter(filter.value)}
                                    >
                                        {filter.label}
                                    </button>
                                )}
                            </For>
                        </div>

                        {/* Deadline Filter */}
                        <div class="kanban-filter-group">
                            <span class="kanban-filter-label">Prazo:</span>
                            <For each={DEADLINE_FILTERS}>
                                {(filter) => (
                                    <button
                                        class="kanban-filter-btn"
                                        classList={{ active: deadlineFilter() === filter.value }}
                                        onClick={() => setDeadlineFilter(filter.value)}
                                    >
                                        {filter.label}
                                    </button>
                                )}
                            </For>
                        </div>
                    </div>
                </header>

                {/* Stats Bar */}
                <div class="global-kanban-stats">
                    <div class="global-kanban-stat">
                        <span class="global-kanban-stat-value">{stats().total}</span>
                        <span class="global-kanban-stat-label">Total</span>
                    </div>
                    <div class="global-kanban-stat">
                        <span class="global-kanban-stat-value" style={{ color: 'var(--color-success-500)' }}>
                            {stats().done}
                        </span>
                        <span class="global-kanban-stat-label">Concluídas</span>
                    </div>
                    <div class="global-kanban-stat">
                        <span class="global-kanban-stat-value" style={{ color: 'var(--color-warning-500)' }}>
                            {stats().inProgress}
                        </span>
                        <span class="global-kanban-stat-label">Em Progresso</span>
                    </div>
                    <Show when={stats().overdue > 0}>
                        <div class="global-kanban-stat">
                            <span class="global-kanban-stat-value" style={{ color: 'var(--color-error-500)' }}>
                                {stats().overdue}
                            </span>
                            <span class="global-kanban-stat-label">Atrasadas</span>
                        </div>
                    </Show>
                </div>

                {/* Kanban Board */}
                <Show
                    when={!loading()}
                    fallback={
                        <div class="global-kanban-loading">
                            <div class="spinner spinner-lg" />
                        </div>
                    }
                >
                    <Show
                        when={tasks().length > 0}
                        fallback={
                            <div class="global-kanban-empty">
                                <div class="global-kanban-empty-icon">📋</div>
                                <h2 class="global-kanban-empty-title">Nenhuma tarefa encontrada</h2>
                                <p class="global-kanban-empty-description">
                                    Crie um novo projeto usando um template para começar a gerenciar suas tarefas de forma visual.
                                </p>
                                <a href="/projects/new" class="btn btn-primary">
                                    Criar Projeto
                                </a>
                            </div>
                        }
                    >
                        <div class="global-kanban-board-wrapper">
                            <div class="global-kanban-board">
                                <For each={COLUMNS}>
                                    {(column) => (
                                        <div
                                            class="global-kanban-column"
                                            classList={{
                                                'global-kanban-column-dragover': dragOverColumn() === column.status,
                                            }}
                                            onDragOver={(e) => handleDragOver(e, column.status)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, column.status)}
                                        >
                                            <div class="global-kanban-column-header">
                                                <div
                                                    class="global-kanban-column-indicator"
                                                    style={{ background: column.color }}
                                                />
                                                <span class="global-kanban-column-title">{column.label}</span>
                                                <span class="global-kanban-column-count">
                                                    {tasksByStatus(column.status).length}
                                                </span>
                                            </div>

                                            <div class="global-kanban-column-body">
                                                <For each={tasksByStatus(column.status)}>
                                                    {(task) => (
                                                        <GlobalKanbanCard
                                                            task={task}
                                                            onDragStart={handleDragStart}
                                                            onDragEnd={handleDragEnd}
                                                            isDragging={draggingTaskId() === task.id}
                                                        />
                                                    )}
                                                </For>
                                            </div>
                                        </div>
                                    )}
                                </For>
                            </div>
                        </div>
                    </Show>
                </Show>

                {/* Updating indicator */}
                <Show when={updating()}>
                    <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: 'var(--color-bg)', padding: 'var(--spacing-3)', 'border-radius': 'var(--radius-md)', 'box-shadow': 'var(--shadow-lg)', display: 'flex', 'align-items': 'center', gap: 'var(--spacing-2)' }}>
                        <div class="spinner spinner-sm" />
                        <span style={{ 'font-size': 'var(--font-size-sm)' }}>Atualizando...</span>
                    </div>
                </Show>

                {/* Checkout Modal */}
                <Show when={showCheckoutModal() && pendingDoneTask()}>
                    <CheckoutModal
                        isOpen={showCheckoutModal()}
                        onClose={handleCheckoutCancel}
                        onConfirm={handleCheckoutConfirm}
                        duration="--:--"
                        activityName={pendingDoneTask()?.title}
                    />
                </Show>
            </div>
        </AppLayout>
    );
};
