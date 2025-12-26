import { Component, createSignal, createEffect, Show } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui';
import type { Client, ClientInput } from '../types/database';
import { AppLayout } from '../components/AppLayout';

export const ClientFormPage: Component = () => {
    const navigate = useNavigate();
    const params = useParams();
    const { user } = useAuth();

    const isEditing = () => !!params.id;

    const [loading, setLoading] = createSignal(false);
    const [saving, setSaving] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);

    // Form fields
    const [name, setName] = createSignal('');
    const [tradingName, setTradingName] = createSignal('');
    const [documentNumber, setDocumentNumber] = createSignal('');
    const [email, setEmail] = createSignal('');
    const [phone, setPhone] = createSignal('');
    const [notes, setNotes] = createSignal('');

    // Load existing client if editing
    createEffect(async () => {
        if (!params.id) return;

        setLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('clients')
                .select('*')
                .eq('id', params.id)
                .single();

            if (fetchError) throw fetchError;

            if (data) {
                setName(data.name || '');
                setTradingName(data.trading_name || '');
                setDocumentNumber(data.document_number || '');
                setEmail(data.email || '');
                setPhone(data.phone || '');
                setNotes(data.notes || '');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar cliente');
        } finally {
            setLoading(false);
        }
    });

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        try {
            const clientData = {
                name: name().trim(),
                trading_name: tradingName().trim() || null,
                document_number: documentNumber().trim() || null,
                email: email().trim() || null,
                phone: phone().trim() || null,
                notes: notes().trim() || null,
            };

            if (isEditing()) {
                const { error: updateError } = await supabase
                    .from('clients')
                    .update(clientData)
                    .eq('id', params.id);

                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('clients')
                    .insert({
                        ...clientData,
                        created_by: user()?.id,
                    });

                if (insertError) throw insertError;
            }

            navigate('/clients');
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar cliente');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
            return;
        }

        setSaving(true);
        try {
            const { error: deleteError } = await supabase
                .from('clients')
                .delete()
                .eq('id', params.id);

            if (deleteError) throw deleteError;
            navigate('/clients');
        } catch (err: any) {
            setError(err.message || 'Erro ao excluir cliente');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppLayout>
            <div class="page-header">
                <h2 class="page-title">
                    {isEditing() ? 'Editar Cliente' : 'Novo Cliente'}
                </h2>
                <p class="page-description">
                    {isEditing() ? 'Atualize as informações do cliente' : 'Preencha os dados do novo cliente'}
                </p>
            </div>

            <Show
                when={!loading()}
                fallback={
                    <div class="loading-container">
                        <div class="spinner spinner-lg" />
                    </div>
                }
            >
                <div class="card" style={{ "max-width": "640px" }}>
                    <div class="card-body">
                        <form onSubmit={handleSubmit}>
                            <Show when={error()}>
                                <div class="alert alert-error" style={{ "margin-bottom": "var(--spacing-4)" }}>
                                    {error()}
                                </div>
                            </Show>

                            <div style={{ display: "flex", "flex-direction": "column", gap: "var(--spacing-4)" }}>
                                <div class="form-group">
                                    <label class="form-label" for="name">Nome da Empresa *</label>
                                    <input
                                        id="name"
                                        type="text"
                                        class="form-input"
                                        placeholder="Ex: Acme Corporation"
                                        value={name()}
                                        onInput={(e) => setName(e.currentTarget.value)}
                                        required
                                        disabled={saving()}
                                    />
                                </div>

                                <div class="form-group">
                                    <label class="form-label" for="trading-name">Nome Fantasia</label>
                                    <input
                                        id="trading-name"
                                        type="text"
                                        class="form-input"
                                        placeholder="Ex: Acme"
                                        value={tradingName()}
                                        onInput={(e) => setTradingName(e.currentTarget.value)}
                                        disabled={saving()}
                                    />
                                </div>

                                <div class="form-group">
                                    <label class="form-label" for="document">CNPJ / CPF</label>
                                    <input
                                        id="document"
                                        type="text"
                                        class="form-input"
                                        placeholder="00.000.000/0000-00"
                                        value={documentNumber()}
                                        onInput={(e) => setDocumentNumber(e.currentTarget.value)}
                                        disabled={saving()}
                                    />
                                </div>

                                <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "var(--spacing-4)" }}>
                                    <div class="form-group">
                                        <label class="form-label" for="email">Email</label>
                                        <input
                                            id="email"
                                            type="email"
                                            class="form-input"
                                            placeholder="contato@empresa.com"
                                            value={email()}
                                            onInput={(e) => setEmail(e.currentTarget.value)}
                                            disabled={saving()}
                                        />
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label" for="phone">Telefone</label>
                                        <input
                                            id="phone"
                                            type="tel"
                                            class="form-input"
                                            placeholder="(11) 99999-9999"
                                            value={phone()}
                                            onInput={(e) => setPhone(e.currentTarget.value)}
                                            disabled={saving()}
                                        />
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="form-label" for="notes">Observações</label>
                                    <textarea
                                        id="notes"
                                        class="form-input"
                                        placeholder="Notas internas sobre o cliente..."
                                        value={notes()}
                                        onInput={(e) => setNotes(e.currentTarget.value)}
                                        disabled={saving()}
                                        rows={4}
                                        style={{ resize: "vertical" }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "flex", "justify-content": "space-between", "margin-top": "var(--spacing-6)" }}>
                                <Show when={isEditing()}>
                                    <Button
                                        variant="danger"
                                        onClick={handleDelete}
                                        disabled={saving()}
                                        icon={<i class="ci-Trash_Empty"></i>}
                                    >
                                        Excluir
                                    </Button>
                                </Show>
                                <div style={{ display: "flex", gap: "var(--spacing-3)", "margin-left": "auto" }}>
                                    <Button
                                        variant="secondary"
                                        onClick={() => navigate('/clients')}
                                        disabled={saving()}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={saving() || !name().trim()}
                                        loading={saving()}
                                    >
                                        {isEditing() ? 'Salvar' : 'Criar Cliente'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </Show>
        </AppLayout>
    );
};
