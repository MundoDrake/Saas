import { Component, Show, For, createSignal, createEffect } from 'solid-js';
import { A } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import { AppLayout } from '../components/AppLayout';

interface ProjectTemplate {
    id: string;
    name: string;
    description: string | null;
    default_days: number;
    created_by: string;
    created_at: string;
    task_count?: number;
}

export const TemplatesPage: Component = () => {
    const [templates, setTemplates] = createSignal<ProjectTemplate[]>([]);
    const [loading, setLoading] = createSignal(true);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('project_templates')
                .select(`
          *,
          template_tasks(id)
        `)
                .order('name');

            if (error) throw error;

            const templatesWithCount = (data || []).map((t: any) => ({
                ...t,
                task_count: t.template_tasks?.length || 0,
            }));

            setTemplates(templatesWithCount);
        } catch (err) {
            console.error('Error fetching templates:', err);
        } finally {
            setLoading(false);
        }
    };

    createEffect(() => {
        fetchTemplates();
    });

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Excluir o template "${name}"? As tarefas do template também serão removidas.`)) {
            const { error } = await supabase
                .from('project_templates')
                .delete()
                .eq('id', id);

            if (!error) {
                fetchTemplates();
            }
        }
    };

    return (
        <AppLayout>
            <div class="page-header">
                <div>
                    <h2 class="page-title">Templates de Projeto</h2>
                    <p class="page-description">Crie projetos rapidamente a partir de modelos</p>
                </div>
                <A href="/templates/new" class="btn btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Novo Template
                </A>
            </div>

            <Show
                when={!loading()}
                fallback={
                    <div class="loading-container">
                        <div class="spinner spinner-lg" />
                    </div>
                }
            >
                <Show
                    when={templates().length > 0}
                    fallback={
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <line x1="3" y1="9" x2="21" y2="9" />
                                    <line x1="9" y1="21" x2="9" y2="9" />
                                </svg>
                            </div>
                            <h3 class="empty-state-title">Nenhum template</h3>
                            <p class="empty-state-description">
                                Crie templates para projetos recorrentes e economize tempo.
                            </p>
                            <A href="/templates/new" class="btn btn-primary" style={{ "margin-top": "var(--spacing-4)" }}>
                                Criar Primeiro Template
                            </A>
                        </div>
                    }
                >
                    <div class="templates-grid">
                        <For each={templates()}>
                            {(template) => (
                                <div class="template-card">
                                    <div class="template-card-header">
                                        <div class="template-icon">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                <line x1="3" y1="9" x2="21" y2="9" />
                                                <line x1="9" y1="21" x2="9" y2="9" />
                                            </svg>
                                        </div>
                                        <div class="template-actions">
                                            <A href={`/templates/${template.id}/edit`} class="template-action" title="Editar">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </A>
                                            <button class="template-action template-action-danger" onClick={() => handleDelete(template.id, template.name)} title="Excluir">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <h3 class="template-name">{template.name}</h3>

                                    <Show when={template.description}>
                                        <p class="template-description">{template.description}</p>
                                    </Show>

                                    <div class="template-meta">
                                        <span class="template-stat">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <polyline points="9 11 12 14 22 4" />
                                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                            </svg>
                                            {template.task_count} tarefas
                                        </span>
                                        <span class="template-stat">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                            {template.default_days} dias
                                        </span>
                                    </div>

                                    <A href={`/projects/new?template=${template.id}`} class="btn btn-secondary" style={{ width: "100%", "margin-top": "var(--spacing-3)" }}>
                                        Usar Template
                                    </A>
                                </div>
                            )}
                        </For>
                    </div>
                </Show>
            </Show>
        </AppLayout>
    );
};
