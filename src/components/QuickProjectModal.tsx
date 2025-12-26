import { Component, createSignal, createEffect, Show, For, onMount, onCleanup } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui';
import type { CreateProjectInput } from '../types/database';

const STORAGE_KEY = 'studio-manager-project-draft';

// Simplified types for dropdowns
interface ClientOption {
    id: string;
    name: string;
}

interface ProjectTemplate {
    id: string;
    name: string;
    description: string | null;
}

interface QuickProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (projectId: string) => void;
}

type BriefingMode = 'upload' | 'drive' | 'write';

// Setor/Nicho options
const SETOR_OPTIONS = [
    'Tecnologia',
    'Moda',
    'Gastronomia',
    'Saúde & Bem-estar',
    'Educação',
    'Finanças',
    'Varejo',
    'Imobiliário',
    'Automotivo',
    'Entretenimento',
    'Turismo',
    'Agronegócio',
    'Indústria',
    'Serviços',
    'Outro',
];

const loadDraft = (): Partial<CreateProjectInput & { briefing_mode?: BriefingMode; drive_link?: string }> => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error('Error loading draft:', e);
    }
    return {};
};

const saveDraft = (data: Partial<CreateProjectInput & { briefing_mode?: BriefingMode; drive_link?: string }>) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Error saving draft:', e);
    }
};

const clearDraft = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error('Error clearing draft:', e);
    }
};

export const QuickProjectModal: Component<QuickProjectModalProps> = (props) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Form state
    const [name, setName] = createSignal('');
    const [clientId, setClientId] = createSignal('');
    const [nichoMercado, setNichoMercado] = createSignal('');
    const [briefingInicial, setBriefingInicial] = createSignal('');
    const [templateId, setTemplateId] = createSignal('');

    // Briefing mode
    const [briefingMode, setBriefingMode] = createSignal<BriefingMode>('upload');
    const [driveLink, setDriveLink] = createSignal('');
    const [uploadedFile, setUploadedFile] = createSignal<File | null>(null);
    const [uploadedFileContent, setUploadedFileContent] = createSignal<string>('');
    const [isDragging, setIsDragging] = createSignal(false);

    // Data
    const [clients, setClients] = createSignal<ClientOption[]>([]);
    const [templates, setTemplates] = createSignal<ProjectTemplate[]>([]);

    // UI state
    const [loading, setLoading] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    const [nameError, setNameError] = createSignal(false);
    const [clientError, setClientError] = createSignal(false);
    const [nichoError, setNichoError] = createSignal(false);

    let fileInputRef: HTMLInputElement | undefined;

    // Load draft on mount
    onMount(() => {
        const draft = loadDraft();
        if (draft.name) setName(draft.name);
        if (draft.client_id) setClientId(draft.client_id);
        if (draft.nicho_mercado) setNichoMercado(draft.nicho_mercado);
        if (draft.briefing_inicial) setBriefingInicial(draft.briefing_inicial);
        if (draft.template_id) setTemplateId(draft.template_id);
        if (draft.briefing_mode) setBriefingMode(draft.briefing_mode);
        if (draft.drive_link) setDriveLink(draft.drive_link);
    });

    // Save draft on changes
    createEffect(() => {
        if (props.isOpen) {
            saveDraft({
                name: name(),
                client_id: clientId(),
                nicho_mercado: nichoMercado(),
                briefing_inicial: briefingInicial(),
                template_id: templateId(),
                briefing_mode: briefingMode(),
                drive_link: driveLink(),
            });
        }
    });

    // Fetch clients and templates
    createEffect(() => {
        if (props.isOpen) {
            fetchClients();
            fetchTemplates();
        }
    });

    const fetchClients = async () => {
        const { data } = await supabase
            .from('clients')
            .select('id, name')
            .order('name');
        if (data) setClients(data);
    };

    const fetchTemplates = async () => {
        const { data } = await supabase
            .from('project_templates')
            .select('id, name, description')
            .order('name');
        if (data) setTemplates(data);
    };

    const validate = (): boolean => {
        let valid = true;

        if (!name().trim()) {
            setNameError(true);
            valid = false;
        } else {
            setNameError(false);
        }

        if (!clientId()) {
            setClientError(true);
            valid = false;
        } else {
            setClientError(false);
        }

        if (!nichoMercado()) {
            setNichoError(true);
            valid = false;
        } else {
            setNichoError(false);
        }

        return valid;
    };

    // File handling
    const handleFileSelect = async (file: File) => {
        const validTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const maxSize = 50 * 1024 * 1024; // 50MB

        if (!validTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.docx') && !file.name.endsWith('.pdf')) {
            setError('Formato inválido. Use TXT, DOCX ou PDF.');
            return;
        }

        if (file.size > maxSize) {
            setError('Arquivo muito grande. Máximo 50MB.');
            return;
        }

        setUploadedFile(file);
        setError(null);

        // Read TXT file content
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            try {
                const text = await file.text();
                setUploadedFileContent(text);
            } catch (err) {
                console.error('Error reading file:', err);
                setError('Erro ao ler o arquivo.');
            }
        } else {
            // For PDF/DOCX, we can't read content in browser easily
            // Store file name for now
            setUploadedFileContent(`[Arquivo ${file.name}] - Conteúdo não disponível para visualização (${file.type})`);
        }
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer?.files[0];
        if (file) handleFileSelect(file);
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleFileInputChange = (e: Event) => {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        setError(null);

        if (!validate()) return;

        setLoading(true);

        try {
            // Build briefing content based on mode
            let briefingContent = '';
            if (briefingMode() === 'write') {
                briefingContent = briefingInicial();
            } else if (briefingMode() === 'drive') {
                briefingContent = `[Link do Drive]: ${driveLink()}`;
            } else if (briefingMode() === 'upload' && uploadedFile()) {
                // Use the actual file content that was read
                briefingContent = uploadedFileContent();
            }

            // Create project
            const { data: project, error: projectError } = await supabase
                .from('projects')
                .insert({
                    name: name().trim(),
                    client_id: clientId(),
                    nicho_mercado: nichoMercado(),
                    briefing_inicial: briefingContent || null,
                    status: 'draft',
                    created_by: user()?.id,
                })
                .select('id')
                .single();

            if (projectError) throw projectError;

            // Apply template if selected
            if (templateId() && project) {
                await applyTemplate(project.id, templateId());
            }

            // Clear draft and close
            clearDraft();
            resetForm();
            props.onSuccess(project.id);

        } catch (err: any) {
            console.error('Error creating project:', err);
            setError(err.message || 'Erro ao criar projeto');
        } finally {
            setLoading(false);
        }
    };

    const applyTemplate = async (projectId: string, templateId: string) => {
        try {
            const { data: templateTasks } = await supabase
                .from('template_tasks')
                .select('*')
                .eq('template_id', templateId)
                .order('sort_order');

            if (!templateTasks || templateTasks.length === 0) return;

            const today = new Date();
            const tasks = templateTasks.map((tt, index) => ({
                project_id: projectId,
                title: tt.title,
                description: tt.description,
                status: 'backlog',
                priority: tt.priority || 'medium',
                sort_order: index,
                due_date: tt.days_offset
                    ? new Date(today.getTime() + tt.days_offset * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    : null,
                estimated_hours: tt.estimated_hours,
                created_by: user()?.id,
            }));

            await supabase.from('tasks').insert(tasks);
        } catch (err) {
            console.error('Error applying template:', err);
        }
    };

    const resetForm = () => {
        setName('');
        setClientId('');
        setNichoMercado('');
        setBriefingInicial('');
        setTemplateId('');
        setBriefingMode('upload');
        setDriveLink('');
        setUploadedFile(null);
        setNameError(false);
        setClientError(false);
        setNichoError(false);
        setError(null);
    };

    const handleClose = () => {
        props.onClose();
    };

    const handleClearDraft = () => {
        clearDraft();
        resetForm();
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

    return (
        <Show when={props.isOpen}>
            <div class="modal-overlay" onClick={handleClose}>
                <div class="modal quick-project-modal-v2" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div class="qpm-header">
                        <div class="qpm-header-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                        </div>
                        <div class="qpm-header-text">
                            <h3 class="qpm-title">Criar nova marca</h3>
                            <p class="qpm-subtitle">Configure os detalhes da marca e adicione o briefing.</p>
                        </div>
                        <button class="qpm-close" onClick={handleClose} type="button">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div class="qpm-body">
                            <Show when={error()}>
                                <div class="alert alert-error" style={{ "margin-bottom": "var(--spacing-4)" }}>
                                    {error()}
                                </div>
                            </Show>

                            <div class="qpm-columns">
                                {/* Left Column - Brand Info */}
                                <div class="qpm-column">
                                    <div class="qpm-section-header">
                                        <h4 class="qpm-section-title">Informações da marca</h4>
                                        <p class="qpm-section-desc">
                                            Essas informações ajudam a IA a criar conteúdo mais relevante e direcionado para sua marca.
                                        </p>
                                    </div>

                                    {/* Nome da Marca */}
                                    <div class="form-group" style={{ "margin-bottom": "var(--spacing-4)" }}>
                                        <label class="form-label">
                                            Nome da marca <span style={{ color: "var(--color-error-500)" }}>*</span>
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
                                                autofocus
                                            />
                                            <span class="qpm-char-count">{charCount()}/60</span>
                                        </div>
                                        <Show when={nameError()}>
                                            <span class="form-error">Nome é obrigatório</span>
                                        </Show>
                                    </div>

                                    {/* Cliente */}
                                    <div class="form-group" style={{ "margin-bottom": "var(--spacing-4)" }}>
                                        <label class="form-label">
                                            Cliente <span style={{ color: "var(--color-error-500)" }}>*</span>
                                        </label>
                                        <select
                                            class="form-input"
                                            classList={{ 'form-input-error': clientError() }}
                                            value={clientId()}
                                            onChange={(e) => {
                                                setClientId(e.currentTarget.value);
                                                setClientError(false);
                                            }}
                                        >
                                            <option value="">Selecione o cliente</option>
                                            <For each={clients()}>
                                                {(client) => (
                                                    <option value={client.id}>{client.name}</option>
                                                )}
                                            </For>
                                        </select>
                                        <Show when={clientError()}>
                                            <span class="form-error">Selecione um cliente</span>
                                        </Show>
                                    </div>

                                    {/* Setor / Nicho */}
                                    <div class="form-group" style={{ "margin-bottom": "var(--spacing-4)" }}>
                                        <label class="form-label">
                                            Setor / Nicho <span style={{ color: "var(--color-error-500)" }}>*</span>
                                        </label>
                                        <select
                                            class="form-input"
                                            classList={{ 'form-input-error': nichoError() }}
                                            value={nichoMercado()}
                                            onChange={(e) => {
                                                setNichoMercado(e.currentTarget.value);
                                                setNichoError(false);
                                            }}
                                        >
                                            <option value="">Selecione o setor</option>
                                            <For each={SETOR_OPTIONS}>
                                                {(setor) => (
                                                    <option value={setor}>{setor}</option>
                                                )}
                                            </For>
                                        </select>
                                        <Show when={nichoError()}>
                                            <span class="form-error">Selecione o setor</span>
                                        </Show>
                                    </div>

                                    {/* Template (opcional) */}
                                    <div class="form-group">
                                        <label class="form-label">Template de Tarefas</label>
                                        <select
                                            class="form-input"
                                            value={templateId()}
                                            onChange={(e) => setTemplateId(e.currentTarget.value)}
                                        >
                                            <option value="">Sem template</option>
                                            <For each={templates()}>
                                                {(template) => (
                                                    <option value={template.id}>{template.name}</option>
                                                )}
                                            </For>
                                        </select>
                                    </div>
                                </div>

                                {/* Right Column - Briefing */}
                                <div class="qpm-column">
                                    <div class="qpm-section-header">
                                        <h4 class="qpm-section-title">
                                            Briefing <span style={{ color: "var(--color-error-500)" }}>*</span>
                                        </h4>
                                        <p class="qpm-section-desc">
                                            Você pode criar o briefing de três maneiras diferentes: enviando um arquivo, link do Drive ou escrevendo manualmente.
                                        </p>
                                    </div>

                                    {/* Briefing Mode Tabs */}
                                    <div class="qpm-briefing-tabs">
                                        <button
                                            type="button"
                                            class="qpm-tab"
                                            classList={{ active: briefingMode() === 'upload' }}
                                            onClick={() => setBriefingMode('upload')}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="17 8 12 3 7 8" />
                                                <line x1="12" y1="3" x2="12" y2="15" />
                                            </svg>
                                            Enviar arquivo
                                        </button>
                                        <button
                                            type="button"
                                            class="qpm-tab"
                                            classList={{ active: briefingMode() === 'drive' }}
                                            onClick={() => setBriefingMode('drive')}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                            </svg>
                                            Arquivo no Drive
                                        </button>
                                        <button
                                            type="button"
                                            class="qpm-tab"
                                            classList={{ active: briefingMode() === 'write' }}
                                            onClick={() => setBriefingMode('write')}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                            Escrever briefing
                                        </button>
                                    </div>

                                    {/* Briefing Content based on mode */}
                                    <div class="qpm-briefing-content">
                                        {/* Upload Mode */}
                                        <Show when={briefingMode() === 'upload'}>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".txt,.docx,.pdf"
                                                style={{ display: 'none' }}
                                                onChange={handleFileInputChange}
                                            />
                                            <div
                                                class="qpm-dropzone"
                                                classList={{ 'qpm-dropzone-active': isDragging(), 'qpm-dropzone-filled': !!uploadedFile() }}
                                                onDrop={handleDrop}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onClick={() => fileInputRef?.click()}
                                            >
                                                <Show when={!uploadedFile()}>
                                                    <div class="qpm-dropzone-icon">
                                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                            <polyline points="17 8 12 3 7 8" />
                                                            <line x1="12" y1="3" x2="12" y2="15" />
                                                        </svg>
                                                    </div>
                                                    <p class="qpm-dropzone-text">
                                                        Arraste e solte o briefing ou clique para fazer upload
                                                    </p>
                                                    <p class="qpm-dropzone-hint">
                                                        Formatos aceitos: TXT, DOCX ou PDF (até 50MB)
                                                    </p>
                                                    <button type="button" class="btn btn-secondary qpm-dropzone-btn">
                                                        Procurar arquivo
                                                    </button>
                                                </Show>
                                                <Show when={uploadedFile()}>
                                                    <div class="qpm-file-preview">
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                            <polyline points="14 2 14 8 20 8" />
                                                        </svg>
                                                        <span class="qpm-file-name">{uploadedFile()!.name}</span>
                                                        <button
                                                            type="button"
                                                            class="qpm-file-remove"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setUploadedFile(null);
                                                            }}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                                <line x1="6" y1="6" x2="18" y2="18" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </Show>
                                            </div>
                                        </Show>

                                        {/* Drive Link Mode */}
                                        <Show when={briefingMode() === 'drive'}>
                                            <div class="qpm-drive-input">
                                                <label class="form-label">Link do Google Drive</label>
                                                <input
                                                    type="url"
                                                    class="form-input"
                                                    placeholder="https://drive.google.com/..."
                                                    value={driveLink()}
                                                    onInput={(e) => setDriveLink(e.currentTarget.value)}
                                                />
                                                <p class="form-hint">
                                                    Cole o link de compartilhamento do seu documento no Google Drive
                                                </p>
                                            </div>
                                        </Show>

                                        {/* Write Mode */}
                                        <Show when={briefingMode() === 'write'}>
                                            <textarea
                                                class="form-input qpm-textarea"
                                                placeholder="Descreva o projeto, objetivos, público-alvo, referências, valores da marca..."
                                                value={briefingInicial()}
                                                onInput={(e) => setBriefingInicial(e.currentTarget.value)}
                                            />
                                        </Show>
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
                                icon={<i class="ci-Bolt"></i>}
                            >
                                Criar marca
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Show>
    );
};
