import { createSignal, onCleanup, createEffect } from 'solid-js';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface TimeEntry {
    id: string;
    task_id: string | null;
    project_id: string;
    user_id: string;
    date: string;
    hours: number;
    description: string | null;
    created_at: string;
    task?: {
        id: string;
        title: string;
    };
    project?: {
        id: string;
        name: string;
    };
}

export interface CreateTimeEntryInput {
    task_id?: string;
    project_id: string;
    date?: string;
    hours: number;
    description?: string;
}

export function useTimesheet() {
    const { user } = useAuth();
    const [entries, setEntries] = createSignal<TimeEntry[]>([]);
    const [loading, setLoading] = createSignal(false);
    const [activeTimer, setActiveTimer] = createSignal<{ taskId: string; projectId: string; startTime: Date } | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = createSignal(0);

    let timerInterval: number | null = null;

    // Fetch time entries
    const fetchEntries = async (filters?: { taskId?: string; startDate?: string; endDate?: string }) => {
        setLoading(true);
        try {
            let query = supabase
                .from('time_entries')
                .select(`
          *,
          task:tasks(id, title),
          project:projects(id, name)
        `)
                .eq('user_id', user()?.id)
                .order('date', { ascending: false });

            if (filters?.taskId) {
                query = query.eq('task_id', filters.taskId);
            }
            if (filters?.startDate) {
                query = query.gte('date', filters.startDate);
            }
            if (filters?.endDate) {
                query = query.lte('date', filters.endDate);
            }

            const { data, error } = await query;

            if (error) throw error;
            setEntries(data || []);
        } catch (err) {
            console.error('Error fetching time entries:', err);
        } finally {
            setLoading(false);
        }
    };

    // Start local timer (UI only - saves when stopped)
    const startTimer = (taskId: string, projectId: string) => {
        // Stop any running timer first
        if (activeTimer()) {
            stopTimer();
        }

        setActiveTimer({ taskId, projectId, startTime: new Date() });

        if (timerInterval) clearInterval(timerInterval);

        timerInterval = setInterval(() => {
            const timer = activeTimer();
            if (timer) {
                const elapsed = Math.floor((Date.now() - timer.startTime.getTime()) / 1000);
                setElapsedSeconds(elapsed);
            }
        }, 1000) as unknown as number;
    };

    // Stop timer and save entry
    const stopTimer = async () => {
        const timer = activeTimer();
        if (!timer) return null;

        // Stop the interval
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        // Calculate hours
        const endTime = new Date();
        const hours = (endTime.getTime() - timer.startTime.getTime()) / (1000 * 60 * 60);

        // Only save if at least 1 minute
        if (hours >= 1 / 60) {
            try {
                const { data, error } = await supabase
                    .from('time_entries')
                    .insert({
                        task_id: timer.taskId,
                        project_id: timer.projectId,
                        user_id: user()?.id,
                        date: new Date().toISOString().split('T')[0],
                        hours: Math.round(hours * 100) / 100, // Round to 2 decimals
                        description: null,
                    })
                    .select()
                    .single();

                if (error) throw error;

                setActiveTimer(null);
                setElapsedSeconds(0);
                return data;
            } catch (err) {
                console.error('Error saving time entry:', err);
                throw err;
            }
        } else {
            setActiveTimer(null);
            setElapsedSeconds(0);
            return null;
        }
    };

    // Add manual time entry
    const addManualEntry = async (input: CreateTimeEntryInput) => {
        try {
            const { data, error } = await supabase
                .from('time_entries')
                .insert({
                    task_id: input.task_id || null,
                    project_id: input.project_id,
                    user_id: user()?.id,
                    date: input.date || new Date().toISOString().split('T')[0],
                    hours: input.hours,
                    description: input.description || null,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error adding manual entry:', err);
            throw err;
        }
    };

    // Delete time entry
    const deleteEntry = async (id: string) => {
        try {
            const { error } = await supabase
                .from('time_entries')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setEntries(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            console.error('Error deleting entry:', err);
            throw err;
        }
    };

    // Format seconds to HH:MM:SS
    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Format hours to readable string
    const formatHours = (hours: number) => {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        if (h > 0) {
            return m > 0 ? `${h}h ${m}m` : `${h}h`;
        }
        return `${m}m`;
    };

    // Get total hours for entries
    const getTotalHours = () => {
        return entries().reduce((sum, e) => sum + (e.hours || 0), 0);
    };

    // Check if timer is active for a specific task
    const isTimerActive = (taskId: string) => {
        return activeTimer()?.taskId === taskId;
    };

    // Cleanup on unmount
    onCleanup(() => {
        if (timerInterval) clearInterval(timerInterval);
    });

    return {
        entries,
        loading,
        activeTimer,
        elapsedSeconds,
        fetchEntries,
        startTimer,
        stopTimer,
        addManualEntry,
        deleteEntry,
        formatDuration,
        formatHours,
        getTotalHours,
        isTimerActive,
    };
}
