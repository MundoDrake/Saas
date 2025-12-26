-- =============================================================================
-- MODULE: Brand Fonts (Tipografia da Marca)
-- Version: 1.0.0
-- Dependencies: 001_core.sql, 002_crm.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.brand_fonts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    family TEXT,
    weight TEXT,
    style TEXT,
    usage TEXT,
    file_url TEXT,
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_fonts_client_id ON public.brand_fonts(client_id);

ALTER TABLE public.brand_fonts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brand_fonts_all" ON public.brand_fonts;
CREATE POLICY "brand_fonts_all" ON public.brand_fonts FOR ALL TO authenticated USING (true) WITH CHECK (true);
