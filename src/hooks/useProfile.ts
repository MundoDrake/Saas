import { createSignal, createEffect, onCleanup } from 'solid-js';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Profile, Role } from '../types/database';

interface UseProfileReturn {
    profile: () => Profile | null;
    role: () => Role | null;
    loading: () => boolean;
    error: () => string | null;
    refetch: () => Promise<void>;
    hasPermission: (permission: string) => boolean;
    isAdmin: () => boolean;
}

export function useProfile(): UseProfileReturn {
    const { user } = useAuth();
    const [profile, setProfile] = createSignal<Profile | null>(null);
    const [role, setRole] = createSignal<Role | null>(null);
    const [loading, setLoading] = createSignal(true);
    const [error, setError] = createSignal<string | null>(null);

    const fetchProfile = async () => {
        const currentUser = user();
        if (!currentUser) {
            setProfile(null);
            setRole(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select(`
          *,
          role:roles(*)
        `)
                .eq('user_id', currentUser.id)
                .single();

            if (fetchError) {
                if (fetchError.code === 'PGRST116') {
                    // Profile not found - this can happen if trigger didn't fire
                    setError('Perfil não encontrado. Por favor, entre em contato com o suporte.');
                } else {
                    setError(fetchError.message);
                }
                return;
            }

            setProfile(data);
            setRole(data.role || null);
        } catch (err) {
            setError('Erro ao carregar perfil');
        } finally {
            setLoading(false);
        }
    };

    // Fetch profile when user changes
    createEffect(() => {
        fetchProfile();
    });

    // Subscribe to profile changes
    createEffect(() => {
        const currentUser = user();
        if (!currentUser) return;

        const channel = supabase
            .channel('profile-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'profiles',
                    filter: `user_id=eq.${currentUser.id}`,
                },
                () => {
                    fetchProfile();
                }
            )
            .subscribe();

        onCleanup(() => {
            supabase.removeChannel(channel);
        });
    });

    const hasPermission = (permission: string): boolean => {
        const currentRole = role();
        if (!currentRole) return false;
        return currentRole.permissions.includes(permission);
    };

    const isAdmin = (): boolean => {
        const currentRole = role();
        return currentRole?.name === 'admin';
    };

    return {
        profile,
        role,
        loading,
        error,
        refetch: fetchProfile,
        hasPermission,
        isAdmin,
    };
}
