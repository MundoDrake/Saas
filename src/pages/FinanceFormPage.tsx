import { Component, Show, For, createSignal, createEffect } from 'solid-js';
import { A, useNavigate, useParams } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AppLayout } from '../components/AppLayout';
import type { FinancialType, FinancialStatus, ExpenseCategory, Client, Project } from '../types/database';

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
    { value: 'operational', label: 'Operacional' },
    { value: 'personnel', label: 'Pessoal' },
    { value: 'software', label: 'Software' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'other', label: 'Outros' },
];

export const FinanceFormPage: Component = () => {
    const params = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const isEditing = () => !!params.id;

    const [loading, setLoading] = createSignal(false);
    const [saving, setSaving] = createSignal(false);
    const [clients, setClients] = createSignal<Client[]>([]);
    const [projects, setProjects] = createSignal<Project[]>([]);

    // Form fields
    const [type, setType] = createSignal<FinancialType>('income');
    const [category, setCategory] = createSignal<ExpenseCategory>('other');
    const [description, setDescription] = createSignal('');
    const [amount, setAmount] = createSignal('');
    const [date, setDate] = createSignal(new Date().toISOString().split('T')[0]);
    const [clientId, setClientId] = createSignal<string>('');
    const [projectId, setProjectId] = createSignal<string>('');
    const [invoiceNumber, setInvoiceNumber] = createSignal('');
    const [status, setStatus] = createSignal<FinancialStatus>('pending');

    // Fetch clients
    createEffect(async () => {
        const { data } = await supabase
            .from('clients')
            .select('*')
            .order('name');
        setClients(data || []);
    });

    // Fetch projects when client changes
    createEffect(async () => {
        const cid = clientId();
        if (!cid) {
            setProjects([]);
            return;
        }
        const { data } = await supabase
            .from('projects')
            .select('*')
            .eq('client_id', cid)
            .order('name');
        setProjects(data || []);
    });

    // Load existing entry
    createEffect(async () => {
        if (!isEditing()) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('financial_entries')
                .select('*')
                .eq('id', params.id)
                .single();

            if (error) throw error;
            if (data) {
                setType(data.type);
                setCategory(data.category);
                setDescription(data.description);
                setAmount(data.amount.toString());
                setDate(data.date);
                setClientId(data.client_id || '');
                setProjectId(data.project_id || '');
                setInvoiceNumber(data.invoice_number || '');
                setStatus(data.status);
            }
        } catch (err) {
            console.error('Error loading entry:', err);
        } finally {
            setLoading(false);
        }
    });

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        if (!description() || !amount()) return;

        setSaving(true);
        try {
            const entryData = {
                type: type(),
                category: category(),
                description: description(),
                amount: parseFloat(amount().replace(',', '.')),
                currency: 'BRL',
                date: date(),
                client_id: clientId() || null,
                project_id: projectId() || null,
                invoice_number: invoiceNumber() || null,
                status: status(),
                created_by: user()?.id,
            };

            if (isEditing()) {
                const { error } = await supabase
                    .from('financial_entries')
                    .update(entryData)
                    .eq('id', params.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('financial_entries')
                    .insert(entryData);
                if (error) throw error;
            }

            navigate('/finance');
        } catch (err) {
            console.error('Error saving entry:', err);
            alert('Erro ao salvar lançamento');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppLayout>
            <div class="page-header">
                <div>
                    <h2 class="page-title">{isEditing() ? 'Editar Lançamento' : 'Novo Lançamento'}</h2>
                    <p class="page-description">
                        {isEditing() ? 'Atualize os dados do lançamento' : 'Registre uma receita ou despesa'}
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
                    {/* Type Toggle */}
                    <div class="form-group">
                        <label class="form-label">Tipo</label>
                        <div class="finance-type-toggle">
                            <button
                                type="button"
                                class="finance-type-btn"
                                classList={{ 'finance-type-income': true, active: type() === 'income' }}
                                onClick={() => setType('income')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="17 14 12 9 7 14" />
                                    <line x1="12" y1="9" x2="12" y2="21" />
                                </svg>
                                Receita
                            </button>
                            <button
                                type="button"
                                class="finance-type-btn"
                                classList={{ 'finance-type-expense': true, active: type() === 'expense' }}
                                onClick={() => setType('expense')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Despesa
                            </button>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group" style={{ flex: 2 }}>
                            <label class="form-label">Descrição *</label>
                            <input
                                type="text"
                                class="form-input"
                                value={description()}
                                onInput={(e) => setDescription(e.currentTarget.value)}
                                placeholder="Ex: Pagamento serviço de design"
                                required
                            />
                        </div>

                        <div class="form-group" style={{ flex: 1 }}>
                            <label class="form-label">Valor (R$) *</label>
                            <input
                                type="text"
                                class="form-input"
                                value={amount()}
                                onInput={(e) => setAmount(e.currentTarget.value)}
                                placeholder="0,00"
                                required
                            />
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Data</label>
                            <input
                                type="date"
                                class="form-input"
                                value={date()}
                                onInput={(e) => setDate(e.currentTarget.value)}
                            />
                        </div>

                        <div class="form-group">
                            <label class="form-label">Categoria</label>
                            <select
                                class="form-input"
                                value={category()}
                                onChange={(e) => setCategory(e.currentTarget.value as ExpenseCategory)}
                            >
                                <For each={CATEGORY_OPTIONS}>
                                    {(opt) => <option value={opt.value}>{opt.label}</option>}
                                </For>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Status</label>
                            <select
                                class="form-input"
                                value={status()}
                                onChange={(e) => setStatus(e.currentTarget.value as FinancialStatus)}
                            >
                                <option value="pending">Pendente</option>
                                <option value="paid">Pago</option>
                                <option value="cancelled">Cancelado</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Cliente</label>
                            <select
                                class="form-input"
                                value={clientId()}
                                onChange={(e) => {
                                    setClientId(e.currentTarget.value);
                                    setProjectId('');
                                }}
                            >
                                <option value="">Nenhum</option>
                                <For each={clients()}>
                                    {(client) => <option value={client.id}>{client.name}</option>}
                                </For>
                            </select>
                        </div>

                        <Show when={clientId()}>
                            <div class="form-group">
                                <label class="form-label">Projeto</label>
                                <select
                                    class="form-input"
                                    value={projectId()}
                                    onChange={(e) => setProjectId(e.currentTarget.value)}
                                >
                                    <option value="">Nenhum</option>
                                    <For each={projects()}>
                                        {(project) => <option value={project.id}>{project.name}</option>}
                                    </For>
                                </select>
                            </div>
                        </Show>

                        <div class="form-group">
                            <label class="form-label">Nº Nota Fiscal</label>
                            <input
                                type="text"
                                class="form-input"
                                value={invoiceNumber()}
                                onInput={(e) => setInvoiceNumber(e.currentTarget.value)}
                                placeholder="Opcional"
                            />
                        </div>
                    </div>

                    <div class="form-actions">
                        <A href="/finance" class="btn btn-ghost">Cancelar</A>
                        <button type="submit" class="btn btn-primary" disabled={saving()}>
                            <Show when={saving()} fallback="Salvar">
                                <div class="spinner spinner-sm" /> Salvando...
                            </Show>
                        </button>
                    </div>
                </form>
            </Show>
        </AppLayout>
    );
};
