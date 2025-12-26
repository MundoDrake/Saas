import { Component, Show, For, createSignal, createEffect, createMemo } from 'solid-js';
import { supabase } from '../lib/supabase';
import { AppLayout } from '../components/AppLayout';
import { BarChart } from '../components/BarChart';

interface Transaction {
    id: string;
    type: 'income' | 'expense';
    category: string;
    description: string;
    amount: number;
    date: string;
    status: string;
}

export const ReportsFinancePage: Component = () => {
    const [loading, setLoading] = createSignal(true);
    const [transactions, setTransactions] = createSignal<Transaction[]>([]);

    // Filter
    const [period, setPeriod] = createSignal<'month' | 'quarter' | 'year'>('month');

    // Calculate date range
    const dateRange = createMemo(() => {
        const now = new Date();
        let start: Date;
        let end: Date = now;

        switch (period()) {
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                start = new Date(now.getFullYear(), quarter * 3, 1);
                break;
            case 'year':
                start = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                start = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        return { start, end };
    });

    // Load data
    createEffect(async () => {
        setLoading(true);
        try {
            const { start, end } = dateRange();

            const { data } = await supabase
                .from('finance_transactions')
                .select('*')
                .gte('date', start.toISOString().split('T')[0])
                .lte('date', end.toISOString().split('T')[0])
                .order('date', { ascending: false });

            if (data) {
                setTransactions(data);
            }
        } catch (error) {
            console.error('Error loading finance report:', error);
        } finally {
            setLoading(false);
        }
    });

    // Summary
    const summary = createMemo(() => {
        const all = transactions();
        const income = all
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        const expense = all
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        const balance = income - expense;

        return { income, expense, balance };
    });

    // Monthly chart data
    const chartData = createMemo(() => {
        const byMonth: Record<string, { income: number; expense: number }> = {};
        const all = transactions();

        all.forEach(t => {
            const date = new Date(t.date);
            const monthKey = `${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
            if (!byMonth[monthKey]) {
                byMonth[monthKey] = { income: 0, expense: 0 };
            }
            if (t.type === 'income') {
                byMonth[monthKey].income += t.amount || 0;
            } else {
                byMonth[monthKey].expense += t.amount || 0;
            }
        });

        const months = Object.entries(byMonth).slice(-6);
        const incomeData = months.map(([label, data]) => ({
            label,
            value: data.income,
            color: '#22c55e',
        }));
        const expenseData = months.map(([label, data]) => ({
            label,
            value: data.expense,
            color: '#e03e3e',
        }));

        // Return combined for single chart with alternating colors
        return months.map(([label, data]) => ({
            label,
            value: data.income - data.expense,
            color: data.income >= data.expense ? '#22c55e' : '#e03e3e',
        }));
    });

    // By category
    const byCategory = createMemo(() => {
        const cats: Record<string, { income: number; expense: number }> = {};
        const all = transactions();

        all.forEach(t => {
            const cat = t.category || 'Outros';
            if (!cats[cat]) {
                cats[cat] = { income: 0, expense: 0 };
            }
            if (t.type === 'income') {
                cats[cat].income += t.amount || 0;
            } else {
                cats[cat].expense += t.amount || 0;
            }
        });

        return Object.entries(cats).map(([category, data]) => ({
            category,
            income: data.income,
            expense: data.expense,
            balance: data.income - data.expense,
        }));
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    return (
        <AppLayout>
            <div class="page-header">
                <div>
                    <h2 class="page-title">Relatório Financeiro</h2>
                    <p class="page-description">
                        Acompanhe receitas, despesas e balanço.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div class="report-filters">
                <div class="report-filter">
                    <span class="report-filter-label">Período</span>
                    <select
                        class="form-input report-filter-select"
                        value={period()}
                        onChange={(e) => setPeriod(e.currentTarget.value as any)}
                    >
                        <option value="month">Este Mês</option>
                        <option value="quarter">Este Trimestre</option>
                        <option value="year">Este Ano</option>
                    </select>
                </div>
            </div>

            <Show when={!loading()} fallback={<div class="spinner spinner-lg" style={{ margin: '2rem auto' }} />}>
                {/* Summary */}
                <div class="report-summary">
                    <div class="report-summary-item">
                        <div class="report-summary-label">Receitas</div>
                        <div class="report-summary-value positive">{formatCurrency(summary().income)}</div>
                    </div>
                    <div class="report-summary-item">
                        <div class="report-summary-label">Despesas</div>
                        <div class="report-summary-value negative">{formatCurrency(summary().expense)}</div>
                    </div>
                    <div class="report-summary-item">
                        <div class="report-summary-label">Balanço</div>
                        <div class={`report-summary-value ${summary().balance >= 0 ? 'positive' : 'negative'}`}>
                            {formatCurrency(summary().balance)}
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div class="chart-card" style={{ 'margin-bottom': 'var(--spacing-6)' }}>
                    <h3 class="chart-card-title">Balanço Mensal</h3>
                    <BarChart
                        data={chartData()}
                        height={200}
                        formatValue={(v) => formatCurrency(v)}
                    />
                </div>

                {/* By Category Table */}
                <div class="report-table-container">
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Categoria</th>
                                <th style={{ 'text-align': 'right' }}>Receitas</th>
                                <th style={{ 'text-align': 'right' }}>Despesas</th>
                                <th style={{ 'text-align': 'right' }}>Balanço</th>
                            </tr>
                        </thead>
                        <tbody>
                            <For each={byCategory()}>
                                {(cat) => (
                                    <tr>
                                        <td>{cat.category}</td>
                                        <td style={{ 'text-align': 'right', color: 'var(--color-green)' }}>
                                            {formatCurrency(cat.income)}
                                        </td>
                                        <td style={{ 'text-align': 'right', color: 'var(--color-red)' }}>
                                            {formatCurrency(cat.expense)}
                                        </td>
                                        <td style={{
                                            'text-align': 'right',
                                            'font-weight': '600',
                                            color: cat.balance >= 0 ? 'var(--color-green)' : 'var(--color-red)'
                                        }}>
                                            {formatCurrency(cat.balance)}
                                        </td>
                                    </tr>
                                )}
                            </For>
                            <Show when={byCategory().length === 0}>
                                <tr>
                                    <td colspan="4" style={{ 'text-align': 'center', padding: 'var(--spacing-6)', color: 'var(--color-text-muted)' }}>
                                        Nenhuma transação encontrada no período.
                                    </td>
                                </tr>
                            </Show>
                        </tbody>
                    </table>
                </div>
            </Show>
        </AppLayout>
    );
};
