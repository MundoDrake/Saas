-- =============================================================================
-- MODULE: Brand Colors (Cores da Marca)
-- Version: 1.0.0
-- Dependencies: 001_core.sql, 002_crm.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.brand_colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    hex_code TEXT NOT NULL,
    rgb TEXT,
    cmyk TEXT,
    pantone TEXT,
    usage TEXT,
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_colors_client_id ON public.brand_colors(client_id);

ALTER TABLE public.brand_colors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brand_colors_all" ON public.brand_colors;
CREATE POLICY "brand_colors_all" ON public.brand_colors FOR ALL TO authenticated USING (true) WITH CHECK (true);
