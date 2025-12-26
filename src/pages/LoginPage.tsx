import { Component, createSignal, Show } from 'solid-js';
import { A, useNavigate, useSearchParams } from '@solidjs/router';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/ui';
import '../styles/auth.css';

export const LoginPage: Component = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { signIn, signInWithGoogle } = useAuth();

    const [email, setEmail] = createSignal('');
    const [password, setPassword] = createSignal('');
    const [loading, setLoading] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { error: authError } = await signIn(email(), password());

            if (authError) {
                setError(getErrorMessage(authError.message));
                return;
            }

            const redirectParam = searchParams.redirect;
            const redirectTo = Array.isArray(redirectParam) ? redirectParam[0] : (redirectParam || '/dashboard');
            navigate(redirectTo, { replace: true });
        } catch (err) {
            setError('Ocorreu um erro inesperado. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const getErrorMessage = (message: string): string => {
        if (message.includes('Invalid login credentials')) {
            return 'Email ou senha incorretos.';
        }
        if (message.includes('Email not confirmed')) {
            return 'Por favor, confirme seu email antes de fazer login.';
        }
        return message;
    };

    const handleGoogleLogin = async () => {
        const { error } = await signInWithGoogle();
        if (error) {
            setError(error.message);
        }
    };

    return (
        <div class="auth-layout">
            {/* Left Panel - Form */}
            <div class="auth-panel-left">
                <div class="auth-logo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18" />
                        <path d="M9 21V9" />
                    </svg>
                    <span>Studio Manager</span>
                </div>

                <div class="auth-form-container">
                    <h1 class="auth-title">Entre na sua conta</h1>
                    <p class="auth-subtitle">Gerencie seus projetos e clientes em um só lugar</p>

                    {/* Google Login Button */}
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={handleGoogleLogin}
                        class="auth-social-btn"
                        icon={
                            <svg viewBox="0 0 24 24" width="20" height="20">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        }
                    >
                        Continuar com Google
                    </Button>

                    <div class="auth-divider">ou</div>

                    <form class="auth-form" onSubmit={handleSubmit}>
                        <Show when={error()}>
                            <div class="alert alert-error">{error()}</div>
                        </Show>

                        <Input
                            id="email"
                            type="email"
                            label="Email"
                            placeholder="Digite seu email"
                            value={email()}
                            onInput={(e) => setEmail(e.currentTarget.value)}
                            required
                            disabled={loading()}
                            fullWidth
                        />

                        <Input
                            id="password"
                            type="password"
                            label="Senha"
                            placeholder="Digite sua senha"
                            value={password()}
                            onInput={(e) => setPassword(e.currentTarget.value)}
                            required
                            disabled={loading()}
                            minLength={6}
                            fullWidth
                        />

                        <div style={{ "text-align": "right" }}>
                            <A href="/forgot-password" class="auth-forgot-link">
                                Esqueceu a senha?
                            </A>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            loading={loading()}
                            class="auth-submit-btn"
                        >
                            Entrar
                        </Button>
                    </form>

                    <div class="auth-form-footer">
                        Não tem uma conta?{' '}
                        <A href="/signup">Criar conta</A>
                    </div>
                </div>
            </div>

            {/* Right Panel - Hero */}
            <div class="auth-panel-right">
                <div class="auth-hero-content">
                    <h2 class="auth-hero-title">
                        Gerencie sua agência<br />
                        com eficiência
                    </h2>
                    <p class="auth-hero-subtitle">
                        Organize projetos, acompanhe tempos e mantenha
                        seus clientes satisfeitos em uma plataforma única.
                    </p>
                    <div class="auth-hero-badges">
                        <span class="auth-hero-badge">
                            <i class="ci-Check_Big"></i>
                            Projetos ilimitados
                        </span>
                        <span class="auth-hero-badge">
                            <i class="ci-Clock"></i>
                            Timesheet integrado
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
