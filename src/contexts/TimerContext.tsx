import { createContext, useContext, createSignal, onCleanup, onMount, ParentComponent, Accessor } from 'solid-js';
import { supabase } from '../lib/supabase';
import type { BioCategoria, EnergyLevel, SatisfactionLevel } from '../types/database';

const TIMER_STORAGE_KEY = 'studio-manager-active-timer';

export interface CheckoutData {
    categoria: BioCategoria;
    energia: EnergyLevel;
    satisfacao: SatisfactionLevel;
    observacoes?: string;
}

interface TimerState {
    activityName: string;
    categoria: BioCategoria;
    startTime: string; // ISO string for serialization
    date: string;
}

interface TimerContextValue {
    activeTimer: Accessor<TimerState | null>;
    elapsedSeconds: Accessor<number>;
    isRunning: Accessor<boolean>;
    pendingCheckout: Accessor<boolean>;
    startTimer: (activityName: string, categoria: BioCategoria) => void;
    pauseTimer: () => void;
    resumeTimer: () => void;
    requestCheckout: () => void;
    cancelCheckout: () => void;
    confirmCheckout: (data: CheckoutData) => Promise<void>;
    formatDuration: (seconds: number) => string;
}

const TimerContext = createContext<TimerContextValue>();

// Save timer state to localStorage
const saveTimerState = (timer: TimerState | null, isRunning: boolean, pausedAt: number) => {
    if (timer) {
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({
            timer,
            isRunning,
            pausedAt,
        }));
    } else {
        localStorage.removeItem(TIMER_STORAGE_KEY);
    }
};

// Load timer state from localStorage
const loadTimerState = (): { timer: TimerState | null; isRunning: boolean; pausedAt: number } => {
    try {
        const stored = localStorage.getItem(TIMER_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to load timer state:', e);
    }
    return { timer: null, isRunning: false, pausedAt: 0 };
};

export const TimerProvider: ParentComponent = (props) => {
    // Load initial state from localStorage
    const initialState = loadTimerState();

    const [activeTimer, setActiveTimer] = createSignal<TimerState | null>(initialState.timer);
    const [elapsedSeconds, setElapsedSeconds] = createSignal(0);
    const [isRunning, setIsRunning] = createSignal(initialState.isRunning);
    const [pausedAt, setPausedAt] = createSignal<number>(initialState.pausedAt);
    const [pendingCheckout, setPendingCheckout] = createSignal(false);

    let timerInterval: number | null = null;

    const calculateElapsed = () => {
        const timer = activeTimer();
        if (!timer) return 0;

        if (pausedAt() > 0) {
            return pausedAt();
        }

        const startTime = new Date(timer.startTime).getTime();
        return Math.floor((Date.now() - startTime) / 1000);
    };

    const startLocalTimer = () => {
        if (timerInterval) clearInterval(timerInterval);

        timerInterval = setInterval(() => {
            const timer = activeTimer();
            if (timer && isRunning()) {
                setElapsedSeconds(calculateElapsed());
            }
        }, 1000) as unknown as number;
    };

    const stopLocalTimer = () => {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    };

    // Initialize on mount
    onMount(() => {
        if (activeTimer()) {
            setElapsedSeconds(calculateElapsed());
            if (isRunning()) {
                startLocalTimer();
            }
        }
    });

    const startTimer = (activityName: string, categoria: BioCategoria) => {
        // Stop any existing timer
        if (activeTimer()) {
            stopLocalTimer();
        }

        const now = new Date();
        const newTimer: TimerState = {
            activityName,
            categoria,
            startTime: now.toISOString(),
            date: now.toISOString().split('T')[0],
        };

        setActiveTimer(newTimer);
        setElapsedSeconds(0);
        setPausedAt(0);
        setIsRunning(true);
        startLocalTimer();

        // Persist to localStorage
        saveTimerState(newTimer, true, 0);
    };

    const pauseTimer = () => {
        const currentElapsed = calculateElapsed();
        setIsRunning(false);
        setPausedAt(currentElapsed);

        // Persist to localStorage
        saveTimerState(activeTimer(), false, currentElapsed);
    };

    const resumeTimer = () => {
        const timer = activeTimer();
        if (timer) {
            // Adjust start time to account for pause
            const newStartTime = new Date(Date.now() - pausedAt() * 1000);
            const updatedTimer: TimerState = {
                ...timer,
                startTime: newStartTime.toISOString(),
            };
            setActiveTimer(updatedTimer);
            setPausedAt(0);
            setIsRunning(true);
            startLocalTimer();

            // Persist to localStorage
            saveTimerState(updatedTimer, true, 0);
        }
    };

    // Request checkout - pauses timer and opens modal
    const requestCheckout = () => {
        pauseTimer();
        setPendingCheckout(true);
    };

    // Cancel checkout - resumes timer
    const cancelCheckout = () => {
        setPendingCheckout(false);
        resumeTimer();
    };

    // Confirm checkout with bio-tracking data
    const confirmCheckout = async (checkoutData: CheckoutData) => {
        const timer = activeTimer();
        if (!timer) return;

        stopLocalTimer();

        // Calculate duration
        const totalSeconds = pausedAt() > 0 ? pausedAt() : calculateElapsed();
        const durationMinutes = Math.floor(totalSeconds / 60);
        const hours = totalSeconds / 3600;

        if (durationMinutes >= 1) { // At least 1 minute
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    console.error('User not authenticated');
                    alert('Erro: Usuário não autenticado. Faça login novamente.');
                    return;
                }

                const startTime = new Date(timer.startTime);
                const endTime = new Date(startTime.getTime() + totalSeconds * 1000);

                console.log('Saving time entry:', {
                    user_id: user.id,
                    activity_name: timer.activityName,
                    start_time: startTime.toISOString(),
                    duration_minutes: durationMinutes,
                });

                const { data, error } = await supabase
                    .from('time_entries')
                    .insert({
                        task_id: null,
                        user_id: user.id,
                        date: timer.date, // Add date field
                        description: checkoutData.observacoes || null,
                        activity_name: timer.activityName,
                        start_time: startTime.toISOString(),
                        end_time: endTime.toISOString(),
                        duration_minutes: durationMinutes,
                        categoria: checkoutData.categoria,
                        energia: checkoutData.energia,
                        satisfacao: checkoutData.satisfacao,
                    })
                    .select();

                if (error) {
                    console.error('Supabase error:', error);
                    alert(`Erro ao salvar: ${error.message}`);
                } else {
                    console.log('Time entry saved:', data);
                }
            } catch (err) {
                console.error('Error saving time entry:', err);
                alert('Erro ao salvar registro de tempo');
            }
        } else {
            console.log('Duration too short, not saving (less than 1 minute)');
        }

        setActiveTimer(null);
        setElapsedSeconds(0);
        setPausedAt(0);
        setIsRunning(false);
        setPendingCheckout(false);

        // Clear from localStorage
        saveTimerState(null, false, 0);
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    onCleanup(() => {
        if (timerInterval) clearInterval(timerInterval);
    });

    return (
        <TimerContext.Provider value={{
            activeTimer,
            elapsedSeconds,
            isRunning,
            pendingCheckout,
            startTimer,
            pauseTimer,
            resumeTimer,
            requestCheckout,
            cancelCheckout,
            confirmCheckout,
            formatDuration,
        }}>
            {props.children}
        </TimerContext.Provider>
    );
};

export const useTimer = () => {
    const context = useContext(TimerContext);
    if (!context) {
        throw new Error('useTimer must be used within TimerProvider');
    }
    return context;
};
