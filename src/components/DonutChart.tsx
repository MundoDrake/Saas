import { Component, For, createMemo } from 'solid-js';

export interface ChartData {
    label: string;
    value: number;
    color: string;
}

interface DonutChartProps {
    data: ChartData[];
    size?: number;
    strokeWidth?: number;
    showLegend?: boolean;
    centerLabel?: string;
    centerValue?: string | number;
}

export const DonutChart: Component<DonutChartProps> = (props) => {
    const size = () => props.size || 160;
    const strokeWidth = () => props.strokeWidth || 24;
    const radius = () => (size() - strokeWidth()) / 2;
    const circumference = () => 2 * Math.PI * radius();

    const total = createMemo(() =>
        props.data.reduce((sum, item) => sum + item.value, 0)
    );

    const segments = createMemo(() => {
        let offset = 0;
        return props.data
            .filter(item => item.value > 0)
            .map(item => {
                const percentage = total() > 0 ? item.value / total() : 0;
                const length = circumference() * percentage;
                const segment = {
                    ...item,
                    percentage,
                    offset,
                    length,
                    gap: circumference() - length,
                };
                offset += length;
                return segment;
            });
    });

    return (
        <div class="donut-chart-container">
            <div class="donut-chart-wrapper">
                <svg
                    width={size()}
                    height={size()}
                    viewBox={`0 0 ${size()} ${size()}`}
                    class="donut-chart"
                >
                    {/* Background circle */}
                    <circle
                        cx={size() / 2}
                        cy={size() / 2}
                        r={radius()}
                        fill="none"
                        stroke="var(--color-border)"
                        stroke-width={strokeWidth()}
                    />

                    {/* Data segments */}
                    <For each={segments()}>
                        {(segment, index) => (
                            <circle
                                cx={size() / 2}
                                cy={size() / 2}
                                r={radius()}
                                fill="none"
                                stroke={segment.color}
                                stroke-width={strokeWidth()}
                                stroke-dasharray={`${segment.length} ${segment.gap}`}
                                stroke-dashoffset={-segment.offset}
                                stroke-linecap="round"
                                style={{
                                    transform: `rotate(-90deg)`,
                                    "transform-origin": "center",
                                    transition: "stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease",
                                }}
                            />
                        )}
                    </For>
                </svg>

                {/* Center label */}
                {(props.centerLabel || props.centerValue !== undefined) && (
                    <div class="donut-chart-center">
                        {props.centerValue !== undefined && (
                            <div class="donut-chart-center-value">{props.centerValue}</div>
                        )}
                        {props.centerLabel && (
                            <div class="donut-chart-center-label">{props.centerLabel}</div>
                        )}
                    </div>
                )}
            </div>

            {/* Legend */}
            {props.showLegend !== false && (
                <div class="donut-chart-legend">
                    <For each={props.data}>
                        {(item) => (
                            <div class="donut-chart-legend-item">
                                <span
                                    class="donut-chart-legend-dot"
                                    style={{ background: item.color }}
                                />
                                <span class="donut-chart-legend-label">{item.label}</span>
                                <span class="donut-chart-legend-value">{item.value}</span>
                            </div>
                        )}
                    </For>
                </div>
            )}
        </div>
    );
};

// Hook to prepare chart data
export function useChartData<T extends Record<string, number>>(
    data: () => T,
    labels: Record<keyof T, string>,
    colors: Record<keyof T, string>
): () => ChartData[] {
    return () => {
        const d = data();
        return Object.keys(d).map(key => ({
            label: labels[key as keyof T] || key,
            value: d[key as keyof T],
            color: colors[key as keyof T] || 'var(--color-gray)',
        }));
    };
}
