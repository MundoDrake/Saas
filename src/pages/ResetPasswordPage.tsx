import { Component, createSignal, Show } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import { Button, Input } from '../components/ui';
import '../styles/auth.css';

export const ResetPasswordPage: Component = () => {
    const navigate = useNavigate();

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
            const { error: authError } = await supabase.auth.updateUser({
                password: password(),
            });

            if (authError) {
                setError(authError.message);
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                navigate('/dashboard', { replace: true });
            }, 2000);
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
                    <p class="auth-card-title">Redefinir senha</p>
                </div>

                <div class="auth-card-body">
                    <Show
                        when={!success()}
                        fallback={
                            <div class="alert alert-success" style={{ "text-align": "center" }}>
                                <strong>Senha alterada com sucesso!</strong>
                                <p style={{ "margin-top": "var(--spacing-2)" }}>
                                    Você será redirecionado para o dashboard em instantes...
                                </p>
                            </div>
                        }
                    >
                        <form class="auth-form" onSubmit={handleSubmit}>
                            <Show when={error()}>
                                <div class="alert alert-error">{error()}</div>
                            </Show>

                            <Input
                                id="password"
                                type="password"
                                label="Nova Senha"
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
                                label="Confirmar Nova Senha"
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
                                Redefinir Senha
                            </Button>
                        </form>
                    </Show>
                </div>
            </div>
        </div>
    );
};
