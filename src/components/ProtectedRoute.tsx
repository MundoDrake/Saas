import { Component, Show } from 'solid-js';
import { Navigate, useLocation } from '@solidjs/router';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: any;
}

export const ProtectedRoute: Component<ProtectedRouteProps> = (props) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    return (
        <Show
            when={!loading()}
            fallback={
                <div class="auth-layout">
                    <div class="spinner spinner-lg" />
                </div>
            }
        >
            <Show
                when={user()}
                fallback={<Navigate href={`/login?redirect=${encodeURIComponent(location.pathname)}`} />}
            >
                {props.children}
            </Show>
        </Show>
    );
};
