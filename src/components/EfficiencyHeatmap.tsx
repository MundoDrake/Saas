import { Component, For, Show, createMemo } from 'solid-js';
import type { EnergyLevel, SatisfactionLevel } from '../types/database';

interface HeatmapEntry {
    dayOfWeek: number; // 0-6 (Dom-Sáb)
    hour: number; // 0-23
    energia: EnergyLevel;
    satisfacao: SatisfactionLevel;
}

interface EfficiencyHeatmapProps {
    entries: HeatmapEntry[];
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

/**
 * Calcula Eficiência Energética (EE)
 * EE = Satisfação / Energia
 * 
 * - EE >= 2.0: Alta eficiência (verde)
 * - EE >= 1.5: Boa eficiência (azul)
 * - EE >= 1.0: Média eficiência (amarelo)
 * - EE >= 0.5: Baixa eficiência (laranja)
 * - EE < 0.5: Estresse (vermelho)
 */
const calcularEE = (satisfacao: number, energia: number): number => {
    return satisfacao / energia;
};

const getEEClass = (ee: number): string => {
    if (ee >= 2.0) return 'ee-high';     // Verde
    if (ee >= 1.5) return 'ee-good';     // Azul
    if (ee >= 1.0) return 'ee-medium';   // Amarelo
    if (ee >= 0.5) return 'ee-low';      // Laranja
    return 'ee-stress';                   // Vermelho
};

const getEELabel = (ee: number): string => {
    if (ee >= 2.0) return 'Alta Eficiência';
    if (ee >= 1.5) return 'Boa Eficiência';
    if (ee >= 1.0) return 'Média Eficiência';
    if (ee >= 0.5) return 'Baixa Eficiência';
    return 'Estresse';
};

export const EfficiencyHeatmap: Component<EfficiencyHeatmapProps> = (props) => {
    // Agrupa entries por dia/hora e calcula média de EE
    const heatmapData = createMemo(() => {
        const grid: Map<string, { totalEE: number; count: number }> = new Map();

        props.entries.forEach(entry => {
            const key = `${entry.dayOfWeek}-${entry.hour}`;
            const ee = calcularEE(entry.satisfacao, entry.energia);

            if (grid.has(key)) {
                const existing = grid.get(key)!;
                existing.totalEE += ee;
                existing.count += 1;
            } else {
                grid.set(key, { totalEE: ee, count: 1 });
            }
        });

        return grid;
    });

    const getCellData = (day: number, hour: number) => {
        const key = `${day}-${hour}`;
        const data = heatmapData().get(key);

        if (!data) return null;

        const avgEE = data.totalEE / data.count;
        return {
            ee: avgEE,
            class: getEEClass(avgEE),
            label: getEELabel(avgEE),
        };
    };

    return (
        <div class="efficiency-heatmap">
            <div class="heatmap-grid">
                {/* Header - Horas */}
                <div class="heatmap-header">
                    <div class="heatmap-header-cell"></div>
                    <For each={HOURS}>
                        {(hour) => (
                            <div class="heatmap-header-cell">
                                {hour.toString().padStart(2, '0')}
                            </div>
                        )}
                    </For>
                </div>

                {/* Rows - Dias */}
                <For each={DAYS}>
                    {(day, dayIndex) => (
                        <div class="heatmap-row">
                            <div class="heatmap-day-label">{day}</div>
                            <For each={HOURS}>
                                {(hour) => {
                                    const cell = getCellData(dayIndex(), hour);
                                    return (
                                        <div
                                            class="heatmap-cell"
                                            classList={{ [cell?.class || '']: !!cell }}
                                            title={cell ? `${day} ${hour}h - ${cell.label} (EE: ${cell.ee.toFixed(2)})` : `${day} ${hour}h - Sem dados`}
                                        />
                                    );
                                }}
                            </For>
                        </div>
                    )}
                </For>
            </div>

            {/* Legenda */}
            <div class="heatmap-legend">
                <span>Eficiência:</span>
                <div class="heatmap-legend-item">
                    <div class="heatmap-legend-color" style={{ background: 'var(--color-red)' }}></div>
                    <span>Estresse</span>
                </div>
                <div class="heatmap-legend-item">
                    <div class="heatmap-legend-color" style={{ background: 'var(--color-orange)' }}></div>
                    <span>Baixa</span>
                </div>
                <div class="heatmap-legend-item">
                    <div class="heatmap-legend-color" style={{ background: 'var(--color-yellow)' }}></div>
                    <span>Média</span>
                </div>
                <div class="heatmap-legend-item">
                    <div class="heatmap-legend-color" style={{ background: 'var(--color-blue)' }}></div>
                    <span>Boa</span>
                </div>
                <div class="heatmap-legend-item">
                    <div class="heatmap-legend-color" style={{ background: 'var(--color-green)' }}></div>
                    <span>Alta</span>
                </div>
            </div>
        </div>
    );
};
