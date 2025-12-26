import { Component, Show, createSignal } from 'solid-js';
import { useTimesheet } from '../hooks/useTimesheet';

interface TimerProps {
    taskId: string;
    projectId: string;
    taskTitle: string;
    projectName?: string;
    onTimeSaved?: () => void;
}

export const Timer: Component<TimerProps> = (props) => {
    const {
        activeTimer,
        elapsedSeconds,
        startTimer,
        stopTimer,
        formatDuration,
        isTimerActive,
    } = useTimesheet();

    const [saving, setSaving] = createSignal(false);

    const isActive = () => isTimerActive(props.taskId);
    const isOtherTaskActive = () => Boolean(activeTimer() && activeTimer()?.taskId !== props.taskId);

    const handleToggle = async () => {
        if (isActive()) {
            setSaving(true);
            try {
                await stopTimer();
                props.onTimeSaved?.();
            } finally {
                setSaving(false);
            }
        } else {
            startTimer(props.taskId, props.projectId);
        }
    };

    return (
        <div class="timer-widget">
            <Show when={isActive()}>
                <div class="timer-display timer-active">
                    <span class="timer-time">{formatDuration(elapsedSeconds())}</span>
                </div>
            </Show>

            <button
                class="timer-btn"
                classList={{
                    'timer-btn-start': !isActive(),
                    'timer-btn-stop': isActive(),
                    'timer-btn-disabled': isOtherTaskActive(),
                }}
                onClick={handleToggle}
                disabled={saving() || isOtherTaskActive() || undefined}
                title={isOtherTaskActive() ? 'Pare o outro timer primeiro' : isActive() ? 'Parar timer' : 'Iniciar timer'}
            >
                <Show
                    when={!saving()}
                    fallback={<div class="spinner spinner-sm" />}
                >
                    <Show
                        when={isActive()}
                        fallback={
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                        }
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                        </svg>
                    </Show>
                </Show>
            </button>
        </div>
    );
};

// Floating timer widget for active task
export const FloatingTimer: Component = () => {
    const { activeTimer, elapsedSeconds, stopTimer, formatDuration } = useTimesheet();
    const [saving, setSaving] = createSignal(false);

    const handleStop = async () => {
        setSaving(true);
        try {
            await stopTimer();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Show when={activeTimer()}>
            <div class="floating-timer">
                <div class="floating-timer-info">
                    <span class="floating-timer-time">{formatDuration(elapsedSeconds())}</span>
                    <span class="floating-timer-task">Timer ativo</span>
                </div>
                <button
                    class="floating-timer-stop"
                    onClick={handleStop}
                    disabled={saving()}
                >
                    <Show when={!saving()} fallback={<div class="spinner spinner-sm" />}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                        </svg>
                    </Show>
                </button>
            </div>
        </Show>
    );
};
