import { Component, Show, For, createSignal, createEffect } from 'solid-js';
import { useParams } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import { ProjectLayout } from '../components/ProjectLayout';

interface BrandAsset {
    id: string;
    project_id: string;
    category: 'logo' | 'font' | 'palette' | 'icon' | 'photo' | 'other';
    name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    created_at: string;
}

type CategoryFilter = 'all' | 'logo' | 'icon' | 'photo' | 'font' | 'other';

const CATEGORIES: { id: CategoryFilter; label: string; icon: string }[] = [
    { id: 'all', label: 'Todos', icon: '📁' },
    { id: 'logo', label: 'Logos', icon: '🎨' },
    { id: 'icon', label: 'Ícones', icon: '⚡' },
    { id: 'photo', label: 'Fotos', icon: '📷' },
    { id: 'font', label: 'Fontes', icon: '🔤' },
    { id: 'other', label: 'Outros', icon: '📦' },
];

export const BrandAssetsPage: Component = () => {
    const params = useParams();

    const [assets, setAssets] = createSignal<BrandAsset[]>([]);
    const [loading, setLoading] = createSignal(true);
    const [uploading, setUploading] = createSignal(false);
    const [filter, setFilter] = createSignal<CategoryFilter>('all');
    const [dragging, setDragging] = createSignal(false);

    let fileInputRef: HTMLInputElement | undefined;

    // Load assets
    createEffect(async () => {
        try {
            const { data, error } = await supabase
                .from('brand_assets')
                .select('*')
                .eq('project_id', params.id)
                .order('created_at', { ascending: false });

            if (data) {
                setAssets(data);
            }
        } catch (error) {
            console.error('Error loading assets:', error);
        } finally {
            setLoading(false);
        }
    });

    const filteredAssets = () => {
        if (filter() === 'all') return assets();
        return assets().filter(a => a.category === filter());
    };

    const handleFileSelect = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setUploading(true);

        for (const file of Array.from(files)) {
            await uploadFile(file);
        }

        setUploading(false);
    };

    const uploadFile = async (file: File) => {
        try {
            const fileExt = file.name.split('.').pop()?.toLowerCase();
            const fileName = `${params.id}/${Date.now()}_${file.name}`;

            // Upload to storage
            const { error: uploadError } = await supabase.storage
                .from('brand-assets')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Determine category based on file type
            let category: BrandAsset['category'] = 'other';
            if (file.type.startsWith('image/')) {
                if (file.name.toLowerCase().includes('logo')) {
                    category = 'logo';
                } else if (file.name.toLowerCase().includes('icon')) {
                    category = 'icon';
                } else {
                    category = 'photo';
                }
            } else if (['ttf', 'otf', 'woff', 'woff2'].includes(fileExt || '')) {
                category = 'font';
            }

            // Save metadata
            const { data: assetData, error: dbError } = await supabase
                .from('brand_assets')
                .insert({
                    project_id: params.id,
                    category,
                    name: file.name,
                    file_path: fileName,
                    file_type: file.type,
                    file_size: file.size,
                })
                .select()
                .single();

            if (dbError) throw dbError;

            if (assetData) {
                setAssets(prev => [assetData, ...prev]);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };

    const deleteAsset = async (asset: BrandAsset) => {
        if (!confirm(`Excluir "${asset.name}"?`)) return;

        try {
            // Delete from storage
            await supabase.storage
                .from('brand-assets')
                .remove([asset.file_path]);

            // Delete metadata
            await supabase
                .from('brand_assets')
                .delete()
                .eq('id', asset.id);

            setAssets(prev => prev.filter(a => a.id !== asset.id));
        } catch (error) {
            console.error('Error deleting asset:', error);
        }
    };

    const getAssetUrl = (asset: BrandAsset) => {
        const { data } = supabase.storage
            .from('brand-assets')
            .getPublicUrl(asset.file_path);
        return data.publicUrl;
    };

    const downloadAsset = async (asset: BrandAsset) => {
        const { data, error } = await supabase.storage
            .from('brand-assets')
            .download(asset.file_path);

        if (data) {
            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = asset.name;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setDragging(false);
        handleFileSelect(e.dataTransfer?.files || null);
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => {
        setDragging(false);
    };

    return (
        <ProjectLayout>
            <div class="brand-assets-page">
                {/* Header */}
                <div class="assets-header">
                    <div>
                        <h1 class="brand-strategy-title">Assets da Marca</h1>
                        <p class="brand-strategy-description">
                            Gerencie logos, ícones, fotos e outros arquivos da identidade visual.
                        </p>
                    </div>
                </div>

                {/* Upload Zone */}
                <div
                    class="upload-zone"
                    classList={{ dragging: dragging() }}
                    onClick={() => fileInputRef?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,.svg,.pdf,.ttf,.otf,.woff,.woff2,.zip"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileSelect(e.currentTarget.files)}
                    />
                    <Show when={uploading()} fallback={
                        <>
                            <div class="upload-zone-icon">📤</div>
                            <p class="upload-zone-text">
                                <strong>Clique para fazer upload</strong> ou arraste arquivos aqui
                            </p>
                        </>
                    }>
                        <div class="spinner spinner-lg" />
                        <p class="upload-zone-text">Enviando arquivos...</p>
                    </Show>
                </div>

                {/* Filter Tabs */}
                <div class="strategy-tabs" style={{ 'margin-bottom': 'var(--spacing-6)' }}>
                    <For each={CATEGORIES}>
                        {(cat) => (
                            <button
                                class="strategy-tab"
                                classList={{ active: filter() === cat.id }}
                                onClick={() => setFilter(cat.id)}
                            >
                                {cat.icon} {cat.label}
                            </button>
                        )}
                    </For>
                </div>

                <Show when={!loading()} fallback={<div class="spinner spinner-lg" style={{ margin: '2rem auto' }} />}>
                    <Show when={filteredAssets().length > 0} fallback={
                        <div class="assets-empty">
                            <div class="assets-empty-icon">📂</div>
                            <p>Nenhum asset encontrado.</p>
                            <p style={{ 'font-size': 'var(--font-size-xs)' }}>
                                Faça upload de logos, ícones, fotos ou fontes.
                            </p>
                        </div>
                    }>
                        <div class="assets-grid">
                            <For each={filteredAssets()}>
                                {(asset) => (
                                    <div class="asset-card">
                                        <div class="asset-preview">
                                            <Show
                                                when={asset.file_type.startsWith('image/')}
                                                fallback={
                                                    <div class="asset-preview-icon">
                                                        {asset.category === 'font' ? '🔤' :
                                                            asset.category === 'logo' ? '🎨' :
                                                                asset.category === 'icon' ? '⚡' : '📦'}
                                                    </div>
                                                }
                                            >
                                                <img
                                                    src={getAssetUrl(asset)}
                                                    alt={asset.name}
                                                    loading="lazy"
                                                />
                                            </Show>
                                        </div>
                                        <div class="asset-info">
                                            <p class="asset-name">{asset.name}</p>
                                            <p class="asset-meta">{formatFileSize(asset.file_size)}</p>
                                        </div>
                                        <div class="asset-actions">
                                            <button
                                                class="asset-action-btn"
                                                onClick={() => downloadAsset(asset)}
                                                title="Download"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                            </button>
                                            <button
                                                class="asset-action-btn delete"
                                                onClick={() => deleteAsset(asset)}
                                                title="Excluir"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </For>
                        </div>
                    </Show>
                </Show>
            </div>
        </ProjectLayout>
    );
};
