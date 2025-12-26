import { Component, For, Show, createMemo } from 'solid-js';

interface BarChartData {
    label: string;
    value: number;
    color?: string;
}

interface BarChartProps {
    data: BarChartData[];
    height?: number;
    showValues?: boolean;
    formatValue?: (value: number) => string;
}

export const BarChart: Component<BarChartProps> = (props) => {
    const height = () => props.height || 200;
    const formatValue = (v: number) => props.formatValue ? props.formatValue(v) : v.toString();

    const maxValue = createMemo(() => {
        const max = Math.max(...props.data.map(d => d.value));
        return max > 0 ? max : 1;
    });

    const barWidth = createMemo(() => {
        const count = props.data.length;
        if (count === 0) return 0;
        return Math.max(20, Math.min(60, 100 / count));
    });

    return (
        <div class="bar-chart" style={{ height: `${height()}px` }}>
            <div class="bar-chart-bars">
                <For each={props.data}>
                    {(item) => {
                        const heightPercent = () => (item.value / maxValue()) * 100;
                        return (
                            <div class="bar-chart-bar-container" style={{ width: `${barWidth()}%` }}>
                                <div class="bar-chart-bar-wrapper">
                                    <Show when={props.showValues !== false && item.value > 0}>
                                        <span class="bar-chart-value">{formatValue(item.value)}</span>
                                    </Show>
                                    <div
                                        class="bar-chart-bar"
                                        style={{
                                            height: `${heightPercent()}%`,
                                            'background-color': item.color || 'var(--color-blue)'
                                        }}
                                    />
                                </div>
                                <span class="bar-chart-label">{item.label}</span>
                            </div>
                        );
                    }}
                </For>
            </div>
            <Show when={props.data.length === 0}>
                <div class="bar-chart-empty">Sem dados para exibir</div>
            </Show>
        </div>
    );
};
