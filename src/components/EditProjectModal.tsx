import { Component, createSignal, createEffect, Show, For, onMount, onCleanup } from 'solid-js';
import { supabase } from '../lib/supabase';
import { Button } from './ui';
import type { Project } from '../types/database';

// Simplified types for dropdowns
interface ClientOption {
    id: string;
    name: string;
}

interface EditProjectModalProps {
    isOpen: boolean;
    projectId: string | null;
    onClose: () => void;
    onSuccess: () => void;
}

const STATUS_OPTIONS = [
    { value: 'draft', label: 'Rascunho' },
    { value: 'active', label: 'Ativo' },
    { value: 'paused', label: 'Pausado' },
    { value: 'completed', label: 'Concluído' },
    { value: 'cancelled', label: 'Cancelado' },
];

export const EditProjectModal: Component<EditProjectModalProps> = (props) => {
    // Form state (editáveis)
    const [name, setName] = createSignal('');
    const [status, setStatus] = createSignal('draft');
    const [budget, setBudget] = createSignal('');
    const [coverImage, setCoverImage] = createSignal<string | null>(null);
    const [coverFile, setCoverFile] = createSignal<File | null>(null);
    const [coverPreview, setCoverPreview] = createSignal<string | null>(null);

    // Read-only fields
    const [clientName, setClientName] = createSignal('');
    const [nichoMercado, setNichoMercado] = createSignal('');
    const [briefingInicial, setBriefingInicial] = createSignal('');

    // UI state
    const [loading, setLoading] = createSignal(false);
    const [loadingProject, setLoadingProject] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    const [nameError, setNameError] = createSignal(false);
    const [uploadingCover, setUploadingCover] = createSignal(false);

    // File input ref
    let coverInputRef: HTMLInputElement | undefined;

    // Fetch project data when modal opens
    createEffect(() => {
        if (props.isOpen && props.projectId) {
            fetchProject();
        }
    });

    const fetchProject = async () => {
        if (!props.projectId) return;

        setLoadingProject(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('projects')
                .select(`
                    *,
                    client:clients(name)
                `)
                .eq('id', props.projectId)
                .single();

            if (fetchError) throw fetchError;

            if (data) {
                setName(data.name || '');
                setStatus(data.status || 'draft');
                setBudget(data.budget?.toString() || '');
                setClientName(data.client?.name || 'Sem cliente');
                setNichoMercado(data.nicho_mercado || '');
                setBriefingInicial(data.briefing_inicial || '');
                setCoverImage(data.cover_image || null);
                setCoverPreview(data.cover_image || null);
            }
        } catch (err: any) {
            console.error('Error fetching project:', err);
            setError('Erro ao carregar projeto');
        } finally {
            setLoadingProject(false);
        }
    };

    const validate = (): boolean => {
        if (!name().trim()) {
            setNameError(true);
            return false;
        }
        setNameError(false);
        return true;
    };

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        setError(null);

        if (!validate()) return;

        setLoading(true);

        try {
            let finalCoverUrl = coverImage();

            // Upload cover if new file selected
            if (coverFile()) {
                setUploadingCover(true);
                const file = coverFile()!;
                const fileExt = file.name.split('.').pop();
                const fileName = `${props.projectId}-${Date.now()}.${fileExt}`;
                const filePath = `project-covers/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('assets')
                    .upload(filePath, file, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('assets')
                    .getPublicUrl(filePath);

                finalCoverUrl = publicUrl;
                setUploadingCover(false);
            }

            const { error: updateError } = await supabase
                .from('projects')
                .update({
                    name: name().trim(),
                    status: status(),
                    budget: budget() ? parseFloat(budget()) : null,
                    cover_image: finalCoverUrl,
                })
                .eq('id', props.projectId);

            if (updateError) throw updateError;

            props.onSuccess();

        } catch (err: any) {
            console.error('Error updating project:', err);
            setError(err.message || 'Erro ao atualizar projeto');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        props.onClose();
    };

    // Handle escape key
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && props.isOpen) {
            handleClose();
        }
    };

    onMount(() => {
        document.addEventListener('keydown', handleKeyDown);
    });

    onCleanup(() => {
        document.removeEventListener('keydown', handleKeyDown);
    });

    const charCount = () => name().length;

    // Format briefing for display
    const formattedBriefing = () => {
        const briefing = briefingInicial();
        if (!briefing) return 'Nenhum briefing adicionado';

        if (briefing.startsWith('[Link do Drive]:')) {
            return briefing.replace('[Link do Drive]: ', '📎 ');
        }
        if (briefing.startsWith('[Arquivo]:')) {
            return briefing.replace('[Arquivo]: ', '📄 ');
        }
        return briefing;
    };

    return (
        <Show when={props.isOpen}>
            <div class="modal-overlay" onClick={handleClose}>
                <div class="modal quick-project-modal-v2" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div class="qpm-header">
                        <div class="qpm-header-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                        </div>
                        <div class="qpm-header-text">
                            <h3 class="qpm-title">Editar projeto</h3>
                            <p class="qpm-subtitle">Atualize as informações do projeto.</p>
                        </div>
                        <button class="qpm-close" onClick={handleClose} type="button">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    <Show
                        when={!loadingProject()}
                        fallback={
                            <div class="qpm-body" style={{ display: "flex", "align-items": "center", "justify-content": "center", "min-height": "300px" }}>
                                <div class="spinner spinner-lg" />
                            </div>
                        }
                    >
                        <form onSubmit={handleSubmit}>
                            <div class="qpm-body">
                                <Show when={error()}>
                                    <div class="alert alert-error" style={{ "margin-bottom": "var(--spacing-4)" }}>
                                        {error()}
                                    </div>
                                </Show>

                                <div class="qpm-columns">
                                    {/* Left Column - Editable Fields */}
                                    <div class="qpm-column">
                                        <div class="qpm-section-header">
                                            <h4 class="qpm-section-title">Informações do projeto</h4>
                                            <p class="qpm-section-desc">
                                                Edite o nome, status e orçamento do projeto.
                                            </p>
                                        </div>

                                        {/* Nome */}
                                        <div class="form-group" style={{ "margin-bottom": "var(--spacing-4)" }}>
                                            <label class="form-label">
                                                Nome do projeto <span style={{ color: "var(--color-error-500)" }}>*</span>
                                            </label>
                                            <div style={{ position: "relative" }}>
                                                <input
                                                    type="text"
                                                    class="form-input"
                                                    classList={{ 'form-input-error': nameError() }}
                                                    placeholder="Ex: Empresa XYZ"
                                                    value={name()}
                                                    onInput={(e) => {
                                                        const value = e.currentTarget.value.slice(0, 60);
                                                        setName(value);
                                                        setNameError(false);
                                                    }}
                                                    maxLength={60}
                                                />
                                                <span class="qpm-char-count">{charCount()}/60</span>
                                            </div>
                                            <Show when={nameError()}>
                                                <span class="form-error">Nome é obrigatório</span>
                                            </Show>
                                        </div>

                                        {/* Cliente (read-only) */}
                                        <div class="form-group" style={{ "margin-bottom": "var(--spacing-4)" }}>
                                            <label class="form-label">Cliente</label>
                                            <div class="qpm-readonly-field">
                                                {clientName()}
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div class="form-group" style={{ "margin-bottom": "var(--spacing-4)" }}>
                                            <label class="form-label">Status</label>
                                            <select
                                                class="form-input"
                                                value={status()}
                                                onChange={(e) => setStatus(e.currentTarget.value)}
                                            >
                                                <For each={STATUS_OPTIONS}>
                                                    {(opt) => (
                                                        <option value={opt.value}>{opt.label}</option>
                                                    )}
                                                </For>
                                            </select>
                                        </div>

                                        {/* Budget */}
                                        <div class="form-group" style={{ "margin-bottom": "var(--spacing-4)" }}>
                                            <label class="form-label">Orçamento (R$)</label>
                                            <input
                                                type="number"
                                                class="form-input"
                                                placeholder="0,00"
                                                value={budget()}
                                                onInput={(e) => setBudget(e.currentTarget.value)}
                                                step="0.01"
                                                min="0"
                                            />
                                        </div>

                                        {/* Cover Image */}
                                        <div class="form-group">
                                            <label class="form-label">Imagem de Capa</label>
                                            <input
                                                ref={coverInputRef}
                                                type="file"
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={(e) => {
                                                    const file = e.currentTarget.files?.[0];
                                                    if (file) {
                                                        setCoverFile(file);
                                                        setCoverPreview(URL.createObjectURL(file));
                                                    }
                                                }}
                                            />
                                            <div
                                                class="cover-upload-area"
                                                onClick={() => coverInputRef?.click()}
                                                style={{
                                                    border: "2px dashed var(--color-border)",
                                                    "border-radius": "var(--radius-md)",
                                                    padding: "var(--spacing-4)",
                                                    "text-align": "center",
                                                    cursor: "pointer",
                                                    "background": "var(--color-bg-secondary)",
                                                    transition: "all var(--transition-fast)",
                                                }}
                                            >
                                                <Show
                                                    when={coverPreview()}
                                                    fallback={
                                                        <div style={{ color: "var(--color-text-secondary)" }}>
                                                            <i class="ci-Image" style={{ "font-size": "24px", "margin-bottom": "var(--spacing-2)" }}></i>
                                                            <p style={{ "font-size": "var(--font-size-sm)" }}>Clique para selecionar uma imagem</p>
                                                        </div>
                                                    }
                                                >
                                                    <img
                                                        src={coverPreview()!}
                                                        alt="Cover preview"
                                                        style={{
                                                            "max-width": "100%",
                                                            "max-height": "120px",
                                                            "border-radius": "var(--radius-sm)",
                                                            "object-fit": "cover"
                                                        }}
                                                    />
                                                    <p style={{ "font-size": "var(--font-size-xs)", color: "var(--color-text-secondary)", "margin-top": "var(--spacing-2)" }}>
                                                        Clique para alterar
                                                    </p>
                                                </Show>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column - Read-only Briefing */}
                                    <div class="qpm-column">
                                        <div class="qpm-section-header">
                                            <h4 class="qpm-section-title">Briefing</h4>
                                            <p class="qpm-section-desc">
                                                Visualização do briefing adicionado na criação do projeto.
                                            </p>
                                        </div>

                                        {/* Setor/Nicho (read-only) */}
                                        <Show when={nichoMercado()}>
                                            <div class="form-group" style={{ "margin-bottom": "var(--spacing-4)" }}>
                                                <label class="form-label">Setor / Nicho</label>
                                                <div class="qpm-readonly-field">
                                                    {nichoMercado()}
                                                </div>
                                            </div>
                                        </Show>

                                        {/* Briefing (read-only) */}
                                        <div class="form-group">
                                            <label class="form-label">Conteúdo do briefing</label>
                                            <div class="qpm-briefing-readonly">
                                                {formattedBriefing()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div class="qpm-footer">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleClose}
                                    disabled={loading()}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    loading={loading()}
                                    icon={<i class="ci-Save"></i>}
                                >
                                    Salvar alterações
                                </Button>
                            </div>
                        </form>
                    </Show>
                </div>
            </div>
        </Show>
    );
};
