import { Component, createSignal, Show } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/ui';
import '../styles/auth.css';

export const ForgotPasswordPage: Component = () => {
    const { resetPassword } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = createSignal('');
    const [loading, setLoading] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    const [success, setSuccess] = createSignal(false);

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { error: authError } = await resetPassword(email());

            if (authError) {
                setError(authError.message);
                return;
            }

            setSuccess(true);
        } catch (err) {
            setError('Ocorreu um erro inesperado. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div class="auth-layout">
            <div class="auth-card">
                <div class="auth-card-header">
                    <div class="auth-card-logo">Studio Manager</div>
                    <p class="auth-card-title">Recuperar senha</p>
                </div>

                <div class="auth-card-body">
                    <Show
                        when={!success()}
                        fallback={
                            <div class="alert alert-success" style={{ "text-align": "center" }}>
                                <strong>Email enviado!</strong>
                                <p style={{ "margin-top": "var(--spacing-2)" }}>
                                    Enviamos um link de recuperação para <strong>{email()}</strong>.
                                    Verifique sua caixa de entrada e clique no link para redefinir sua senha.
                                </p>
                                <Button
                                    variant="primary"
                                    onClick={() => navigate('/login')}
                                    style={{ "margin-top": "var(--spacing-4)" }}
                                >
                                    Voltar para Login
                                </Button>
                            </div>
                        }
                    >
                        <form class="auth-form" onSubmit={handleSubmit}>
                            <p style={{ "font-size": "var(--font-size-sm)", "color": "var(--color-neutral-500)", "margin-bottom": "var(--spacing-4)" }}>
                                Digite o email associado à sua conta e enviaremos um link para redefinir sua senha.
                            </p>

                            <Show when={error()}>
                                <div class="alert alert-error">{error()}</div>
                            </Show>

                            <Input
                                id="email"
                                type="email"
                                label="Email"
                                placeholder="seu@email.com"
                                value={email()}
                                onInput={(e) => setEmail(e.currentTarget.value)}
                                required
                                disabled={loading()}
                                fullWidth
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                fullWidth
                                loading={loading()}
                            >
                                Enviar Link
                            </Button>
                        </form>

                        <div class="auth-form-footer">
                            Lembrou a senha?{' '}
                            <A href="/login">Voltar para login</A>
                        </div>
                    </Show>
                </div>
            </div>
        </div>
    );
};
