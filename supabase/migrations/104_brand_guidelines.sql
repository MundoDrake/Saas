-- =============================================================================
-- MODULE: Brand Guidelines (Manual da Marca)
-- Version: 1.0.0
-- Dependencies: 001_core.sql, 002_crm.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.brand_guidelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    
    -- Uso do logo
    logo_guidelines TEXT,
    logo_clear_space TEXT,
    logo_minimum_size TEXT,
    logo_incorrect_usage TEXT[],
    
    -- Aplicações
    stationery_guidelines TEXT,
    digital_guidelines TEXT,
    signage_guidelines TEXT,
    
    -- Arquivos
    primary_logo_url TEXT,
    secondary_logo_url TEXT,
    icon_url TEXT,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_guidelines_client_id ON public.brand_guidelines(client_id);

ALTER TABLE public.brand_guidelines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brand_guidelines_all" ON public.brand_guidelines;
CREATE POLICY "brand_guidelines_all" ON public.brand_guidelines FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_brand_guidelines_updated_at ON public.brand_guidelines;
CREATE TRIGGER update_brand_guidelines_updated_at
    BEFORE UPDATE ON public.brand_guidelines
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
