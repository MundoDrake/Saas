import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProfileContext } from '../contexts/ProfileContext';
import type { TaskStatus, TaskPriority, Profile } from '../types/database';
import { AppLayout } from '../components/AppLayout';

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
    { value: 'backlog', label: 'Backlog' },
    { value: 'todo', label: 'A Fazer' },
    { value: 'in_progress', label: 'Em Progresso' },
    { value: 'review', label: 'Revisão' },
    { value: 'done', label: 'Concluído' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
    { value: 'low', label: 'Baixa' },
    { value: 'medium', label: 'Média' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' },
];

export const TaskFormPage: Component = () => {
    const navigate = useNavigate();
    const params = useParams(); // projectId and optionally taskId
    const { user } = useAuth();

    const isEditing = () => !!params.taskId;

    const [loading, setLoading] = createSignal(false);
    const [saving, setSaving] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    const [projectName, setProjectName] = createSignal('');
    const [members, setMembers] = createSignal<Profile[]>([]);

    // Form fields
    const [title, setTitle] = createSignal('');
    const [description, setDescription] = createSignal('');
    const [status, setStatus] = createSignal<TaskStatus>('backlog');
    const [priority, setPriority] = createSignal<TaskPriority>('medium');
    const [assigneeId, setAssigneeId] = createSignal('');
    const [dueDate, setDueDate] = createSignal('');
    const [estimatedHours, setEstimatedHours] = createSignal('');

    // Fetch project name
    createEffect(async () => {
        if (!params.projectId) return;

        const { data } = await supabase
            .from('projects')
            .select('name')
            .eq('id', params.projectId)
            .single();

        if (data) setProjectName(data.name);
    });

    // Fetch team members for assignee select
    createEffect(async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name');
        setMembers(data || []);
    });

    // Load existing task if editing
    createEffect(async () => {
        if (!params.taskId) return;

        setLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('tasks')
                .select('*')
                .eq('id', params.taskId)
                .single();

            if (fetchError) throw fetchError;

            if (data) {
                setTitle(data.title || '');
                setDescription(data.description || '');
                setStatus(data.status || 'backlog');
                setPriority(data.priority || 'medium');
                setAssigneeId(data.assignee_id || '');
                setDueDate(data.due_date || '');
                setEstimatedHours(data.estimated_hours?.toString() || '');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar tarefa');
        } finally {
            setLoading(false);
        }
    });

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        try {
            const taskData = {
                project_id: params.projectId,
                title: title().trim(),
                description: description().trim() || null,
                status: status(),
                priority: priority(),
                assignee_id: assigneeId() || null,
                due_date: dueDate() || null,
                estimated_hours: estimatedHours() ? parseFloat(estimatedHours()) : null,
            };

            if (isEditing()) {
                const { error: updateError } = await supabase
                    .from('tasks')
                    .update(taskData)
                    .eq('id', params.taskId);

                if (updateError) throw updateError;
            } else {
                // Get max sort_order for this project
                const { data: maxOrderData } = await supabase
                    .from('tasks')
                    .select('sort_order')
                    .eq('project_id', params.projectId)
                    .order('sort_order', { ascending: false })
                    .limit(1);

                const maxOrder = maxOrderData?.[0]?.sort_order ?? 0;

                const { error: insertError } = await supabase
                    .from('tasks')
                    .insert({
                        ...taskData,
                        sort_order: maxOrder + 1,
                        created_by: user()?.id,
                    });

                if (insertError) throw insertError;
            }

            navigate(`/projects/${params.projectId}`);
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar tarefa');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir esta tarefa?')) {
            return;
        }

        setSaving(true);
        try {
            const { error: deleteError } = await supabase
                .from('tasks')
                .delete()
                .eq('id', params.taskId);

            if (deleteError) throw deleteError;
            navigate(`/projects/${params.projectId}`);
        } catch (err: any) {
            setError(err.message || 'Erro ao excluir tarefa');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppLayout>
            <div class="page-header">
                <div style={{ display: "flex", "align-items": "center", gap: "var(--spacing-2)", "margin-bottom": "var(--spacing-2)" }}>
                    <a
                        href={`/projects/${params.projectId}`}
                        style={{ color: "var(--color-neutral-400)", "font-size": "var(--font-size-sm)" }}
                    >
                        {projectName() || 'Projeto'}
                    </a>
                    <span style={{ color: "var(--color-neutral-300)" }}>/</span>
                    <span style={{ color: "var(--color-neutral-500)", "font-size": "var(--font-size-sm)" }}>
                        {isEditing() ? 'Editar Tarefa' : 'Nova Tarefa'}
                    </span>
                </div>
                <h2 class="page-title">
                    {isEditing() ? 'Editar Tarefa' : 'Nova Tarefa'}
                </h2>
            </div>

            <Show
                when={!loading()}
                fallback={
                    <div class="loading-container">
                        <div class="spinner spinner-lg" />
                    </div>
                }
            >
                <div class="card" style={{ "max-width": "640px" }}>
                    <div class="card-body">
                        <form onSubmit={handleSubmit}>
                            <Show when={error()}>
                                <div class="alert alert-error" style={{ "margin-bottom": "var(--spacing-4)" }}>
                                    {error()}
                                </div>
                            </Show>

                            <div style={{ display: "flex", "flex-direction": "column", gap: "var(--spacing-4)" }}>
                                <div class="form-group">
                                    <label class="form-label" for="title">Título *</label>
                                    <input
                                        id="title"
                                        type="text"
                                        class="form-input"
                                        placeholder="Ex: Criar wireframes do app"
                                        value={title()}
                                        onInput={(e) => setTitle(e.currentTarget.value)}
                                        required
                                        disabled={saving()}
                                    />
                                </div>

                                <div class="form-group">
                                    <label class="form-label" for="description">Descrição</label>
                                    <textarea
                                        id="description"
                                        class="form-input"
                                        placeholder="Detalhe o que precisa ser feito..."
                                        value={description()}
                                        onInput={(e) => setDescription(e.currentTarget.value)}
                                        disabled={saving()}
                                        rows={4}
                                        style={{ resize: "vertical" }}
                                    />
                                </div>

                                <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "var(--spacing-4)" }}>
                                    <div class="form-group">
                                        <label class="form-label" for="status">Status</label>
                                        <select
                                            id="status"
                                            class="form-input"
                                            value={status()}
                                            onChange={(e) => setStatus(e.currentTarget.value as TaskStatus)}
                                            disabled={saving()}
                                        >
                                            <For each={STATUS_OPTIONS}>
                                                {(option) => (
                                                    <option value={option.value}>{option.label}</option>
                                                )}
                                            </For>
                                        </select>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label" for="priority">Prioridade</label>
                                        <select
                                            id="priority"
                                            class="form-input"
                                            value={priority()}
                                            onChange={(e) => setPriority(e.currentTarget.value as TaskPriority)}
                                            disabled={saving()}
                                        >
                                            <For each={PRIORITY_OPTIONS}>
                                                {(option) => (
                                                    <option value={option.value}>{option.label}</option>
                                                )}
                                            </For>
                                        </select>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="form-label" for="assignee">Responsável</label>
                                    <select
                                        id="assignee"
                                        class="form-input"
                                        value={assigneeId()}
                                        onChange={(e) => setAssigneeId(e.currentTarget.value)}
                                        disabled={saving()}
                                    >
                                        <option value="">Não atribuído</option>
                                        <For each={members()}>
                                            {(member) => (
                                                <option value={member.id}>
                                                    {member.full_name || 'Usuário sem nome'}
                                                </option>
                                            )}
                                        </For>
                                    </select>
                                </div>

                                <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "var(--spacing-4)" }}>
                                    <div class="form-group">
                                        <label class="form-label" for="due-date">Prazo</label>
                                        <input
                                            id="due-date"
                                            type="date"
                                            class="form-input"
                                            value={dueDate()}
                                            onInput={(e) => setDueDate(e.currentTarget.value)}
                                            disabled={saving()}
                                        />
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label" for="estimated-hours">Horas Estimadas</label>
                                        <input
                                            id="estimated-hours"
                                            type="number"
                                            class="form-input"
                                            placeholder="0"
                                            value={estimatedHours()}
                                            onInput={(e) => setEstimatedHours(e.currentTarget.value)}
                                            disabled={saving()}
                                            min="0"
                                            step="0.5"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", "justify-content": "space-between", "margin-top": "var(--spacing-6)" }}>
                                <Show when={isEditing()}>
                                    <button
                                        type="button"
                                        class="btn btn-danger"
                                        onClick={handleDelete}
                                        disabled={saving()}
                                    >
                                        Excluir
                                    </button>
                                </Show>
                                <div style={{ display: "flex", gap: "var(--spacing-3)", "margin-left": "auto" }}>
                                    <button
                                        type="button"
                                        class="btn btn-secondary"
                                        onClick={() => navigate(`/projects/${params.projectId}`)}
                                        disabled={saving()}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        class="btn btn-primary"
                                        disabled={saving() || !title().trim()}
                                    >
                                        <Show when={saving()} fallback={isEditing() ? 'Salvar' : 'Criar Tarefa'}>
                                            <span class="spinner spinner-sm" />
                                            Salvando...
                                        </Show>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </Show>
        </AppLayout>
    );
};
