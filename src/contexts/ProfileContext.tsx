import { createContext, useContext, ParentComponent, createMemo } from 'solid-js';
import { useProfile } from '../hooks/useProfile';
import type { Profile, Role } from '../types/database';

interface ProfileContextValue {
    profile: () => Profile | null;
    role: () => Role | null;
    loading: () => boolean;
    error: () => string | null;
    refetch: () => Promise<void>;
    hasPermission: (permission: string) => boolean;
    isAdmin: () => boolean;
}

const ProfileContext = createContext<ProfileContextValue>();

/**
 * ProfileProvider wraps the app to provide profile data to all children.
 * Should be used inside AuthProvider.
 */
export const ProfileProvider: ParentComponent = (props) => {
    const profileData = useProfile();

    return (
        <ProfileContext.Provider value={profileData}>
            {props.children}
        </ProfileContext.Provider>
    );
};

/**
 * Hook to access profile context. Must be used within ProfileProvider.
 */
export function useProfileContext(): ProfileContextValue {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfileContext must be used within a ProfileProvider');
    }
    return context;
}
