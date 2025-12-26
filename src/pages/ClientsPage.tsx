import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import { A } from '@solidjs/router';
import { useAuth } from '../contexts/AuthContext';
import { useProfileContext } from '../contexts/ProfileContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui';
import type { Client } from '../types/database';
import { AppLayout } from '../components/AppLayout';

export const ClientsPage: Component = () => {
    const [clients, setClients] = createSignal<Client[]>([]);
    const [loading, setLoading] = createSignal(true);
    const [search, setSearch] = createSignal('');
    const [error, setError] = createSignal<string | null>(null);

    const fetchClients = async () => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('clients')
                .select('*')
                .order('name', { ascending: true });

            const searchTerm = search().trim();
            if (searchTerm) {
                query = query.ilike('name', `%${searchTerm}%`);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;
            setClients(data || []);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar clientes');
        } finally {
            setLoading(false);
        }
    };

    createEffect(() => {
        fetchClients();
    });

    // Debounced search
    let searchTimeout: number;
    const handleSearch = (value: string) => {
        setSearch(value);
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(fetchClients, 300);
    };

    return (
        <AppLayout>
            <div class="page-header">
                <div>
                    <h2 class="page-title">Clientes</h2>
                    <p class="page-description">
                        Gerencie sua base de clientes
                    </p>
                </div>
                <Button variant="primary" onClick={() => window.location.href = '/clients/new'} icon={<i class="ci-Add"></i>}>
                    Novo Cliente
                </Button>
            </div>

            {/* Search Bar */}
            <div class="filter-bar">
                <input
                    type="text"
                    class="form-input"
                    placeholder="Buscar por nome..."
                    value={search()}
                    onInput={(e) => handleSearch(e.currentTarget.value)}
                />
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
                    when={clients().length > 0}
                    fallback={
                        <div class="card">
                            <div class="empty-state">
                                <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                <h3 class="empty-state-title">Nenhum cliente cadastrado</h3>
                                <p class="empty-state-description">
                                    Comece adicionando seu primeiro cliente para gerenciar projetos.
                                </p>
                                <Button variant="primary" onClick={() => window.location.href = '/clients/new'}>
                                    Adicionar Primeiro Cliente
                                </Button>
                            </div>
                        </div>
                    }
                >
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Email</th>
                                    <th>Telefone</th>
                                    <th>Cadastrado em</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <For each={clients()}>
                                    {(client) => (
                                        <tr>
                                            <td>
                                                <div style={{ display: "flex", "align-items": "center", gap: "var(--spacing-3)" }}>
                                                    <div
                                                        class="avatar avatar-sm"
                                                        style={{
                                                            background: "var(--color-primary-100)",
                                                            color: "var(--color-primary-700)"
                                                        }}
                                                    >
                                                        {client.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ "font-weight": "500", color: "var(--color-neutral-900)" }}>
                                                            {client.name}
                                                        </div>
                                                        <Show when={client.trading_name}>
                                                            <div style={{ "font-size": "var(--font-size-xs)", color: "var(--color-neutral-500)" }}>
                                                                {client.trading_name}
                                                            </div>
                                                        </Show>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{client.email || '—'}</td>
                                            <td>{client.phone || '—'}</td>
                                            <td>
                                                {new Date(client.created_at).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => window.location.href = `/clients/${client.id}/edit`}
                                                >
                                                    Editar
                                                </Button>
                                            </td>
                                        </tr>
                                    )}
                                </For>
                            </tbody>
                        </table>
                    </div>
                </Show>
            </Show>
        </AppLayout>
    );
};
