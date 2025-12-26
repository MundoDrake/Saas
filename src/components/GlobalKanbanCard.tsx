import { Component, Show } from 'solid-js';
import { A } from '@solidjs/router';
import type { TaskStatus, TaskPriority } from '../types/database';

const PRIORITY_COLORS: Record<TaskPriority, string> = {
    low: 'var(--color-neutral-400)',
    medium: 'var(--color-info-500)',
    high: 'var(--color-warning-500)',
    urgent: 'var(--color-error-500)',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    urgent: 'Urgente',
};

export interface GlobalTask {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
    estimated_hours: number | null;
    project: {
        id: string;
        name: string;
        client: {
            id: string;
            name: string;
        } | null;
    };
}

interface GlobalKanbanCardProps {
    task: GlobalTask;
    onDragStart: (e: DragEvent, taskId: string) => void;
    onDragEnd: () => void;
    isDragging: boolean;
}

export const GlobalKanbanCard: Component<GlobalKanbanCardProps> = (props) => {
    const isOverdue = () => {
        if (!props.task.due_date || props.task.status === 'done') return false;
        return new Date(props.task.due_date) < new Date();
    };

    const clientInitial = () => {
        const name = props.task.project.client?.name || 'P';
        return name.charAt(0).toUpperCase();
    };

    const formatDueDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
        });
    };

    return (
        <div
            class="global-kanban-card"
            classList={{
                'global-kanban-card-dragging': props.isDragging,
                'global-kanban-card-overdue': isOverdue(),
            }}
            draggable={true}
            onDragStart={(e) => props.onDragStart(e, props.task.id)}
            onDragEnd={props.onDragEnd}
            style={{ '--priority-color': PRIORITY_COLORS[props.task.priority] }}
        >
            {/* Priority Border */}
            <div class="global-kanban-card-priority-bar" />

            {/* Header: Project & Client */}
            <div class="global-kanban-card-header">
                <A
                    href={`/projects/${props.task.project.id}`}
                    class="global-kanban-card-project"
                    onClick={(e) => e.stopPropagation()}
                >
                    {props.task.project.name}
                </A>
                <Show when={props.task.project.client}>
                    <div
                        class="global-kanban-card-client-avatar"
                        title={props.task.project.client!.name}
                    >
                        {clientInitial()}
                    </div>
                </Show>
            </div>

            {/* Title */}
            <h4 class="global-kanban-card-title">{props.task.title}</h4>

            {/* Description */}
            <Show when={props.task.description}>
                <p class="global-kanban-card-description">
                    {props.task.description!.substring(0, 80)}
                    {props.task.description!.length > 80 ? '...' : ''}
                </p>
            </Show>

            {/* Footer: Due date, Hours, Priority badge */}
            <div class="global-kanban-card-footer">
                <div class="global-kanban-card-meta">
                    <Show when={props.task.due_date}>
                        <span
                            class="global-kanban-card-due"
                            classList={{ 'global-kanban-card-due-overdue': isOverdue() }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            {formatDueDate(props.task.due_date!)}
                        </span>
                    </Show>
                    <Show when={props.task.estimated_hours}>
                        <span class="global-kanban-card-hours">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {props.task.estimated_hours}h
                        </span>
                    </Show>
                </div>
                <span
                    class="global-kanban-card-priority-badge"
                    style={{ background: PRIORITY_COLORS[props.task.priority] }}
                    title={PRIORITY_LABELS[props.task.priority]}
                >
                    {PRIORITY_LABELS[props.task.priority]}
                </span>
            </div>

            {/* Edit link */}
            <A
                href={`/projects/${props.task.project.id}/tasks/${props.task.id}/edit`}
                class="global-kanban-card-edit"
                onClick={(e) => e.stopPropagation()}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
            </A>
        </div>
    );
};
