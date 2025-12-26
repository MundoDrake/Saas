import { Component, Show, For, createSignal, createEffect } from 'solid-js';
import { A, useNavigate, useParams } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AppLayout } from '../components/AppLayout';
import type { TaskPriority } from '../types/database';

interface TemplateTask {
    id?: string;
    title: string;
    description: string;
    priority: TaskPriority;
    estimated_hours: number | null;
    sort_order: number;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
    { value: 'low', label: 'Baixa' },
    { value: 'medium', label: 'Média' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' },
];

export const TemplateFormPage: Component = () => {
    const params = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const isEditing = () => !!params.id;

    const [loading, setLoading] = createSignal(false);
    const [saving, setSaving] = createSignal(false);

    // Template fields
    const [name, setName] = createSignal('');
    const [description, setDescription] = createSignal('');
    const [defaultDays, setDefaultDays] = createSignal(30);

    // Tasks
    const [tasks, setTasks] = createSignal<TemplateTask[]>([]);
    const [newTaskTitle, setNewTaskTitle] = createSignal('');

    // Load existing template
    createEffect(async () => {
        if (!isEditing()) return;

        setLoading(true);
        try {
            const { data: template, error } = await supabase
                .from('project_templates')
                .select('*')
                .eq('id', params.id)
                .single();

            if (error) throw error;

            setName(template.name);
            setDescription(template.description || '');
            setDefaultDays(template.default_days || 30);

            // Load tasks
            const { data: tasksData } = await supabase
                .from('template_tasks')
                .select('*')
                .eq('template_id', params.id)
                .order('sort_order');

            setTasks(tasksData || []);
        } catch (err) {
            console.error('Error loading template:', err);
        } finally {
            setLoading(false);
        }
    });

    const handleAddTask = () => {
        const title = newTaskTitle().trim();
        if (!title) return;

        setTasks(prev => [
            ...prev,
            {
                title,
                description: '',
                priority: 'medium',
                estimated_hours: null,
                sort_order: prev.length,
            },
        ]);
        setNewTaskTitle('');
    };

    const handleRemoveTask = (index: number) => {
        setTasks(prev => prev.filter((_, i) => i !== index));
    };

    const handleTaskChange = (index: number, field: keyof TemplateTask, value: any) => {
        setTasks(prev => prev.map((task, i) =>
            i === index ? { ...task, [field]: value } : task
        ));
    };

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        if (!name()) return;

        setSaving(true);
        try {
            let templateId = params.id;

            if (isEditing()) {
                // Update template
                const { error } = await supabase
                    .from('project_templates')
                    .update({
                        name: name(),
                        description: description() || null,
                        default_days: defaultDays(),
                    })
                    .eq('id', params.id);

                if (error) throw error;

                // Delete old tasks
                await supabase
                    .from('template_tasks')
                    .delete()
                    .eq('template_id', params.id);
            } else {
                // Create template
                const { data, error } = await supabase
                    .from('project_templates')
                    .insert({
                        name: name(),
                        description: description() || null,
                        default_days: defaultDays(),
                        created_by: user()?.id,
                    })
                    .select()
                    .single();

                if (error) throw error;
                templateId = data.id;
            }

            // Insert tasks
            if (tasks().length > 0) {
                const { error } = await supabase
                    .from('template_tasks')
                    .insert(
                        tasks().map((task, index) => ({
                            template_id: templateId,
                            title: task.title,
                            description: task.description || null,
                            priority: task.priority,
                            estimated_hours: task.estimated_hours,
                            sort_order: index,
                        }))
                    );

                if (error) throw error;
            }

            navigate('/templates');
        } catch (err) {
            console.error('Error saving template:', err);
            alert('Erro ao salvar template');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppLayout>
            <div class="page-header">
                <div>
                    <h2 class="page-title">{isEditing() ? 'Editar Template' : 'Novo Template'}</h2>
                    <p class="page-description">
                        {isEditing() ? 'Atualize o template de projeto' : 'Crie um modelo reutilizável de projeto'}
                    </p>
                </div>
            </div>

            <Show
                when={!loading()}
                fallback={
                    <div class="loading-container">
                        <div class="spinner spinner-lg" />
                    </div>
                }
            >
                <form onSubmit={handleSubmit} class="form-card">
                    {/* Template Info */}
                    <div class="form-group">
                        <label class="form-label">Nome do Template *</label>
                        <input
                            type="text"
                            class="form-input"
                            value={name()}
                            onInput={(e) => setName(e.currentTarget.value)}
                            placeholder="Ex: Website Institucional"
                            required
                        />
                    </div>

                    <div class="form-row">
                        <div class="form-group" style={{ flex: 2 }}>
                            <label class="form-label">Descrição</label>
                            <textarea
                                class="form-input"
                                value={description()}
                                onInput={(e) => setDescription(e.currentTarget.value)}
                                placeholder="Breve descrição do que este template inclui"
                                rows={2}
                            />
                        </div>

                        <div class="form-group" style={{ flex: 1 }}>
                            <label class="form-label">Duração Padrão (dias)</label>
                            <input
                                type="number"
                                class="form-input"
                                value={defaultDays()}
                                onInput={(e) => setDefaultDays(parseInt(e.currentTarget.value) || 30)}
                                min={1}
                            />
                        </div>
                    </div>

                    {/* Tasks Section */}
                    <div class="template-tasks-section">
                        <h3 class="template-tasks-title">Tarefas do Template</h3>

                        <div class="template-task-add">
                            <input
                                type="text"
                                class="form-input"
                                value={newTaskTitle()}
                                onInput={(e) => setNewTaskTitle(e.currentTarget.value)}
                                placeholder="Título da tarefa..."
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
                            />
                            <button type="button" class="btn btn-secondary" onClick={handleAddTask}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Adicionar
                            </button>
                        </div>

                        <Show when={tasks().length > 0}>
                            <div class="template-tasks-list">
                                <For each={tasks()}>
                                    {(task, index) => (
                                        <div class="template-task-item">
                                            <div class="template-task-drag">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <circle cx="9" cy="5" r="1" />
                                                    <circle cx="9" cy="12" r="1" />
                                                    <circle cx="9" cy="19" r="1" />
                                                    <circle cx="15" cy="5" r="1" />
                                                    <circle cx="15" cy="12" r="1" />
                                                    <circle cx="15" cy="19" r="1" />
                                                </svg>
                                            </div>

                                            <div class="template-task-content">
                                                <input
                                                    type="text"
                                                    class="form-input form-input-sm"
                                                    value={task.title}
                                                    onInput={(e) => handleTaskChange(index(), 'title', e.currentTarget.value)}
                                                    placeholder="Título"
                                                />
                                                <div class="template-task-row">
                                                    <select
                                                        class="form-input form-input-sm"
                                                        value={task.priority}
                                                        onChange={(e) => handleTaskChange(index(), 'priority', e.currentTarget.value)}
                                                    >
                                                        <For each={PRIORITY_OPTIONS}>
                                                            {(opt) => <option value={opt.value}>{opt.label}</option>}
                                                        </For>
                                                    </select>
                                                    <input
                                                        type="number"
                                                        class="form-input form-input-sm"
                                                        value={task.estimated_hours || ''}
                                                        onInput={(e) => handleTaskChange(index(), 'estimated_hours', parseFloat(e.currentTarget.value) || null)}
                                                        placeholder="Horas"
                                                        style={{ width: "80px" }}
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                class="template-task-remove"
                                                onClick={() => handleRemoveTask(index())}
                                                title="Remover"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </For>
                            </div>
                        </Show>
                    </div>

                    <div class="form-actions">
                        <A href="/templates" class="btn btn-ghost">Cancelar</A>
                        <button type="submit" class="btn btn-primary" disabled={saving()}>
                            <Show when={saving()} fallback="Salvar Template">
                                <div class="spinner spinner-sm" /> Salvando...
                            </Show>
                        </button>
                    </div>
                </form>
            </Show>
        </AppLayout>
    );
};
