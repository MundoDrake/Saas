import { createSignal } from 'solid-js';
import { supabase } from '../lib/supabase';

interface UploadOptions {
    bucket: 'client-documents' | 'brand-assets' | 'avatars';
    path: string;
    file: File;
    onProgress?: (progress: number) => void;
}

interface UploadResult {
    path: string;
    url: string;
}

export function useStorage() {
    const [uploading, setUploading] = createSignal(false);
    const [progress, setProgress] = createSignal(0);
    const [error, setError] = createSignal<string | null>(null);

    const upload = async (options: UploadOptions): Promise<UploadResult | null> => {
        setUploading(true);
        setProgress(0);
        setError(null);

        try {
            const { bucket, path, file } = options;

            // Generate unique filename
            const ext = file.name.split('.').pop();
            const timestamp = Date.now();
            const uniquePath = `${path}/${timestamp}.${ext}`;

            // Upload file
            const { data, error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(uniquePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(data.path);

            setProgress(100);

            return {
                path: data.path,
                url: urlData.publicUrl,
            };
        } catch (err: any) {
            setError(err.message || 'Erro ao fazer upload');
            return null;
        } finally {
            setUploading(false);
        }
    };

    const remove = async (bucket: string, path: string): Promise<boolean> => {
        try {
            const { error: deleteError } = await supabase.storage
                .from(bucket)
                .remove([path]);

            if (deleteError) throw deleteError;
            return true;
        } catch (err: any) {
            setError(err.message || 'Erro ao excluir arquivo');
            return false;
        }
    };

    const getSignedUrl = async (bucket: string, path: string, expiresIn = 3600): Promise<string | null> => {
        try {
            const { data, error: signError } = await supabase.storage
                .from(bucket)
                .createSignedUrl(path, expiresIn);

            if (signError) throw signError;
            return data.signedUrl;
        } catch (err: any) {
            setError(err.message || 'Erro ao gerar URL');
            return null;
        }
    };

    return {
        upload,
        remove,
        getSignedUrl,
        uploading,
        progress,
        error,
    };
}
