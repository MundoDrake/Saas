import { Component, Show, For, createSignal, createEffect, createMemo } from 'solid-js';
import { A } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import { AppLayout } from '../components/AppLayout';
import { DonutChart } from '../components/DonutChart';
import { BarChart } from '../components/BarChart';

interface KPIData {
    activeProjects: number;
    hoursThisMonth: number;
    revenueThisMonth: number;
    pendingAmount: number;
}

interface ProjectsByStatus {
    active: number;
    completed: number;
    paused: number;
    draft: number;
}

export const AnalyticsPage: Component = () => {
    const [loading, setLoading] = createSignal(true);
    const [kpis, setKpis] = createSignal<KPIData>({
        activeProjects: 0,
        hoursThisMonth: 0,
        revenueThisMonth: 0,
        pendingAmount: 0,
    });
    const [projectsByStatus, setProjectsByStatus] = createSignal<ProjectsByStatus>({
        active: 0,
        completed: 0,
        paused: 0,
        draft: 0,
    });
    const [hoursPerWeek, setHoursPerWeek] = createSignal<{ label: string; value: number }[]>([]);

    // Load data
    createEffect(async () => {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            // Get projects count by status
            const { data: projects } = await supabase
                .from('projects')
                .select('status');

            if (projects) {
                const statusCount = projects.reduce((acc: ProjectsByStatus, p) => {
                    const status = p.status as keyof ProjectsByStatus;
                    if (status in acc) acc[status]++;
                    return acc;
                }, { active: 0, completed: 0, paused: 0, draft: 0 });
                setProjectsByStatus(statusCount);
            }

            // Get hours this month
            const { data: timeEntries } = await supabase
                .from('time_entries')
                .select('duration')
                .gte('start_time', startOfMonth.toISOString())
                .lte('start_time', endOfMonth.toISOString());

            const totalHours = timeEntries?.reduce((sum, e) => sum + (e.duration || 0), 0) || 0;

            // Get finance summary
            const { data: transactions } = await supabase
                .from('finance_transactions')
                .select('type, amount, status')
                .gte('date', startOfMonth.toISOString().split('T')[0])
                .lte('date', endOfMonth.toISOString().split('T')[0]);

            const revenue = transactions
                ?.filter(t => t.type === 'income')
                .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

            const pending = transactions
                ?.filter(t => t.status === 'pending')
                .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

            setKpis({
                activeProjects: projects?.filter(p => p.status === 'active').length || 0,
                hoursThisMonth: Math.round(totalHours / 60), // Convert minutes to hours
                revenueThisMonth: revenue,
                pendingAmount: pending,
            });

            // Get hours per week (last 4 weeks)
            const weeks: { label: string; value: number }[] = [];
            for (let i = 3; i >= 0; i--) {
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - (i + 1) * 7);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 7);

                const { data: weekEntries } = await supabase
                    .from('time_entries')
                    .select('duration')
                    .gte('start_time', weekStart.toISOString())
                    .lt('start_time', weekEnd.toISOString());

                const weekHours = weekEntries?.reduce((sum, e) => sum + (e.duration || 0), 0) || 0;
                weeks.push({
                    label: `Sem ${4 - i}`,
                    value: Math.round(weekHours / 60),
                });
            }
            setHoursPerWeek(weeks);

        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    });

    const donutData = createMemo(() => {
        const status = projectsByStatus();
        return [
            { label: 'Ativos', value: status.active, color: '#3b82f6' },
            { label: 'Concluídos', value: status.completed, color: '#22c55e' },
            { label: 'Pausados', value: status.paused, color: '#f59e0b' },
            { label: 'Rascunho', value: status.draft, color: '#94a3b8' },
        ].filter(d => d.value > 0);
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
                    <h2 class="page-title">Analytics</h2>
                    <p class="page-description">
                        Visão geral das métricas do seu estúdio.
                    </p>
                </div>
            </div>

            <Show when={!loading()} fallback={<div class="spinner spinner-lg" style={{ margin: '2rem auto' }} />}>
                {/* KPI Cards */}
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-card-header">
                            <div class="kpi-card-icon blue">📁</div>
                            <span class="kpi-card-label">Projetos Ativos</span>
                        </div>
                        <p class="kpi-card-value">{kpis().activeProjects}</p>
                    </div>

                    <div class="kpi-card">
                        <div class="kpi-card-header">
                            <div class="kpi-card-icon green">⏱️</div>
                            <span class="kpi-card-label">Horas no Mês</span>
                        </div>
                        <p class="kpi-card-value">{kpis().hoursThisMonth}h</p>
                    </div>

                    <div class="kpi-card">
                        <div class="kpi-card-header">
                            <div class="kpi-card-icon purple">💰</div>
                            <span class="kpi-card-label">Receita no Mês</span>
                        </div>
                        <p class="kpi-card-value">{formatCurrency(kpis().revenueThisMonth)}</p>
                    </div>

                    <div class="kpi-card">
                        <div class="kpi-card-header">
                            <div class="kpi-card-icon orange">📋</div>
                            <span class="kpi-card-label">Pendências</span>
                        </div>
                        <p class="kpi-card-value">{formatCurrency(kpis().pendingAmount)}</p>
                    </div>
                </div>

                {/* Charts */}
                <div class="charts-grid">
                    <div class="chart-card">
                        <h3 class="chart-card-title">Projetos por Status</h3>
                        <Show when={donutData().length > 0} fallback={
                            <div style={{ 'text-align': 'center', padding: 'var(--spacing-6)', color: 'var(--color-text-muted)' }}>
                                Nenhum projeto encontrado
                            </div>
                        }>
                            <DonutChart data={donutData()} size={200} />
                        </Show>
                    </div>

                    <div class="chart-card">
                        <h3 class="chart-card-title">Horas por Semana</h3>
                        <BarChart
                            data={hoursPerWeek()}
                            height={200}
                            formatValue={(v) => `${v}h`}
                        />
                    </div>
                </div>

                {/* Quick Links */}
                <div style={{ display: 'flex', gap: 'var(--spacing-3)', 'flex-wrap': 'wrap' }}>
                    <A href="/reports/timesheet" class="btn btn-outline">
                        📊 Relatório de Horas
                    </A>
                    <A href="/reports/finance" class="btn btn-outline">
                        💵 Relatório Financeiro
                    </A>
                </div>
            </Show>
        </AppLayout>
    );
};
