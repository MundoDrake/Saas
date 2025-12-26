import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import { useNavigate, useParams, useSearchParams } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Client, ProjectStatus } from '../types/database';
import { AppLayout } from '../components/AppLayout';

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
    { value: 'draft', label: 'Rascunho' },
    { value: 'active', label: 'Ativo' },
    { value: 'paused', label: 'Pausado' },
    { value: 'completed', label: 'Concluído' },
    { value: 'cancelled', label: 'Cancelado' },
];

interface TemplateTask {
    id: string;
    title: string;
    description: string | null;
    priority: string;
    estimated_hours: number | null;
    sort_order: number;
}

export const ProjectFormPage: Component = () => {
    const navigate = useNavigate();
    const params = useParams();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    const isEditing = () => !!params.id;
    const templateId = () => searchParams.template as string | undefined;

    const [loading, setLoading] = createSignal(false);
    const [saving, setSaving] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    const [clients, setClients] = createSignal<Client[]>([]);

    // Template info
    const [templateName, setTemplateName] = createSignal<string | null>(null);
    const [templateTasks, setTemplateTasks] = createSignal<TemplateTask[]>([]);

    // Form fields
    const [name, setName] = createSignal('');
    const [clientId, setClientId] = createSignal('');
    const [description, setDescription] = createSignal('');
    const [status, setStatus] = createSignal<ProjectStatus>('draft');
    const [startDate, setStartDate] = createSignal('');
    const [endDate, setEndDate] = createSignal('');
    const [budget, setBudget] = createSignal('');

    // Fetch clients for select
    createEffect(async () => {
        const { data } = await supabase
            .from('clients')
            .select('*')
            .order('name');
        setClients(data || []);
    });

    // Load template if creating from template
    createEffect(async () => {
        const tplId = templateId();
        if (!tplId || isEditing()) return;

        try {
            // Fetch template info
            const { data: template, error: tplError } = await supabase
                .from('project_templates')
                .select('*')
                .eq('id', tplId)
                .single();

            if (tplError) throw tplError;

            setTemplateName(template.name);
            setDescription(template.description || '');

            // Calculate dates based on default_days
            const today = new Date();
            const endDateCalc = new Date(today.getTime() + template.default_days * 24 * 60 * 60 * 1000);
            setStartDate(today.toISOString().split('T')[0]);
            setEndDate(endDateCalc.toISOString().split('T')[0]);

            // Fetch template tasks
            const { data: tasks, error: tasksError } = await supabase
                .from('template_tasks')
                .select('*')
                .eq('template_id', tplId)
                .order('sort_order');

            if (tasksError) throw tasksError;
            setTemplateTasks(tasks || []);
        } catch (err) {
            console.error('Error loading template:', err);
        }
    });

    // Load existing project if editing
    createEffect(async () => {
        if (!params.id) return;

        setLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('projects')
                .select('*')
                .eq('id', params.id)
                .single();

            if (fetchError) throw fetchError;

            if (data) {
                setName(data.name || '');
                setClientId(data.client_id || '');
                setDescription(data.description || '');
                setStatus(data.status || 'draft');
                setStartDate(data.start_date || '');
                setEndDate(data.end_date || '');
                setBudget(data.budget?.toString() || '');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar projeto');
        } finally {
            setLoading(false);
        }
    });

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        try {
            const projectData = {
                name: name().trim(),
                client_id: clientId(),
                description: description().trim() || null,
                status: status(),
                start_date: startDate() || null,
                end_date: endDate() || null,
                budget: budget() ? parseFloat(budget()) : null,
            };

            if (isEditing()) {
                const { error: updateError } = await supabase
                    .from('projects')
                    .update(projectData)
                    .eq('id', params.id);

                if (updateError) throw updateError;
            } else {
                // Create project
                const { data: newProject, error: insertError } = await supabase
                    .from('projects')
                    .insert({
                        ...projectData,
                        created_by: user()?.id,
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;

                // If we have template tasks, copy them to the new project
                const tasks = templateTasks();
                if (tasks.length > 0 && newProject) {
                    const projectTasks = tasks.map((task, index) => ({
                        project_id: newProject.id,
                        title: task.title,
                        description: task.description,
                        priority: task.priority,
                        estimated_hours: task.estimated_hours,
                        sort_order: index,
                        status: 'backlog' as const,
                        created_by: user()?.id,
                    }));

                    const { error: tasksError } = await supabase
                        .from('tasks')
                        .insert(projectTasks);

                    if (tasksError) {
                        console.error('Error copying template tasks:', tasksError);
                        // Don't throw - project was created, just log the error
                    }
                }
            }

            navigate('/projects');
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar projeto');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir este projeto? Todos os dados associados serão perdidos.')) {
            return;
        }

        setSaving(true);
        try {
            const { error: deleteError } = await supabase
                .from('projects')
                .delete()
                .eq('id', params.id);

            if (deleteError) throw deleteError;
            navigate('/projects');
        } catch (err: any) {
            setError(err.message || 'Erro ao excluir projeto');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppLayout>
            <div class="page-header">
                <h2 class="page-title">
                    {isEditing() ? 'Editar Projeto' : 'Novo Projeto'}
                </h2>
                <p class="page-description">
                    {isEditing() ? 'Atualize as informações do projeto' : 'Preencha os dados do novo projeto'}
                </p>
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
                            <Show when={templateName()}>
                                <div class="alert alert-info" style={{ "margin-bottom": "var(--spacing-4)", display: "flex", "align-items": "center", gap: "var(--spacing-2)" }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                        <line x1="3" y1="9" x2="21" y2="9" />
                                        <line x1="9" y1="21" x2="9" y2="9" />
                                    </svg>
                                    <span>
                                        Criando a partir do template: <strong>{templateName()}</strong>
                                        {templateTasks().length > 0 && ` (${templateTasks().length} tarefas serão adicionadas)`}
                                    </span>
                                </div>
                            </Show>
                            <Show when={error()}>
                                <div class="alert alert-error" style={{ "margin-bottom": "var(--spacing-4)" }}>
                                    {error()}
                                </div>
                            </Show>

                            <div style={{ display: "flex", "flex-direction": "column", gap: "var(--spacing-4)" }}>
                                <div class="form-group">
                                    <label class="form-label" for="name">Nome do Projeto *</label>
                                    <input
                                        id="name"
                                        type="text"
                                        class="form-input"
                                        placeholder="Ex: Redesign de Marca"
                                        value={name()}
                                        onInput={(e) => setName(e.currentTarget.value)}
                                        required
                                        disabled={saving()}
                                    />
                                </div>

                                <div class="form-group">
                                    <label class="form-label" for="client">Cliente *</label>
                                    <select
                                        id="client"
                                        class="form-input"
                                        value={clientId()}
                                        onChange={(e) => setClientId(e.currentTarget.value)}
                                        required
                                        disabled={saving()}
                                    >
                                        <option value="">Selecione um cliente...</option>
                                        <For each={clients()}>
                                            {(client) => (
                                                <option value={client.id}>{client.name}</option>
                                            )}
                                        </For>
                                    </select>
                                    <Show when={clients().length === 0}>
                                        <span class="form-hint">
                                            <a href="/clients/new">Cadastre um cliente primeiro</a>
                                        </span>
                                    </Show>
                                </div>

                                <div class="form-group">
                                    <label class="form-label" for="status">Status</label>
                                    <select
                                        id="status"
                                        class="form-input"
                                        value={status()}
                                        onChange={(e) => setStatus(e.currentTarget.value as ProjectStatus)}
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
                                    <label class="form-label" for="description">Descrição</label>
                                    <textarea
                                        id="description"
                                        class="form-input"
                                        placeholder="Descreva o escopo e objetivos do projeto..."
                                        value={description()}
                                        onInput={(e) => setDescription(e.currentTarget.value)}
                                        disabled={saving()}
                                        rows={4}
                                        style={{ resize: "vertical" }}
                                    />
                                </div>

                                <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "var(--spacing-4)" }}>
                                    <div class="form-group">
                                        <label class="form-label" for="start-date">Data de Início</label>
                                        <input
                                            id="start-date"
                                            type="date"
                                            class="form-input"
                                            value={startDate()}
                                            onInput={(e) => setStartDate(e.currentTarget.value)}
                                            disabled={saving()}
                                        />
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label" for="end-date">Data de Término</label>
                                        <input
                                            id="end-date"
                                            type="date"
                                            class="form-input"
                                            value={endDate()}
                                            onInput={(e) => setEndDate(e.currentTarget.value)}
                                            disabled={saving()}
                                        />
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="form-label" for="budget">Orçamento (R$)</label>
                                    <input
                                        id="budget"
                                        type="number"
                                        class="form-input"
                                        placeholder="0,00"
                                        value={budget()}
                                        onInput={(e) => setBudget(e.currentTarget.value)}
                                        disabled={saving()}
                                        min="0"
                                        step="0.01"
                                    />
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
                                        onClick={() => navigate('/projects')}
                                        disabled={saving()}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        class="btn btn-primary"
                                        disabled={saving() || !name().trim() || !clientId()}
                                    >
                                        <Show when={saving()} fallback={isEditing() ? 'Salvar' : 'Criar Projeto'}>
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
