import { Component, Show, createSignal, onMount, onCleanup, createEffect } from 'solid-js';
import { useTimer } from '../contexts/TimerContext';
import { CheckoutModal, CheckoutData } from './CheckoutModal';
import { GripVertical, Play, Pause, Square } from 'lucide-solid';

const POSITION_STORAGE_KEY = 'timer-popup-position';

/**
 * Global floating timer popup that appears when a timer is active.
 * Shows in bottom right corner on all pages. Can be dragged to reposition.
 * Position is saved to localStorage and persists across page navigation.
 */
export const TimerPopup: Component = () => {
    const {
        activeTimer,
        elapsedSeconds,
        isRunning,
        pendingCheckout,
        pauseTimer,
        resumeTimer,
        requestCheckout,
        cancelCheckout,
        confirmCheckout,
        formatDuration
    } = useTimer();

    const [confirming, setConfirming] = createSignal(false);

    // Drag state - initialize from localStorage
    const getStoredPosition = (): { x: number; y: number } | null => {
        try {
            const stored = localStorage.getItem(POSITION_STORAGE_KEY);
            if (stored) {
                const pos = JSON.parse(stored);
                // Validate the position is still within viewport
                const maxX = window.innerWidth - 300;
                const maxY = window.innerHeight - 80;
                if (pos.x >= 0 && pos.x <= maxX && pos.y >= 0 && pos.y <= maxY) {
                    return pos;
                }
            }
        } catch {
            // Ignore parsing errors
        }
        return null;
    };

    const [position, setPosition] = createSignal<{ x: number; y: number } | null>(getStoredPosition());
    const [isDragging, setIsDragging] = createSignal(false);
    const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 });

    let popupRef: HTMLDivElement | undefined;

    // Save position to localStorage when it changes
    createEffect(() => {
        const pos = position();
        if (pos) {
            localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(pos));
        }
    });

    const handleStop = () => {
        requestCheckout();
    };

    const handleConfirmCheckout = async (data: CheckoutData) => {
        setConfirming(true);
        try {
            await confirmCheckout(data);
        } finally {
            setConfirming(false);
        }
    };

    // Drag handlers
    const handleMouseDown = (e: MouseEvent) => {
        if (!popupRef) return;

        // Only start drag on the drag handle
        const target = e.target as HTMLElement;
        if (!target.closest('.timer-popup-drag-handle')) return;

        e.preventDefault();
        const rect = popupRef.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setIsDragging(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging()) return;

        const newX = e.clientX - dragOffset().x;
        const newY = e.clientY - dragOffset().y;

        // Constrain to viewport
        const maxX = window.innerWidth - (popupRef?.offsetWidth || 300);
        const maxY = window.innerHeight - (popupRef?.offsetHeight || 80);

        setPosition({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY))
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    onMount(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });

    onCleanup(() => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    });

    const getPositionStyle = () => {
        const pos = position();
        if (pos) {
            return {
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                right: 'auto',
                bottom: 'auto'
            };
        }
        return {};
    };

    return (
        <>
            <Show when={activeTimer()}>
                <div
                    ref={popupRef}
                    class="timer-popup"
                    classList={{ 'timer-popup-dragging': isDragging() }}
                    style={getPositionStyle()}
                    onMouseDown={handleMouseDown}
                >
                    {/* Drag Handle */}
                    <div class="timer-popup-drag-handle" title="Arraste para mover">
                        <GripVertical size={12} />
                    </div>

                    <div class="timer-popup-time" classList={{ 'timer-popup-paused': !isRunning() }}>
                        {formatDuration(elapsedSeconds())}
                    </div>

                    <div class="timer-popup-info">
                        <div class="timer-popup-task">{activeTimer()?.activityName}</div>
                        <div class="timer-popup-project">{activeTimer()?.categoria}</div>
                    </div>

                    <div class="timer-popup-actions">
                        {/* Play/Pause button */}
                        <Show
                            when={isRunning()}
                            fallback={
                                <button
                                    class="timer-popup-btn timer-popup-btn-play"
                                    onClick={resumeTimer}
                                    title="Retomar"
                                >
                                    <Play size={14} fill="currentColor" />
                                </button>
                            }
                        >
                            <button
                                class="timer-popup-btn timer-popup-btn-pause"
                                onClick={pauseTimer}
                                title="Pausar"
                            >
                                <Pause size={14} fill="currentColor" />
                            </button>
                        </Show>

                        {/* Stop button - triggers checkout modal */}
                        <button
                            class="timer-popup-btn timer-popup-btn-stop"
                            onClick={handleStop}
                            title="Finalizar atividade"
                        >
                            <Square size={14} fill="currentColor" />
                        </button>
                    </div>
                </div>
            </Show>

            {/* Checkout Modal */}
            <CheckoutModal
                isOpen={pendingCheckout()}
                onClose={cancelCheckout}
                onConfirm={handleConfirmCheckout}
                duration={formatDuration(elapsedSeconds())}
                activityName={activeTimer()?.activityName}
                categoria={activeTimer()?.categoria}
                date={activeTimer()?.date}
            />

            {/* Loading overlay during save */}
            <Show when={confirming()}>
                <div class="modal-overlay">
                    <div class="loading-container">
                        <div class="spinner spinner-lg" />
                    </div>
                </div>
            </Show>
        </>
    );
};
