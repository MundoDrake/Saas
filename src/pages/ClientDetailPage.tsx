import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import { A, useParams } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useStorage } from '../hooks/useStorage';
import type { Client, ClientDocument, BrandAsset, Project } from '../types/database';
import { AppLayout } from '../components/AppLayout';
import { FileUpload, UploadedFile } from '../components/FileUpload';
import { Button, Badge } from '../components/ui';

type TabType = 'info' | 'documents' | 'assets' | 'projects';

export const ClientDetailPage: Component = () => {
    const params = useParams();
    const { user } = useAuth();
    const { remove, getSignedUrl } = useStorage();

    const [client, setClient] = createSignal<Client | null>(null);
    const [documents, setDocuments] = createSignal<ClientDocument[]>([]);
    const [assets, setAssets] = createSignal<BrandAsset[]>([]);
    const [projects, setProjects] = createSignal<Project[]>([]);
    const [loading, setLoading] = createSignal(true);
    const [error, setError] = createSignal<string | null>(null);
    const [activeTab, setActiveTab] = createSignal<TabType>('info');

    const fetchClient = async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch client
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('*')
                .eq('id', params.id)
                .single();

            if (clientError) throw clientError;
            setClient(clientData);

            // Fetch documents
            const { data: docsData } = await supabase
                .from('client_documents')
                .select('*')
                .eq('client_id', params.id)
                .order('created_at', { ascending: false });
            setDocuments(docsData || []);

            // Fetch assets
            const { data: assetsData } = await supabase
                .from('brand_assets')
                .select('*')
                .eq('client_id', params.id)
                .order('created_at', { ascending: false });
            setAssets(assetsData || []);

            // Fetch projects
            const { data: projectsData } = await supabase
                .from('projects')
                .select('*')
                .eq('client_id', params.id)
                .order('created_at', { ascending: false });
            setProjects(projectsData || []);

        } catch (err: any) {
            setError(err.message || 'Erro ao carregar cliente');
        } finally {
            setLoading(false);
        }
    };

    createEffect(() => {
        if (params.id) {
            fetchClient();
        }
    });

    const handleDocumentUpload = async (files: UploadedFile[]) => {
        for (const file of files) {
            await supabase.from('client_documents').insert({
                client_id: params.id,
                name: file.name,
                file_path: file.path,
                file_type: file.type,
                file_size: file.size,
                uploaded_by: user()?.id,
            });
        }
        // Refresh documents
        const { data } = await supabase
            .from('client_documents')
            .select('*')
            .eq('client_id', params.id)
            .order('created_at', { ascending: false });
        setDocuments(data || []);
    };

    const handleAssetUpload = async (files: UploadedFile[]) => {
        for (const file of files) {
            await supabase.from('brand_assets').insert({
                client_id: params.id,
                name: file.name,
                file_path: file.path,
                file_type: file.type,
                file_size: file.size,
                category: getCategoryFromType(file.type),
                uploaded_by: user()?.id,
            });
        }
        // Refresh assets
        const { data } = await supabase
            .from('brand_assets')
            .select('*')
            .eq('client_id', params.id)
            .order('created_at', { ascending: false });
        setAssets(data || []);
    };

    const getCategoryFromType = (mimeType: string): string => {
        if (mimeType.startsWith('image/')) return 'photo';
        if (mimeType.includes('font')) return 'font';
        if (mimeType === 'application/pdf') return 'other';
        return 'other';
    };

    const handleDeleteDocument = async (doc: ClientDocument) => {
        if (!confirm(`Excluir "${doc.name}"?`)) return;

        await remove('client-documents', doc.file_path);
        await supabase.from('client_documents').delete().eq('id', doc.id);
        setDocuments(prev => prev.filter(d => d.id !== doc.id));
    };

    const handleDeleteAsset = async (asset: BrandAsset) => {
        if (!confirm(`Excluir "${asset.name}"?`)) return;

        await remove('brand-assets', asset.file_path);
        await supabase.from('brand_assets').delete().eq('id', asset.id);
        setAssets(prev => prev.filter(a => a.id !== asset.id));
    };

    const handleDownload = async (bucket: string, path: string, filename: string) => {
        const url = await getSignedUrl(bucket, path);
        if (url) {
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
        }
    };

    const formatFileSize = (bytes: number | null): string => {
        if (!bytes) return '—';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const isImageType = (mimeType: string | null): boolean => {
        return mimeType?.startsWith('image/') || false;
    };

    return (
        <AppLayout>
            <Show
                when={!loading()}
                fallback={
                    <div class="loading-container">
                        <div class="spinner spinner-lg" />
                    </div>
                }
            >
                <Show when={error()}>
                    <div class="alert alert-error">{error()}</div>
                </Show>

                <Show when={client()}>
                    {(c) => (
                        <>
                            {/* Header */}
                            <div style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-start", "margin-bottom": "var(--spacing-6)" }}>
                                <div style={{ display: "flex", "align-items": "center", gap: "var(--spacing-4)" }}>
                                    <div
                                        class="avatar avatar-lg"
                                        style={{ width: "64px", height: "64px", "font-size": "var(--font-size-2xl)" }}
                                    >
                                        {c().name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 class="page-title" style={{ "margin-bottom": "var(--spacing-1)" }}>{c().name}</h2>
                                        <Show when={c().trading_name}>
                                            <p style={{ color: "var(--color-neutral-500)", "font-size": "var(--font-size-sm)" }}>
                                                {c().trading_name}
                                            </p>
                                        </Show>
                                    </div>
                                </div>
                                <Button variant="secondary" onClick={() => window.location.href = `/clients/${params.id}/edit`}>
                                    Editar
                                </Button>
                            </div>

                            {/* Tabs */}
                            <div class="tabs">
                                <button
                                    class="tab"
                                    classList={{ active: activeTab() === 'info' }}
                                    onClick={() => setActiveTab('info')}
                                >
                                    Informações
                                </button>
                                <button
                                    class="tab"
                                    classList={{ active: activeTab() === 'documents' }}
                                    onClick={() => setActiveTab('documents')}
                                >
                                    Documentos ({documents().length})
                                </button>
                                <button
                                    class="tab"
                                    classList={{ active: activeTab() === 'assets' }}
                                    onClick={() => setActiveTab('assets')}
                                >
                                    Assets ({assets().length})
                                </button>
                                <button
                                    class="tab"
                                    classList={{ active: activeTab() === 'projects' }}
                                    onClick={() => setActiveTab('projects')}
                                >
                                    Projetos ({projects().length})
                                </button>
                            </div>

                            {/* Tab: Info */}
                            <Show when={activeTab() === 'info'}>
                                <div class="card">
                                    <div class="card-body">
                                        <div style={{ display: "grid", "grid-template-columns": "repeat(2, 1fr)", gap: "var(--spacing-6)" }}>
                                            <div>
                                                <div style={{ "font-size": "var(--font-size-xs)", color: "var(--color-neutral-500)", "margin-bottom": "var(--spacing-1)" }}>
                                                    Email
                                                </div>
                                                <div style={{ "font-weight": "500" }}>{c().email || '—'}</div>
                                            </div>
                                            <div>
                                                <div style={{ "font-size": "var(--font-size-xs)", color: "var(--color-neutral-500)", "margin-bottom": "var(--spacing-1)" }}>
                                                    Telefone
                                                </div>
                                                <div style={{ "font-weight": "500" }}>{c().phone || '—'}</div>
                                            </div>
                                            <div>
                                                <div style={{ "font-size": "var(--font-size-xs)", color: "var(--color-neutral-500)", "margin-bottom": "var(--spacing-1)" }}>
                                                    CNPJ/CPF
                                                </div>
                                                <div style={{ "font-weight": "500" }}>{c().document_number || '—'}</div>
                                            </div>
                                            <div>
                                                <div style={{ "font-size": "var(--font-size-xs)", color: "var(--color-neutral-500)", "margin-bottom": "var(--spacing-1)" }}>
                                                    Cadastrado em
                                                </div>
                                                <div style={{ "font-weight": "500" }}>
                                                    {new Date(c().created_at).toLocaleDateString('pt-BR')}
                                                </div>
                                            </div>
                                        </div>
                                        <Show when={c().notes}>
                                            <div style={{ "margin-top": "var(--spacing-6)" }}>
                                                <div style={{ "font-size": "var(--font-size-xs)", color: "var(--color-neutral-500)", "margin-bottom": "var(--spacing-1)" }}>
                                                    Observações
                                                </div>
                                                <div style={{ color: "var(--color-neutral-600)", "white-space": "pre-wrap" }}>
                                                    {c().notes}
                                                </div>
                                            </div>
                                        </Show>
                                    </div>
                                </div>
                            </Show>

                            {/* Tab: Documents */}
                            <Show when={activeTab() === 'documents'}>
                                <FileUpload
                                    bucket="client-documents"
                                    path={`clients/${params.id}`}
                                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                    multiple
                                    maxSize={10}
                                    onUpload={handleDocumentUpload}
                                />

                                <Show when={documents().length > 0}>
                                    <div class="document-list" style={{ "margin-top": "var(--spacing-6)" }}>
                                        <For each={documents()}>
                                            {(doc) => (
                                                <div class="document-item">
                                                    <div class="document-item-icon">
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                            <polyline points="14 2 14 8 20 8" />
                                                        </svg>
                                                    </div>
                                                    <div class="document-item-info">
                                                        <div class="document-item-name">{doc.name}</div>
                                                        <div class="document-item-meta">
                                                            {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                                                        </div>
                                                    </div>
                                                    <div class="document-item-actions">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDownload('client-documents', doc.file_path, doc.name)}
                                                            icon={<i class="ci-Download"></i>}
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteDocument(doc)}
                                                            icon={<i class="ci-Trash_Empty" style={{ color: "var(--color-error-500)" }}></i>}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </For>
                                    </div>
                                </Show>
                            </Show>

                            {/* Tab: Assets */}
                            <Show when={activeTab() === 'assets'}>
                                <FileUpload
                                    bucket="brand-assets"
                                    path={`clients/${params.id}`}
                                    accept=".png,.jpg,.jpeg,.svg,.gif,.webp,.pdf,.ttf,.otf,.woff,.woff2,.zip"
                                    multiple
                                    maxSize={50}
                                    onUpload={handleAssetUpload}
                                />

                                <Show when={assets().length > 0}>
                                    <div class="file-grid" style={{ "margin-top": "var(--spacing-6)" }}>
                                        <For each={assets()}>
                                            {(asset) => (
                                                <div class="file-grid-item">
                                                    <div class="file-grid-item-preview">
                                                        <Show
                                                            when={isImageType(asset.file_type)}
                                                            fallback={
                                                                <svg class="file-grid-item-preview-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                                    <polyline points="14 2 14 8 20 8" />
                                                                </svg>
                                                            }
                                                        >
                                                            <img
                                                                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/brand-assets/${asset.file_path}`}
                                                                alt={asset.name}
                                                            />
                                                        </Show>
                                                    </div>
                                                    <div class="file-grid-item-actions">
                                                        <button
                                                            class="file-grid-item-action"
                                                            onClick={() => handleDownload('brand-assets', asset.file_path, asset.name)}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                <polyline points="7 10 12 15 17 10" />
                                                                <line x1="12" y1="15" x2="12" y2="3" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            class="file-grid-item-action file-grid-item-action-danger"
                                                            onClick={() => handleDeleteAsset(asset)}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                <polyline points="3 6 5 6 21 6" />
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <div class="file-grid-item-info">
                                                        <div class="file-grid-item-name">{asset.name}</div>
                                                        <div class="file-grid-item-meta">
                                                            {formatFileSize(asset.file_size)}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </For>
                                    </div>
                                </Show>
                            </Show>

                            {/* Tab: Projects */}
                            <Show when={activeTab() === 'projects'}>
                                <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "var(--spacing-4)" }}>
                                    <h3 style={{ "font-weight": "600" }}>Projetos deste cliente</h3>
                                    <Button variant="primary" size="sm" onClick={() => window.location.href = `/projects/new?client=${params.id}`} icon={<i class="ci-Add"></i>}>
                                        Novo Projeto
                                    </Button>
                                </div>

                                <Show
                                    when={projects().length > 0}
                                    fallback={
                                        <div class="card">
                                            <div class="empty-state">
                                                <p class="empty-state-title">Nenhum projeto</p>
                                                <p class="empty-state-description">Este cliente ainda não possui projetos.</p>
                                            </div>
                                        </div>
                                    }
                                >
                                    <div style={{ display: "grid", gap: "var(--spacing-3)" }}>
                                        <For each={projects()}>
                                            {(project) => (
                                                <A href={`/projects/${project.id}`} class="card" style={{ "text-decoration": "none" }}>
                                                    <div class="card-body" style={{ padding: "var(--spacing-4)" }}>
                                                        <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
                                                            <div>
                                                                <div style={{ "font-weight": "500", color: "var(--color-neutral-900)" }}>
                                                                    {project.name}
                                                                </div>
                                                                <div style={{ "font-size": "var(--font-size-xs)", color: "var(--color-neutral-500)" }}>
                                                                    {new Date(project.created_at).toLocaleDateString('pt-BR')}
                                                                </div>
                                                            </div>
                                                            <span class={`badge badge-${project.status === 'active' ? 'success' : 'neutral'}`}>
                                                                {project.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </A>
                                            )}
                                        </For>
                                    </div>
                                </Show>
                            </Show>
                        </>
                    )}
                </Show>
            </Show>
        </AppLayout>
    );
};
