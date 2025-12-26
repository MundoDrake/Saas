-- =============================================================================
-- MODULE: Storage Buckets
-- Version: 1.0.0
-- Dependencies: None
-- =============================================================================
-- NOTA: Este script deve ser executado como um usuário com permissões de service_role
-- OU via Supabase Dashboard > Storage > New Bucket
-- =============================================================================

-- Criar bucket para assets gerais
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'assets',
    'assets',
    true,
    52428800, -- 50MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Criar bucket para uploads de clientes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'client-uploads',
    'client-uploads',
    false,
    104857600, -- 100MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf', 'application/zip']
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- STORAGE POLICIES
-- =============================================================================

-- Assets: público para leitura, autenticados para upload
DROP POLICY IF EXISTS "assets_select_public" ON storage.objects;
CREATE POLICY "assets_select_public" ON storage.objects
    FOR SELECT USING (bucket_id = 'assets');

DROP POLICY IF EXISTS "assets_insert_authenticated" ON storage.objects;
CREATE POLICY "assets_insert_authenticated" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'assets');

DROP POLICY IF EXISTS "assets_update_authenticated" ON storage.objects;
CREATE POLICY "assets_update_authenticated" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'assets');

DROP POLICY IF EXISTS "assets_delete_authenticated" ON storage.objects;
CREATE POLICY "assets_delete_authenticated" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'assets');

-- Client uploads: apenas autenticados
DROP POLICY IF EXISTS "client_uploads_select" ON storage.objects;
CREATE POLICY "client_uploads_select" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'client-uploads');

DROP POLICY IF EXISTS "client_uploads_insert" ON storage.objects;
CREATE POLICY "client_uploads_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'client-uploads');

DROP POLICY IF EXISTS "client_uploads_update" ON storage.objects;
CREATE POLICY "client_uploads_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'client-uploads');

DROP POLICY IF EXISTS "client_uploads_delete" ON storage.objects;
CREATE POLICY "client_uploads_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'client-uploads');

-- =============================================================================
-- END OF MODULE
-- =============================================================================
