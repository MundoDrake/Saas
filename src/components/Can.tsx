import { Component, Show, JSX } from 'solid-js';
import { useProfile } from '../hooks/useProfile';

interface CanProps {
    /** Single permission or array of permissions to check */
    permission: string | string[];
    /** If true, user must have ALL permissions. If false, user needs ANY permission. Default: false */
    all?: boolean;
    /** Content to show if user has permission */
    children: JSX.Element;
    /** Optional fallback content when permission is denied */
    fallback?: JSX.Element;
}

/**
 * Permission guard component that conditionally renders children
 * based on user's role permissions.
 * 
 * @example
 * // Single permission
 * <Can permission="manage_finances">
 *   <FinancePanel />
 * </Can>
 * 
 * @example
 * // Multiple permissions (any)
 * <Can permission={["manage_clients", "manage_projects"]}>
 *   <AdminButton />
 * </Can>
 * 
 * @example
 * // Multiple permissions (all required)
 * <Can permission={["manage_users", "manage_finances"]} all>
 *   <SuperAdminPanel />
 * </Can>
 */
export const Can: Component<CanProps> = (props) => {
    const { hasPermission, loading, isAdmin } = useProfile();

    const checkPermission = (): boolean => {
        // Admins have all permissions
        if (isAdmin()) return true;

        const permissions = Array.isArray(props.permission)
            ? props.permission
            : [props.permission];

        if (props.all) {
            return permissions.every((p) => hasPermission(p));
        }
        return permissions.some((p) => hasPermission(p));
    };

    return (
        <Show when={!loading()}>
            <Show when={checkPermission()} fallback={props.fallback}>
                {props.children}
            </Show>
        </Show>
    );
};

/**
 * Hook version for programmatic permission checks
 */
export function usePermission(permission: string | string[], all = false): () => boolean {
    const { hasPermission, isAdmin, loading } = useProfile();

    return () => {
        if (loading()) return false;
        if (isAdmin()) return true;

        const permissions = Array.isArray(permission) ? permission : [permission];

        if (all) {
            return permissions.every((p) => hasPermission(p));
        }
        return permissions.some((p) => hasPermission(p));
    };
}
