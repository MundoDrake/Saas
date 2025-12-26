import { Component, createSignal, Show } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/ui';
import '../styles/auth.css';

export const SignUpPage: Component = () => {
    const navigate = useNavigate();
    const { signUp } = useAuth();

    const [email, setEmail] = createSignal('');
    const [password, setPassword] = createSignal('');
    const [confirmPassword, setConfirmPassword] = createSignal('');
    const [loading, setLoading] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    const [success, setSuccess] = createSignal(false);

    const validateForm = (): string | null => {
        if (password().length < 8) {
            return 'A senha deve ter pelo menos 8 caracteres.';
        }
        if (password() !== confirmPassword()) {
            return 'As senhas não coincidem.';
        }
        return null;
    };

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        setError(null);

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {
            const { error: authError } = await signUp(email(), password());

            if (authError) {
                setError(getErrorMessage(authError.message));
                return;
            }

            setSuccess(true);
        } catch (err) {
            setError('Ocorreu um erro inesperado. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const getErrorMessage = (message: string): string => {
        if (message.includes('User already registered')) {
            return 'Este email já está cadastrado.';
        }
        if (message.includes('Password should be at least')) {
            return 'A senha deve ter pelo menos 8 caracteres.';
        }
        return message;
    };

    return (
        <div class="auth-layout">
            <div class="auth-card">
                <div class="auth-card-header">
                    <div class="auth-card-logo">Studio Manager</div>
                    <p class="auth-card-title">Crie sua conta</p>
                </div>

                <div class="auth-card-body">
                    <Show
                        when={!success()}
                        fallback={
                            <div class="alert alert-success" style={{ "text-align": "center" }}>
                                <strong>Conta criada com sucesso!</strong>
                                <p style={{ "margin-top": "var(--spacing-2)" }}>
                                    Enviamos um email de confirmação para <strong>{email()}</strong>.
                                    Por favor, verifique sua caixa de entrada e clique no link para ativar sua conta.
                                </p>
                                <Button
                                    variant="primary"
                                    onClick={() => navigate('/login')}
                                    style={{ "margin-top": "var(--spacing-4)" }}
                                >
                                    Ir para Login
                                </Button>
                            </div>
                        }
                    >
                        <form class="auth-form" onSubmit={handleSubmit}>
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

                            <Input
                                id="password"
                                type="password"
                                label="Senha"
                                placeholder="Mínimo 8 caracteres"
                                value={password()}
                                onInput={(e) => setPassword(e.currentTarget.value)}
                                required
                                disabled={loading()}
                                minLength={8}
                                hint="Mínimo de 8 caracteres"
                                fullWidth
                            />

                            <Input
                                id="confirm-password"
                                type="password"
                                label="Confirmar Senha"
                                placeholder="Repita a senha"
                                value={confirmPassword()}
                                onInput={(e) => setConfirmPassword(e.currentTarget.value)}
                                required
                                disabled={loading()}
                                minLength={8}
                                fullWidth
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                fullWidth
                                loading={loading()}
                            >
                                Criar Conta
                            </Button>
                        </form>

                        <div class="auth-form-footer">
                            Já tem uma conta?{' '}
                            <A href="/login">Fazer login</A>
                        </div>
                    </Show>
                </div>
            </div>
        </div>
    );
};
