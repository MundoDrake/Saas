import { Component, createSignal, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import type { Task, TaskStatus, TaskPriority } from '../types/database';

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'backlog', label: 'Backlog', color: 'var(--color-gray)' },
    { status: 'todo', label: 'A Fazer', color: 'var(--color-blue)' },
    { status: 'in_progress', label: 'Em Progresso', color: 'var(--color-orange)' },
    { status: 'review', label: 'Revisão', color: 'var(--color-purple)' },
    { status: 'done', label: 'Concluído', color: 'var(--color-green)' },
];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
    low: 'var(--color-gray)',
    medium: 'var(--color-blue)',
    high: 'var(--color-orange)',
    urgent: 'var(--color-red)',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    urgent: 'Urgente',
};

interface KanbanBoardProps {
    projectId: string;
    tasks: Task[];
    onTaskUpdate: () => void;
}

export const KanbanBoard: Component<KanbanBoardProps> = (props) => {
    const [draggingTaskId, setDraggingTaskId] = createSignal<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = createSignal<TaskStatus | null>(null);
    const [updating, setUpdating] = createSignal(false);

    const tasksByStatus = (status: TaskStatus) => {
        return props.tasks.filter(t => t.status === status);
    };

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

        const task = props.tasks.find(t => t.id === taskId);
        if (!task || task.status === newStatus) return;

        setUpdating(true);
        try {
            await supabase
                .from('tasks')
                .update({ status: newStatus })
                .eq('id', taskId);

            props.onTaskUpdate();
        } catch (err) {
            console.error('Error updating task:', err);
        } finally {
            setUpdating(false);
        }
    };

    const handleDragEnd = () => {
        setDraggingTaskId(null);
        setDragOverColumn(null);
    };

    return (
        <div class="kanban-wrapper">
            <div class="kanban-board">
                <For each={COLUMNS}>
                    {(column) => (
                        <div
                            class="kanban-column"
                            classList={{
                                'kanban-column-dragover': dragOverColumn() === column.status,
                            }}
                            onDragOver={(e) => handleDragOver(e, column.status)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, column.status)}
                        >
                            <div class="kanban-column-header">
                                <div class="kanban-column-indicator" style={{ background: column.color }} />
                                <span class="kanban-column-title">{column.label}</span>
                                <span class="kanban-column-count">{tasksByStatus(column.status).length}</span>
                            </div>

                            <div class="kanban-column-body">
                                <For each={tasksByStatus(column.status)}>
                                    {(task) => (
                                        <div
                                            class="kanban-card"
                                            classList={{
                                                'kanban-card-dragging': draggingTaskId() === task.id,
                                            }}
                                            draggable={true}
                                            onDragStart={(e) => handleDragStart(e, task.id)}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <div class="kanban-card-header">
                                                <span
                                                    class="kanban-card-priority"
                                                    style={{ background: PRIORITY_COLORS[task.priority] }}
                                                    title={PRIORITY_LABELS[task.priority]}
                                                />
                                                <A
                                                    href={`/projects/${props.projectId}/tasks/${task.id}/edit`}
                                                    class="kanban-card-edit"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </A>
                                            </div>

                                            <h4 class="kanban-card-title">{task.title}</h4>

                                            <Show when={task.description}>
                                                <p class="kanban-card-description">
                                                    {task.description!.substring(0, 60)}
                                                    {task.description!.length > 60 ? '...' : ''}
                                                </p>
                                            </Show>

                                            <div class="kanban-card-footer">
                                                <Show when={task.due_date}>
                                                    <span
                                                        class="kanban-card-due"
                                                        classList={{
                                                            'kanban-card-due-overdue': new Date(task.due_date!) < new Date() && task.status !== 'done',
                                                        }}
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                            <line x1="16" y1="2" x2="16" y2="6" />
                                                            <line x1="8" y1="2" x2="8" y2="6" />
                                                            <line x1="3" y1="10" x2="21" y2="10" />
                                                        </svg>
                                                        {new Date(task.due_date!).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                </Show>

                                                <Show when={task.estimated_hours}>
                                                    <span class="kanban-card-hours">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <polyline points="12 6 12 12 16 14" />
                                                        </svg>
                                                        {task.estimated_hours}h
                                                    </span>
                                                </Show>
                                            </div>
                                        </div>
                                    )}
                                </For>

                                <A
                                    href={`/projects/${props.projectId}/tasks/new`}
                                    class="kanban-add-card"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                    Adicionar
                                </A>
                            </div>
                        </div>
                    )}
                </For>

                <Show when={updating()}>
                    <div class="kanban-updating">
                        <div class="spinner spinner-sm" />
                    </div>
                </Show>
            </div>
        </div>
    );
};
