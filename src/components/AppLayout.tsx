import { Component, Show, ParentComponent, createSignal } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import { useAuth } from '../contexts/AuthContext';
import { useProfileContext } from '../contexts/ProfileContext';
import { Can } from './Can';
import '../styles/theme.css';

/**
 * Reusable app layout with sidebar navigation (Beyond UI Style).
 */
export const AppLayout: ParentComponent = (props) => {
    const { signOut } = useAuth();
    const { profile, role } = useProfileContext();
    const location = useLocation();

    const [collapsed, setCollapsed] = createSignal(false);
    // Auto-expand submenu if on projects or templates route
    const [projectsExpanded, setProjectsExpanded] = createSignal(
        location.pathname.startsWith('/projects') || location.pathname.startsWith('/templates')
    );

    const isActive = (path: string) => {
        if (path === '/dashboard') {
            return location.pathname === '/dashboard';
        }
        return location.pathname.startsWith(path);
    };

    const displayName = () => {
        const p = profile();
        if (p?.full_name) return p.full_name;
        return 'Usuário';
    };

    const avatarInitial = () => {
        const name = displayName();
        return name.charAt(0).toUpperCase();
    };

    const userEmail = () => {
        const p = profile();
        return role()?.description || role()?.name || 'Conta';
    };

    return (
        <div class="app-layout">
            <aside class="sidebar-v2" classList={{ collapsed: collapsed() }}>
                {/* Header */}
                <div class="sidebar-v2-header">
                    <button
                        class="sidebar-v2-logo"
                        onClick={() => setCollapsed(!collapsed())}
                        title={collapsed() ? "Expandir sidebar" : "Recolher sidebar"}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                    </button>
                    <Show when={!collapsed()}>
                        <div class="sidebar-v2-brand">
                            <span class="sidebar-v2-brand-name">Studio Manager</span>
                            <button
                                class="sidebar-v2-toggle"
                                onClick={() => setCollapsed(!collapsed())}
                                title="Recolher"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>
                        </div>
                    </Show>
                </div>

                <nav class="sidebar-v2-nav">
                    <A href="/dashboard" class="sidebar-v2-item" classList={{ active: isActive('/dashboard') }}>
                        <span class="sidebar-v2-item-icon">
                            <i class="ci-House_01"></i>
                        </span>
                        <span class="sidebar-v2-item-text">Dashboard</span>
                    </A>


                    <A href="/kanban" class="sidebar-v2-item" classList={{ active: isActive('/kanban') }}>
                        <span class="sidebar-v2-item-icon">
                            <i class="ci-Loading"></i>
                        </span>
                        <span class="sidebar-v2-item-text">Kanban</span>
                    </A>


                    <A href="/clients" class="sidebar-v2-item" classList={{ active: isActive('/clients') }}>
                        <span class="sidebar-v2-item-icon">
                            <i class="ci-User_02"></i>
                        </span>
                        <span class="sidebar-v2-item-text">Clientes</span>
                    </A>


                    {/* Projects with Submenu */}
                    <button
                        class="sidebar-v2-item"
                        classList={{ active: isActive('/projects'), expanded: projectsExpanded() }}
                        onClick={() => setProjectsExpanded(!projectsExpanded())}
                    >
                        <span class="sidebar-v2-item-icon">
                            <i class="ci-Folder"></i>
                        </span>
                        <span class="sidebar-v2-item-text">Projetos</span>
                        <i class="ci-Chevron_Down sidebar-v2-item-chevron"></i>
                    </button>
                    <Show when={projectsExpanded() && !collapsed()}>
                        <div class="sidebar-v2-submenu">
                            <A href="/projects" class="sidebar-v2-submenu-item" classList={{ active: location.pathname === '/projects' }}>
                                Todos os Projetos
                            </A>
                            <A href="/templates" class="sidebar-v2-submenu-item" classList={{ active: isActive('/templates') }}>
                                Templates
                            </A>
                        </div>
                    </Show>


                    <A href="/timesheet" class="sidebar-v2-item" classList={{ active: isActive('/timesheet') }}>
                        <span class="sidebar-v2-item-icon">
                            <i class="ci-Clock"></i>
                        </span>
                        <span class="sidebar-v2-item-text">Timesheet</span>
                    </A>


                    <A href="/finance" class="sidebar-v2-item" classList={{ active: isActive('/finance') }}>
                        <span class="sidebar-v2-item-icon">
                            <i class="ci-Credit_Card_01"></i>
                        </span>
                        <span class="sidebar-v2-item-text">Financeiro</span>
                    </A>


                    <Can permission="manage_users">
                        <A href="/admin/users" class="sidebar-v2-item" classList={{ active: isActive('/admin') }}>
                            <span class="sidebar-v2-item-icon">
                                <i class="ci-Settings"></i>
                            </span>
                            <span class="sidebar-v2-item-text">Configurações</span>
                        </A>
                    </Can>
                </nav>

                {/* Support Card */}
                <Show when={!collapsed()}>
                    <div class="sidebar-v2-support">
                        <svg class="sidebar-v2-support-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                        </svg>
                        <div class="sidebar-v2-support-title">Need support?</div>
                        <div class="sidebar-v2-support-text">Get in touch with our agents</div>
                        <button class="sidebar-v2-support-btn">Contact us</button>
                    </div>
                </Show>

                {/* Footer - User */}
                <div class="sidebar-v2-footer">
                    <A href="/profile" style={{ "text-decoration": "none" }}>
                        <div class="sidebar-v2-user">
                            <div class="sidebar-v2-user-avatar">
                                {avatarInitial()}
                            </div>
                            <Show when={!collapsed()}>
                                <div class="sidebar-v2-user-info">
                                    <div class="sidebar-v2-user-name">{displayName()}</div>
                                    <div class="sidebar-v2-user-email">{userEmail()}</div>
                                </div>
                            </Show>
                        </div>
                    </A>
                    <Show when={!collapsed()}>
                        <button
                            class="sidebar-v2-item"
                            style={{ "margin-top": "8px" }}
                            onClick={signOut}
                        >
                            <span class="sidebar-v2-item-icon">
                                <i class="ci-Exit"></i>
                            </span>
                            <span class="sidebar-v2-item-text">Sair</span>
                        </button>
                    </Show>
                </div>
            </aside>

            <main class="main-content" classList={{ 'sidebar-collapsed': collapsed() }}>
                <div class="main-body">
                    {props.children}
                </div>
            </main>
        </div>
    );
};
