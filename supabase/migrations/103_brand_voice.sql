-- =============================================================================
-- MODULE: Brand Voice (Tom de Voz da Marca)
-- Version: 1.0.0
-- Dependencies: 001_core.sql, 002_crm.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.brand_voice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    
    -- Tom e estilo
    tone TEXT[],
    writing_style TEXT,
    vocabulary TEXT[],
    
    -- Mensagens
    tagline TEXT,
    brand_promise TEXT,
    key_messages TEXT[],
    
    -- Exemplos
    do_examples TEXT[],
    dont_examples TEXT[],
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_voice_client_id ON public.brand_voice(client_id);

ALTER TABLE public.brand_voice ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brand_voice_all" ON public.brand_voice;
CREATE POLICY "brand_voice_all" ON public.brand_voice FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_brand_voice_updated_at ON public.brand_voice;
CREATE TRIGGER update_brand_voice_updated_at
    BEFORE UPDATE ON public.brand_voice
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
