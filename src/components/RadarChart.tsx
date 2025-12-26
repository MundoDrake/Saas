import { Component, For, Show } from 'solid-js';

export interface RadarChartData {
    label: string;
    value: number;
    color: string;
}

interface RadarChartProps {
    data: RadarChartData[];
    size?: number;
    maxValue?: number;
    levels?: number;
    fillOpacity?: number;
}

type TextAnchor = 'start' | 'middle' | 'end';

export const RadarChart: Component<RadarChartProps> = (props) => {
    const size = () => props.size || 200;
    const center = () => size() / 2;
    const radius = () => (size() - 40) / 2;
    const levels = () => props.levels || 4;
    const fillOpacity = () => props.fillOpacity || 0.2;

    const data = () => props.data;

    const maxValue = () => {
        if (props.maxValue) return props.maxValue;
        const max = Math.max(...data().map(d => d.value), 1);
        return Math.ceil(max / 5) * 5 || 5;
    };

    const angleSlice = () => (Math.PI * 2) / (data().length || 1);

    const getPoint = (index: number, value: number) => {
        const angle = angleSlice() * index - Math.PI / 2;
        const r = (value / maxValue()) * radius();
        return {
            x: center() + r * Math.cos(angle),
            y: center() + r * Math.sin(angle),
        };
    };

    const levelPolygons = () => {
        return Array.from({ length: levels() }, (_, levelIndex) => {
            const levelRadius = ((levelIndex + 1) / levels()) * radius();
            const points = data().map((_, i) => {
                const angle = angleSlice() * i - Math.PI / 2;
                return `${center() + levelRadius * Math.cos(angle)},${center() + levelRadius * Math.sin(angle)}`;
            }).join(' ');
            return points;
        });
    };

    const axisLines = () => {
        return data().map((d, i) => {
            const angle = angleSlice() * i - Math.PI / 2;
            return {
                x2: center() + radius() * Math.cos(angle),
                y2: center() + radius() * Math.sin(angle),
                color: d.color,
            };
        });
    };

    const dataPolygon = () => {
        return data().map((d, i) => {
            const point = getPoint(i, d.value);
            return `${point.x},${point.y}`;
        }).join(' ');
    };

    const labelPositions = () => {
        return data().map((d, i) => {
            const angle = angleSlice() * i - Math.PI / 2;
            const labelRadius = radius() + 20;
            const anchor: TextAnchor = Math.abs(angle) < 0.1 ? 'middle' :
                angle > -Math.PI / 2 && angle < Math.PI / 2 ? 'start' : 'end';
            return {
                x: center() + labelRadius * Math.cos(angle),
                y: center() + labelRadius * Math.sin(angle),
                label: d.label,
                value: d.value,
                color: d.color,
                anchor,
            };
        });
    };

    // Get average color for polygon fill or use first color
    const polygonColor = () => {
        const d = data();
        if (d.length === 0) return 'var(--color-blue)';
        return d[0].color;
    };

    return (
        <div class="radar-chart-container">
            <svg
                width={size()}
                height={size()}
                viewBox={`0 0 ${size()} ${size()}`}
                class="radar-chart"
            >
                {/* Level polygons (grid) */}
                <For each={levelPolygons()}>
                    {(points) => (
                        <polygon
                            points={points}
                            fill="none"
                            stroke="var(--color-border)"
                            stroke-width="1"
                            opacity={0.5}
                        />
                    )}
                </For>

                {/* Axis lines with colors */}
                <For each={axisLines()}>
                    {(axis) => (
                        <line
                            x1={center()}
                            y1={center()}
                            x2={axis.x2}
                            y2={axis.y2}
                            stroke={axis.color}
                            stroke-width="2"
                            opacity={0.6}
                        />
                    )}
                </For>

                {/* Data polygon - filled area */}
                <polygon
                    points={dataPolygon()}
                    fill={`${polygonColor()}33`}
                    stroke={polygonColor()}
                    stroke-width="2"
                    class="radar-data-area"
                />

                {/* Data points with individual colors */}
                <For each={data()}>
                    {(d, i) => {
                        const point = () => getPoint(i(), d.value);
                        return (
                            <circle
                                cx={point().x}
                                cy={point().y}
                                r="6"
                                fill={d.color}
                                stroke="white"
                                stroke-width="2"
                                class="radar-data-point"
                            />
                        );
                    }}
                </For>

                {/* Labels with colors */}
                <For each={labelPositions()}>
                    {(pos) => (
                        <text
                            x={pos.x}
                            y={pos.y}
                            text-anchor={pos.anchor}
                            dominant-baseline="middle"
                            class="radar-label"
                            fill={pos.color}
                            style={{ "font-weight": "600" }}
                        >
                            {pos.label}
                        </text>
                    )}
                </For>
            </svg>

            {/* Legend with colors */}
            <div class="radar-chart-legend">
                <For each={data()}>
                    {(item) => (
                        <div class="radar-chart-legend-item">
                            <span
                                class="radar-chart-legend-dot"
                                style={{ background: item.color }}
                            />
                            <span class="radar-chart-legend-label">{item.label}:</span>
                            <span class="radar-chart-legend-value">{item.value}</span>
                        </div>
                    )}
                </For>
            </div>
        </div>
    );
};
