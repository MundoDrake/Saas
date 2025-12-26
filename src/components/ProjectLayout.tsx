import { ParentComponent, Show, createSignal, createEffect } from 'solid-js';
import { A, useParams, useLocation, useNavigate } from '@solidjs/router';
import { supabase } from '../lib/supabase';

interface Project {
    id: string;
    name: string;
    status: string;
}

/**
 * Layout interno do projeto com sidebar de navegação.
 * Usado para todas as páginas dentro de um projeto específico.
 */
export const ProjectLayout: ParentComponent = (props) => {
    const params = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [project, setProject] = createSignal<Project | null>(null);
    const [loading, setLoading] = createSignal(true);

    createEffect(async () => {
        if (!params.id) return;

        try {
            const { data, error } = await supabase
                .from('projects')
                .select('id, name, status')
                .eq('id', params.id)
                .single();

            if (error) throw error;
            setProject(data);
        } catch (error) {
            console.error('Error loading project:', error);
            navigate('/projects');
        } finally {
            setLoading(false);
        }
    });

    const isActive = (path: string) => {
        const fullPath = `/projects/${params.id}${path}`;
        if (path === '') {
            return location.pathname === `/projects/${params.id}`;
        }
        return location.pathname.startsWith(fullPath);
    };

    return (
        <Show
            when={!loading()}
            fallback={
                <div class="project-layout-loading">
                    <div class="spinner spinner-lg" />
                </div>
            }
        >
            <div class="project-layout">
                {/* Header do Projeto */}
                <header class="project-header">
                    <A href="/projects" class="project-back-btn">
                        <i class="ci-Arrow_Left" style={{ "font-size": "20px" }}></i>
                    </A>
                    <div class="project-header-info">
                        <h1 class="project-header-title">{project()?.name}</h1>
                        <span class={`badge badge-${project()?.status}`}>
                            {project()?.status === 'active' ? 'Ativo' :
                                project()?.status === 'completed' ? 'Concluído' :
                                    project()?.status === 'paused' ? 'Pausado' :
                                        project()?.status === 'cancelled' ? 'Cancelado' : 'Rascunho'}
                        </span>
                    </div>
                </header>

                <div class="project-body">
                    {/* Sidebar do Projeto */}
                    <aside class="project-sidebar">
                        <nav class="project-nav">
                            <div class="project-nav-section">
                                <span class="project-nav-section-title">Projeto</span>
                                <A
                                    href={`/projects/${params.id}`}
                                    class="project-nav-item"
                                    classList={{ active: isActive('') }}
                                >
                                    <i class="ci-Window"></i>
                                    <span>Visão Geral</span>
                                </A>
                                <A
                                    href={`/projects/${params.id}/kanban`}
                                    class="project-nav-item"
                                    classList={{ active: isActive('/kanban') }}
                                >
                                    <i class="ci-Columns"></i>
                                    <span>Kanban</span>
                                </A>
                                <A
                                    href={`/projects/${params.id}/files`}
                                    class="project-nav-item"
                                    classList={{ active: isActive('/files') }}
                                >
                                    <i class="ci-Folder"></i>
                                    <span>Arquivos</span>
                                </A>
                            </div>

                            <div class="project-nav-section">
                                <span class="project-nav-section-title">Marca</span>
                                <A
                                    href={`/projects/${params.id}/strategy`}
                                    class="project-nav-item"
                                    classList={{ active: isActive('/strategy') }}
                                >
                                    <i class="ci-Circle"></i>
                                    <span>Estratégia</span>
                                </A>
                                <A
                                    href={`/projects/${params.id}/colors`}
                                    class="project-nav-item"
                                    classList={{ active: isActive('/colors') }}
                                >
                                    <i class="ci-Swatches_Palette"></i>
                                    <span>Cores</span>
                                </A>
                                <A
                                    href={`/projects/${params.id}/fonts`}
                                    class="project-nav-item"
                                    classList={{ active: isActive('/fonts') }}
                                >
                                    <i class="ci-Text"></i>
                                    <span>Tipografia</span>
                                </A>
                                <A
                                    href={`/projects/${params.id}/voice`}
                                    class="project-nav-item"
                                    classList={{ active: isActive('/voice') }}
                                >
                                    <i class="ci-Headphones"></i>
                                    <span>Tom de Voz</span>
                                </A>
                                <A
                                    href={`/projects/${params.id}/assets`}
                                    class="project-nav-item"
                                    classList={{ active: isActive('/assets') }}
                                >
                                    <i class="ci-Image_01"></i>
                                    <span>Assets</span>
                                </A>
                                <A
                                    href={`/projects/${params.id}/guidelines`}
                                    class="project-nav-item"
                                    classList={{ active: isActive('/guidelines') }}
                                >
                                    <i class="ci-Book"></i>
                                    <span>Diretrizes</span>
                                </A>
                            </div>

                            <div class="project-nav-section">
                                <span class="project-nav-section-title">Configurações</span>
                                <A
                                    href={`/projects/${params.id}/edit`}
                                    class="project-nav-item"
                                    classList={{ active: isActive('/edit') }}
                                >
                                    <i class="ci-Settings"></i>
                                    <span>Configurações</span>
                                </A>
                            </div>
                        </nav>
                    </aside>

                    {/* Conteúdo Principal */}
                    <main class="project-content">
                        {props.children}
                    </main>
                </div>
            </div>
        </Show>
    );
};
