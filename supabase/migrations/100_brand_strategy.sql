-- =============================================================================
-- MODULE: Brand Strategy (Estratégia de Marca)
-- Version: 1.0.0
-- Dependencies: 001_core.sql, 002_crm.sql
-- =============================================================================

-- =============================================================================
-- 1. TABLES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.brand_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    
    -- Missão, Visão, Valores
    mission TEXT,
    vision TEXT,
    values TEXT[],
    
    -- Posicionamento
    positioning_statement TEXT,
    target_audience TEXT,
    competitive_advantage TEXT,
    
    -- Personalidade
    personality_traits TEXT[],
    brand_archetype TEXT,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 2. INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_brand_strategies_client_id ON public.brand_strategies(client_id);

-- =============================================================================
-- 3. RLS POLICIES
-- =============================================================================
ALTER TABLE public.brand_strategies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brand_strategies_all" ON public.brand_strategies;
CREATE POLICY "brand_strategies_all" ON public.brand_strategies FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================================================
-- 4. TRIGGERS
-- =============================================================================
DROP TRIGGER IF EXISTS update_brand_strategies_updated_at ON public.brand_strategies;
CREATE TRIGGER update_brand_strategies_updated_at
    BEFORE UPDATE ON public.brand_strategies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================================================
-- END OF MODULE
-- =============================================================================
