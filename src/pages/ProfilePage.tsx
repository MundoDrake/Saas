import { Component, Show, createSignal, createEffect } from 'solid-js';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProfileContext } from '../contexts/ProfileContext';
import { AppLayout } from '../components/AppLayout';

export const ProfilePage: Component = () => {
    const { user } = useAuth();
    const { profile, role, refreshProfile } = useProfileContext();

    // Profile form
    const [fullName, setFullName] = createSignal('');
    const [avatarUrl, setAvatarUrl] = createSignal('');
    const [saving, setSaving] = createSignal(false);
    const [profileMessage, setProfileMessage] = createSignal<{ type: 'success' | 'error'; text: string } | null>(null);

    // Password form
    const [currentPassword, setCurrentPassword] = createSignal('');
    const [newPassword, setNewPassword] = createSignal('');
    const [confirmPassword, setConfirmPassword] = createSignal('');
    const [changingPassword, setChangingPassword] = createSignal(false);
    const [passwordMessage, setPasswordMessage] = createSignal<{ type: 'success' | 'error'; text: string } | null>(null);

    // Avatar upload
    const [uploadingAvatar, setUploadingAvatar] = createSignal(false);

    // Load profile data
    createEffect(() => {
        const p = profile();
        if (p) {
            setFullName(p.full_name || '');
            setAvatarUrl(p.avatar_url || '');
        }
    });

    const handleProfileSubmit = async (e: Event) => {
        e.preventDefault();
        setSaving(true);
        setProfileMessage(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName(),
                    avatar_url: avatarUrl() || null,
                })
                .eq('user_id', user()?.id);

            if (error) throw error;

            await refreshProfile();
            setProfileMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setProfileMessage({ type: 'error', text: err.message || 'Erro ao atualizar perfil' });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordSubmit = async (e: Event) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (newPassword() !== confirmPassword()) {
            setPasswordMessage({ type: 'error', text: 'As senhas não coincidem' });
            return;
        }

        if (newPassword().length < 6) {
            setPasswordMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres' });
            return;
        }

        setChangingPassword(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword(),
            });

            if (error) throw error;

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
        } catch (err: any) {
            console.error('Error changing password:', err);
            setPasswordMessage({ type: 'error', text: err.message || 'Erro ao alterar senha' });
        } finally {
            setChangingPassword(false);
        }
    };

    const handleAvatarUpload = async (e: Event) => {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        setProfileMessage(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user()?.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('uploads')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('uploads')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);

            // Auto-save avatar
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('user_id', user()?.id);

            if (updateError) throw updateError;

            await refreshProfile();
            setProfileMessage({ type: 'success', text: 'Avatar atualizado!' });
        } catch (err: any) {
            console.error('Error uploading avatar:', err);
            setProfileMessage({ type: 'error', text: err.message || 'Erro ao enviar avatar' });
        } finally {
            setUploadingAvatar(false);
        }
    };

    const avatarInitial = () => {
        const name = fullName() || user()?.email || 'U';
        return name.charAt(0).toUpperCase();
    };

    return (
        <AppLayout>
            <div class="page-header">
                <div>
                    <h2 class="page-title">Meu Perfil</h2>
                    <p class="page-description">Gerencie suas informações pessoais</p>
                </div>
            </div>

            <div class="profile-grid">
                {/* Profile Card */}
                <div class="profile-card">
                    <h3 class="profile-section-title">Informações do Perfil</h3>

                    <form onSubmit={handleProfileSubmit}>
                        {/* Avatar */}
                        <div class="profile-avatar-section">
                            <div class="profile-avatar-large">
                                <Show
                                    when={avatarUrl()}
                                    fallback={<span class="profile-avatar-initial">{avatarInitial()}</span>}
                                >
                                    <img src={avatarUrl()} alt="Avatar" class="profile-avatar-img" />
                                </Show>
                            </div>
                            <div class="profile-avatar-upload">
                                <label class="btn btn-secondary">
                                    <Show when={!uploadingAvatar()} fallback={<><div class="spinner spinner-sm" /> Enviando...</>}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                        Alterar Avatar
                                    </Show>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        style={{ display: "none" }}
                                        disabled={uploadingAvatar()}
                                    />
                                </label>
                                <p class="profile-avatar-hint">JPG, PNG ou GIF. Máximo 2MB.</p>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Nome Completo</label>
                            <input
                                type="text"
                                class="form-input"
                                value={fullName()}
                                onInput={(e) => setFullName(e.currentTarget.value)}
                                placeholder="Seu nome"
                            />
                        </div>

                        <div class="form-group">
                            <label class="form-label">E-mail</label>
                            <input
                                type="email"
                                class="form-input"
                                value={user()?.email || ''}
                                disabled
                                style={{ background: "var(--color-bg-hover)", cursor: "not-allowed" }}
                            />
                            <span class="form-hint">O e-mail não pode ser alterado</span>
                        </div>

                        <Show when={role()}>
                            <div class="form-group">
                                <label class="form-label">Função</label>
                                <input
                                    type="text"
                                    class="form-input"
                                    value={role()?.description || role()?.name || ''}
                                    disabled
                                    style={{ background: "var(--color-bg-hover)", cursor: "not-allowed" }}
                                />
                            </div>
                        </Show>

                        <Show when={profileMessage()}>
                            <div class={`profile-message profile-message-${profileMessage()?.type}`}>
                                {profileMessage()?.text}
                            </div>
                        </Show>

                        <button type="submit" class="btn btn-primary" disabled={saving()}>
                            <Show when={saving()} fallback="Salvar Alterações">
                                <div class="spinner spinner-sm" /> Salvando...
                            </Show>
                        </button>
                    </form>
                </div>

                {/* Password Card */}
                <div class="profile-card">
                    <h3 class="profile-section-title">Alterar Senha</h3>

                    <form onSubmit={handlePasswordSubmit}>
                        <div class="form-group">
                            <label class="form-label">Nova Senha</label>
                            <input
                                type="password"
                                class="form-input"
                                value={newPassword()}
                                onInput={(e) => setNewPassword(e.currentTarget.value)}
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>

                        <div class="form-group">
                            <label class="form-label">Confirmar Nova Senha</label>
                            <input
                                type="password"
                                class="form-input"
                                value={confirmPassword()}
                                onInput={(e) => setConfirmPassword(e.currentTarget.value)}
                                placeholder="Digite novamente"
                            />
                        </div>

                        <Show when={passwordMessage()}>
                            <div class={`profile-message profile-message-${passwordMessage()?.type}`}>
                                {passwordMessage()?.text}
                            </div>
                        </Show>

                        <button type="submit" class="btn btn-primary" disabled={changingPassword() || !newPassword()}>
                            <Show when={changingPassword()} fallback="Alterar Senha">
                                <div class="spinner spinner-sm" /> Alterando...
                            </Show>
                        </button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
};
