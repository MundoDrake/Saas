import { Component, createSignal, Show, For } from 'solid-js';
import { useStorage } from '../hooks/useStorage';

interface FileUploadProps {
    bucket: 'client-documents' | 'brand-assets' | 'avatars';
    path: string;
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // in MB
    onUpload: (files: UploadedFile[]) => void;
}

export interface UploadedFile {
    name: string;
    path: string;
    url: string;
    type: string;
    size: number;
}

export const FileUpload: Component<FileUploadProps> = (props) => {
    const { upload, uploading, error } = useStorage();
    const [dragOver, setDragOver] = createSignal(false);
    const [uploadedFiles, setUploadedFiles] = createSignal<UploadedFile[]>([]);
    const [localError, setLocalError] = createSignal<string | null>(null);

    const maxSize = () => (props.maxSize || 10) * 1024 * 1024; // Default 10MB

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setLocalError(null);

        const filesToUpload = Array.from(files);

        // Validate file sizes
        for (const file of filesToUpload) {
            if (file.size > maxSize()) {
                setLocalError(`Arquivo "${file.name}" excede o limite de ${props.maxSize || 10}MB`);
                return;
            }
        }

        const uploaded: UploadedFile[] = [];

        for (const file of filesToUpload) {
            const result = await upload({
                bucket: props.bucket,
                path: props.path,
                file,
            });

            if (result) {
                uploaded.push({
                    name: file.name,
                    path: result.path,
                    url: result.url,
                    type: file.type,
                    size: file.size,
                });
            }
        }

        if (uploaded.length > 0) {
            setUploadedFiles(prev => [...prev, ...uploaded]);
            props.onUpload(uploaded);
        }
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer?.files || null);
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleInputChange = (e: Event) => {
        const input = e.target as HTMLInputElement;
        handleFiles(input.files);
        input.value = ''; // Reset input
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div class="file-upload">
            <div
                class="file-upload-dropzone"
                classList={{
                    'file-upload-dropzone-active': dragOver(),
                    'file-upload-dropzone-uploading': uploading(),
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <Show when={uploading()} fallback={
                    <>
                        <svg class="file-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <p class="file-upload-text">
                            Arraste arquivos ou <label class="file-upload-link">
                                clique para selecionar
                                <input
                                    type="file"
                                    accept={props.accept}
                                    multiple={props.multiple}
                                    onChange={handleInputChange}
                                    class="sr-only"
                                />
                            </label>
                        </p>
                        <p class="file-upload-hint">
                            Máximo {props.maxSize || 10}MB por arquivo
                        </p>
                    </>
                }>
                    <div class="spinner spinner-lg" />
                    <p class="file-upload-text">Enviando...</p>
                </Show>
            </div>

            <Show when={localError() || error()}>
                <div class="alert alert-error" style={{ "margin-top": "var(--spacing-3)" }}>
                    {localError() || error()}
                </div>
            </Show>

            <Show when={uploadedFiles().length > 0}>
                <div class="file-upload-list">
                    <For each={uploadedFiles()}>
                        {(file) => (
                            <div class="file-upload-item">
                                <div class="file-upload-item-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                </div>
                                <div class="file-upload-item-info">
                                    <div class="file-upload-item-name">{file.name}</div>
                                    <div class="file-upload-item-size">{formatFileSize(file.size)}</div>
                                </div>
                                <svg class="file-upload-item-success" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                        )}
                    </For>
                </div>
            </Show>
        </div>
    );
};
