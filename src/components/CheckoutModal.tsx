import { Component, createSignal, Show } from 'solid-js';
import { Button } from './ui';
import type { BioCategoria, EnergyLevel, SatisfactionLevel } from '../types/database';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: CheckoutData) => void;
    duration: string;
    activityName?: string;
    categoria?: BioCategoria;
    date?: string;
}

export interface CheckoutData {
    categoria: BioCategoria;
    energia: EnergyLevel;
    satisfacao: SatisfactionLevel;
    observacoes?: string;
}

const ENERGIA_LEVELS: { value: EnergyLevel; label: string; icon: string; color: string }[] = [
    { value: 1, label: 'Baixa', icon: '🟢', color: 'var(--color-green)' },
    { value: 2, label: 'Média', icon: '🟡', color: 'var(--color-yellow)' },
    { value: 3, label: 'Alta', icon: '🔴', color: 'var(--color-red)' },
];

const SATISFACAO_LEVELS: { value: SatisfactionLevel; label: string; icon: string }[] = [
    { value: 1, label: 'Negativo', icon: '😞' },
    { value: 2, label: 'Neutro', icon: '😐' },
    { value: 3, label: 'Positivo', icon: '😊' },
];

export const CheckoutModal: Component<CheckoutModalProps> = (props) => {
    const [energia, setEnergia] = createSignal<EnergyLevel>(2);
    const [satisfacao, setSatisfacao] = createSignal<SatisfactionLevel>(2);
    const [observacoes, setObservacoes] = createSignal('');

    const handleConfirm = () => {
        props.onConfirm({
            categoria: props.categoria || 'outros',
            energia: energia(),
            satisfacao: satisfacao(),
            observacoes: observacoes().trim() || undefined,
        });
        // Reset form
        setObservacoes('');
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    return (
        <Show when={props.isOpen}>
            <div class="modal-overlay" onClick={props.onClose}>
                <div class="modal checkout-modal" onClick={(e) => e.stopPropagation()}>
                    <div class="modal-header">
                        <h3 class="modal-title">Finalizar Atividade</h3>
                        <button class="modal-close" onClick={props.onClose}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    <div class="modal-body">
                        {/* Summary Card */}
                        <div class="checkout-summary">
                            <div class="checkout-duration">{props.duration}</div>
                            <Show when={props.activityName}>
                                <div class="checkout-task">{props.activityName}</div>
                            </Show>
                            <div class="checkout-meta">
                                <Show when={props.categoria}>
                                    <span class="checkout-tag">{props.categoria}</span>
                                </Show>
                                <Show when={props.date}>
                                    <span class="checkout-date">{formatDate(props.date)}</span>
                                </Show>
                            </div>
                        </div>

                        {/* Energia */}
                        <div class="checkout-section">
                            <label class="checkout-label">⚡ Energia Gasta</label>
                            <div class="checkout-options">
                                {ENERGIA_LEVELS.map(level => (
                                    <button
                                        type="button"
                                        class="checkout-option"
                                        classList={{
                                            active: energia() === level.value,
                                            [`energia-${level.value}`]: energia() === level.value,
                                        }}
                                        onClick={() => setEnergia(level.value)}
                                    >
                                        <span class="checkout-option-icon">{level.icon}</span>
                                        <span class="checkout-option-label">{level.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Satisfação */}
                        <div class="checkout-section">
                            <label class="checkout-label">❤️ Sentimento</label>
                            <div class="checkout-options">
                                {SATISFACAO_LEVELS.map(level => (
                                    <button
                                        type="button"
                                        class="checkout-option"
                                        classList={{
                                            active: satisfacao() === level.value,
                                            [`satisfacao-${level.value}`]: satisfacao() === level.value,
                                        }}
                                        onClick={() => setSatisfacao(level.value)}
                                    >
                                        <span class="checkout-option-icon">{level.icon}</span>
                                        <span class="checkout-option-label">{level.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Observações */}
                        <div class="checkout-section">
                            <label class="checkout-label">📝 Observações (opcional)</label>
                            <textarea
                                class="form-input checkout-observacoes"
                                placeholder="Adicione notas sobre esta atividade..."
                                value={observacoes()}
                                onInput={(e) => setObservacoes(e.currentTarget.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    <div class="modal-footer">
                        <Button variant="ghost" onClick={props.onClose}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleConfirm} icon={<i class="ci-Check"></i>}>
                            Salvar Registro
                        </Button>
                    </div>
                </div>
            </div>
        </Show>
    );
};
