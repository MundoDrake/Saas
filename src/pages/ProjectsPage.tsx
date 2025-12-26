import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import { A, useSearchParams, useNavigate } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import type { Project, Client, ProjectStatus } from '../types/database';
import { AppLayout } from '../components/AppLayout';
import { QuickProjectModal } from '../components/QuickProjectModal';
import { EditProjectModal } from '../components/EditProjectModal';
import { Button } from '../components/ui';
import '../styles/projects.css';
import '../styles/quick-project-modal.css';

const STATUS_LABELS: Record<ProjectStatus, string> = {
    draft: 'Rascunho',
    active: 'Ativo',
    paused: 'Pausado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
    draft: 'badge-neutral',
    active: 'badge-success',
    paused: 'badge-warning',
    completed: 'badge-primary',
    cancelled: 'badge-error',
};

interface ProjectWithClient extends Project {
    client: Client;
}

export const ProjectsPage: Component = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [projects, setProjects] = createSignal<ProjectWithClient[]>([]);
    const [clients, setClients] = createSignal<Client[]>([]);
    const [loading, setLoading] = createSignal(true);
    const [error, setError] = createSignal<string | null>(null);

    // Modal state
    const [showModal, setShowModal] = createSignal(false);
    const [showEditModal, setShowEditModal] = createSignal(false);
    const [editingProjectId, setEditingProjectId] = createSignal<string | null>(null);

    // Filters
    const [search, setSearch] = createSignal(typeof searchParams.search === 'string' ? searchParams.search : '');
    const [statusFilter, setStatusFilter] = createSignal<ProjectStatus | ''>(
        (searchParams.status as ProjectStatus) || ''
    );
    const [clientFilter, setClientFilter] = createSignal(searchParams.client || '');

    // Handle opening edit modal
    const handleOpenEditModal = (e: Event, projectId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingProjectId(projectId);
        setShowEditModal(true);
    };

    // Fetch clients for filter
    const fetchClients = async () => {
        const { data } = await supabase
            .from('clients')
            .select('id, name')
            .order('name');
        setClients((data as Client[]) || []);
    };

    // Initialize clients on mount
    fetchClients();

    const fetchProjects = async () => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('projects')
                .select(`
                    *,
                    client:clients(*)
                `)
                .order('created_at', { ascending: false });

            const searchTerm = search().trim();
            if (searchTerm) {
                query = query.ilike('name', `%${searchTerm}%`);
            }

            if (statusFilter()) {
                query = query.eq('status', statusFilter());
            }

            if (clientFilter()) {
                query = query.eq('client_id', clientFilter());
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;
            setProjects((data as ProjectWithClient[]) || []);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar projetos');
        } finally {
            setLoading(false);
        }
    };

    createEffect(() => {
        setSearchParams({
            search: search() || undefined,
            status: statusFilter() || undefined,
            client: clientFilter() || undefined,
        });
        fetchProjects();
    });

    let searchTimeout: number;
    const handleSearch = (value: string) => {
        setSearch(value);
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(fetchProjects, 300);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <AppLayout>
            <div class="page-header">
                <div>
                    <h2 class="page-title">Projetos</h2>
                    <p class="page-description">
                        Gerencie os projetos da sua agência
                    </p>
                </div>
                <Button variant="primary" onClick={() => setShowModal(true)} icon={<i class="ci-Add"></i>}>
                    Novo Projeto
                </Button>
            </div>

            {/* Filters */}
            <div class="filter-bar">
                <input
                    type="text"
                    class="form-input"
                    placeholder="Buscar por nome..."
                    value={search()}
                    onInput={(e) => handleSearch(e.currentTarget.value)}
                />

                <select
                    class="form-input"
                    value={statusFilter()}
                    onChange={(e) => setStatusFilter(e.currentTarget.value as ProjectStatus | '')}
                >
                    <option value="">Status</option>
                    <For each={Object.entries(STATUS_LABELS)}>
                        {([value, label]) => (
                            <option value={value}>{label}</option>
                        )}
                    </For>
                </select>

                <select
                    class="form-input"
                    value={clientFilter()}
                    onChange={(e) => setClientFilter(e.currentTarget.value)}
                >
                    <option value="">Clientes</option>
                    <For each={clients()}>
                        {(client) => (
                            <option value={client.id}>{client.name}</option>
                        )}
                    </For>
                </select>

                <Show when={search() || statusFilter() || clientFilter()}>
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setSearch('');
                            setStatusFilter('');
                            setClientFilter('');
                        }}
                    >
                        Limpar filtros
                    </Button>
                </Show>
            </div>

            <Show when={error()}>
                <div class="alert alert-error" style={{ "margin-bottom": "var(--spacing-4)" }}>
                    {error()}
                </div>
            </Show>

            <Show
                when={!loading()}
                fallback={
                    <div class="loading-container">
                        <div class="spinner spinner-lg" />
                    </div>
                }
            >
                <Show
                    when={projects().length > 0}
                    fallback={
                        <div class="card">
                            <div class="empty-state">
                                <i class="ci-Folder" style={{ "font-size": "48px", opacity: 0.3 }}></i>
                                <h3 class="empty-state-title">Nenhum projeto encontrado</h3>
                                <p class="empty-state-description">
                                    {search() || statusFilter() || clientFilter()
                                        ? 'Tente ajustar os filtros de busca.'
                                        : 'Comece criando seu primeiro projeto.'}
                                </p>
                                <Show when={!search() && !statusFilter() && !clientFilter()}>
                                    <Button variant="primary" onClick={() => window.location.href = '/projects/new'}>
                                        Criar Primeiro Projeto
                                    </Button>
                                </Show>
                            </div>
                        </div>
                    }
                >
                    {/* 2-column grid */}
                    <div class="projects-grid">
                        <For each={projects()}>
                            {(project) => (
                                <A
                                    href={`/projects/${project.id}`}
                                    class="project-cover-card"
                                >
                                    {/* Cover Image or Placeholder */}
                                    <Show
                                        when={project.cover_image}
                                        fallback={
                                            <div class="project-cover-placeholder">
                                                <i class="ci-Folder project-cover-placeholder-icon" style={{ "font-size": "64px" }}></i>
                                            </div>
                                        }
                                    >
                                        <img
                                            src={project.cover_image!}
                                            alt={project.name}
                                            class="project-cover-image"
                                        />
                                    </Show>

                                    {/* Gradient overlay */}
                                    <div class="project-cover-overlay" />

                                    {/* Status badge */}
                                    <div class="project-cover-status">
                                        <span class={`badge ${STATUS_COLORS[project.status]}`}>
                                            {STATUS_LABELS[project.status]}
                                        </span>
                                    </div>

                                    {/* Options button */}
                                    <button
                                        class="project-cover-edit-btn"
                                        onClick={(e) => handleOpenEditModal(e, project.id)}
                                        title="Editar projeto"
                                    >
                                        <i class="ci-Menu_Duo_MD"></i>
                                    </button>

                                    {/* Content at bottom left */}
                                    <div class="project-cover-content">
                                        <Show when={project.start_date}>
                                            <div class="project-cover-date">
                                                Início: {formatDate(project.start_date)}
                                            </div>
                                        </Show>
                                        <h3 class="project-cover-name">{project.name}</h3>
                                        <div class="project-cover-client">
                                            {project.client?.name || 'Sem cliente'}
                                        </div>
                                    </div>

                                    {/* Arrow icon */}
                                    <i class="ci-Arrow_Up_Right project-cover-arrow"></i>
                                </A>
                            )}
                        </For>
                    </div>
                </Show>
            </Show>

            {/* Quick Project Modal */}
            <QuickProjectModal
                isOpen={showModal()}
                onClose={() => setShowModal(false)}
                onSuccess={(projectId) => {
                    setShowModal(false);
                    fetchProjects();
                    navigate(`/projects/${projectId}`);
                }}
            />

            {/* Edit Project Modal */}
            <EditProjectModal
                isOpen={showEditModal()}
                projectId={editingProjectId()}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingProjectId(null);
                }}
                onSuccess={() => {
                    setShowEditModal(false);
                    setEditingProjectId(null);
                    fetchProjects();
                }}
            />
        </AppLayout>
    );
};
