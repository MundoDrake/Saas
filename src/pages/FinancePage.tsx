import { Component, Show, For, createSignal, createEffect } from 'solid-js';
import { A } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import { AppLayout } from '../components/AppLayout';
import type { FinancialType, FinancialStatus, ExpenseCategory } from '../types/database';

interface FinancialEntry {
    id: string;
    type: FinancialType;
    category: ExpenseCategory;
    description: string;
    amount: number;
    currency: string;
    date: string;
    client_id: string | null;
    project_id: string | null;
    invoice_number: string | null;
    status: FinancialStatus;
    created_by: string | null;
    created_at: string;
    client?: { id: string; name: string };
    project?: { id: string; name: string };
}

const STATUS_LABELS: Record<FinancialStatus, string> = {
    pending: 'Pendente',
    paid: 'Pago',
    cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<FinancialStatus, string> = {
    pending: 'var(--color-orange)',
    paid: 'var(--color-green)',
    cancelled: 'var(--color-gray)',
};

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
    operational: 'Operacional',
    personnel: 'Pessoal',
    software: 'Software',
    marketing: 'Marketing',
    other: 'Outros',
};

export const FinancePage: Component = () => {
    const [entries, setEntries] = createSignal<FinancialEntry[]>([]);
    const [loading, setLoading] = createSignal(true);
    const [tab, setTab] = createSignal<'all' | 'income' | 'expense'>('all');
    const [dateFilter, setDateFilter] = createSignal<'month' | 'quarter' | 'year' | 'all'>('month');

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const now = new Date();
            let startDate: string | undefined;

            switch (dateFilter()) {
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                    break;
                case 'quarter':
                    const quarter = Math.floor(now.getMonth() / 3) * 3;
                    startDate = new Date(now.getFullYear(), quarter, 1).toISOString().split('T')[0];
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
                    break;
            }

            let query = supabase
                .from('financial_entries')
                .select(`*, client:clients(id, name), project:projects(id, name)`)
                .order('date', { ascending: false });

            if (startDate) {
                query = query.gte('date', startDate);
            }

            if (tab() !== 'all') {
                query = query.eq('type', tab());
            }

            const { data, error } = await query;
            if (error) throw error;
            setEntries(data || []);
        } catch (err) {
            console.error('Error fetching entries:', err);
        } finally {
            setLoading(false);
        }
    };

    createEffect(() => {
        tab();
        dateFilter();
        fetchEntries();
    });

    // Statistics
    const totalIncome = () => entries()
        .filter(e => e.type === 'income' && e.status !== 'cancelled')
        .reduce((sum, e) => sum + (e.amount || 0), 0);

    const totalExpenses = () => entries()
        .filter(e => e.type === 'expense' && e.status !== 'cancelled')
        .reduce((sum, e) => sum + (e.amount || 0), 0);

    const balance = () => totalIncome() - totalExpenses();

    const pendingIncome = () => entries()
        .filter(e => e.type === 'income' && e.status === 'pending')
        .reduce((sum, e) => sum + (e.amount || 0), 0);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const handleDelete = async (id: string) => {
        if (confirm('Excluir este lançamento?')) {
            await supabase.from('financial_entries').delete().eq('id', id);
            fetchEntries();
        }
    };

    const handleStatusChange = async (id: string, status: FinancialStatus) => {
        await supabase.from('financial_entries').update({ status }).eq('id', id);
        fetchEntries();
    };

    return (
        <AppLayout>
            <div class="page-header">
                <div>
                    <h2 class="page-title">Financeiro</h2>
                    <p class="page-description">Gerencie receitas e despesas</p>
                </div>
                <A href="/finance/new" class="btn btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Novo Lançamento
                </A>
            </div>

            {/* Summary Cards */}
            <div class="finance-summary">
                <div class="finance-summary-card finance-summary-income">
                    <div class="finance-summary-label">Receitas</div>
                    <div class="finance-summary-value">{formatCurrency(totalIncome())}</div>
                    <Show when={pendingIncome() > 0}>
                        <div class="finance-summary-pending">
                            {formatCurrency(pendingIncome())} pendente
                        </div>
                    </Show>
                </div>

                <div class="finance-summary-card finance-summary-expense">
                    <div class="finance-summary-label">Despesas</div>
                    <div class="finance-summary-value">{formatCurrency(totalExpenses())}</div>
                </div>

                <div class="finance-summary-card" classList={{ 'finance-summary-positive': balance() >= 0, 'finance-summary-negative': balance() < 0 }}>
                    <div class="finance-summary-label">Saldo</div>
                    <div class="finance-summary-value">{formatCurrency(balance())}</div>
                </div>
            </div>

            {/* Filters */}
            <div class="filter-bar" style={{ "justify-content": "space-between" }}>
                <div class="view-tabs">
                    <button class="view-tab" classList={{ active: tab() === 'all' }} onClick={() => setTab('all')}>
                        Todos
                    </button>
                    <button class="view-tab" classList={{ active: tab() === 'income' }} onClick={() => setTab('income')}>
                        Receitas
                    </button>
                    <button class="view-tab" classList={{ active: tab() === 'expense' }} onClick={() => setTab('expense')}>
                        Despesas
                    </button>
                </div>

                <div class="view-tabs">
                    <button class="view-tab" classList={{ active: dateFilter() === 'month' }} onClick={() => setDateFilter('month')}>
                        Mês
                    </button>
                    <button class="view-tab" classList={{ active: dateFilter() === 'quarter' }} onClick={() => setDateFilter('quarter')}>
                        Trimestre
                    </button>
                    <button class="view-tab" classList={{ active: dateFilter() === 'year' }} onClick={() => setDateFilter('year')}>
                        Ano
                    </button>
                    <button class="view-tab" classList={{ active: dateFilter() === 'all' }} onClick={() => setDateFilter('all')}>
                        Tudo
                    </button>
                </div>
            </div>

            {/* Entries List */}
            <Show
                when={!loading()}
                fallback={
                    <div class="loading-container">
                        <div class="spinner spinner-lg" />
                    </div>
                }
            >
                <Show
                    when={entries().length > 0}
                    fallback={
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <line x1="12" y1="1" x2="12" y2="23" />
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                            <h3 class="empty-state-title">Nenhum lançamento</h3>
                            <p class="empty-state-description">Crie seu primeiro lançamento financeiro.</p>
                            <A href="/finance/new" class="btn btn-primary" style={{ "margin-top": "var(--spacing-4)" }}>
                                Novo Lançamento
                            </A>
                        </div>
                    }
                >
                    <div class="finance-list">
                        <For each={entries()}>
                            {(entry) => (
                                <div class="finance-item">
                                    <div class="finance-item-type" classList={{ 'finance-item-income': entry.type === 'income', 'finance-item-expense': entry.type === 'expense' }}>
                                        <Show
                                            when={entry.type === 'income'}
                                            fallback={
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                    <line x1="21" y1="21" x2="3" y2="21" />
                                                </svg>
                                            }
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <polyline points="17 14 12 9 7 14" />
                                                <line x1="12" y1="9" x2="12" y2="21" />
                                                <line x1="21" y1="3" x2="3" y2="3" />
                                            </svg>
                                        </Show>
                                    </div>

                                    <div class="finance-item-info">
                                        <div class="finance-item-description">{entry.description}</div>
                                        <div class="finance-item-meta">
                                            <span>{formatDate(entry.date)}</span>
                                            <Show when={entry.client}>
                                                <span>• {entry.client?.name}</span>
                                            </Show>
                                            <Show when={entry.invoice_number}>
                                                <span>• NF {entry.invoice_number}</span>
                                            </Show>
                                        </div>
                                    </div>

                                    <div class="finance-item-amount" classList={{ 'finance-amount-income': entry.type === 'income', 'finance-amount-expense': entry.type === 'expense' }}>
                                        {entry.type === 'expense' ? '-' : '+'}{formatCurrency(entry.amount)}
                                    </div>

                                    <select
                                        class="finance-item-status"
                                        value={entry.status}
                                        onChange={(e) => handleStatusChange(entry.id, e.currentTarget.value as FinancialStatus)}
                                        style={{ "border-color": STATUS_COLORS[entry.status], color: STATUS_COLORS[entry.status] }}
                                    >
                                        <option value="pending">Pendente</option>
                                        <option value="paid">Pago</option>
                                        <option value="cancelled">Cancelado</option>
                                    </select>

                                    <div class="finance-item-actions">
                                        <A href={`/finance/${entry.id}/edit`} class="finance-item-action" title="Editar">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                        </A>
                                        <button class="finance-item-action finance-item-action-danger" onClick={() => handleDelete(entry.id)} title="Excluir">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </For>
                    </div>
                </Show>
            </Show>
        </AppLayout>
    );
};
