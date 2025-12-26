-- =============================================================================
-- MODULE: Módulos Funcionais (Timesheet, Finance, Categorias)
-- Version: 1.0.0
-- Dependencies: 001_core.sql, 002_crm.sql
-- =============================================================================

-- =============================================================================
-- 1. TYPES/ENUMS
-- =============================================================================
DO $$ BEGIN
    CREATE TYPE financial_type AS ENUM ('income', 'expense');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE financial_status AS ENUM ('pending', 'paid', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE expense_category AS ENUM ('operational', 'personnel', 'software', 'marketing', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 2. TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TIME_CATEGORIES (Categorias de tempo personalizadas)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.time_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📋',
    color TEXT DEFAULT '#6366f1',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- TIME_ENTRIES (Apontamento de horas com bio-tracking)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    
    -- Atividade
    activity_name TEXT NOT NULL,
    description TEXT,
    categoria TEXT NOT NULL DEFAULT 'Outros',
    
    -- Tempo
    date DATE NOT NULL,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 0,
    
    -- Bio-tracking (nomes em português para compatibilidade)
    energia INTEGER CHECK (energia >= 1 AND energia <= 3),      -- 1=Baixa, 2=Média, 3=Alta
    satisfacao INTEGER CHECK (satisfacao >= 1 AND satisfacao <= 3), -- 1=Negativo, 2=Neutro, 3=Positivo
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- FINANCIAL_ENTRIES (Lançamentos financeiros)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type financial_type NOT NULL,
    category expense_category DEFAULT 'other',
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'BRL',
    date DATE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    invoice_number TEXT,
    status financial_status DEFAULT 'pending',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 3. INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_time_categories_user_id ON public.time_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON public.time_entries(date);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON public.time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_financial_entries_type ON public.financial_entries(type);
CREATE INDEX IF NOT EXISTS idx_financial_entries_date ON public.financial_entries(date);
CREATE INDEX IF NOT EXISTS idx_financial_entries_client_id ON public.financial_entries(client_id);

-- =============================================================================
-- 4. RLS POLICIES
-- =============================================================================
ALTER TABLE public.time_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;

-- Time Categories
DROP POLICY IF EXISTS "time_categories_select" ON public.time_categories;
CREATE POLICY "time_categories_select" ON public.time_categories FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR is_default = true);

DROP POLICY IF EXISTS "time_categories_insert" ON public.time_categories;
CREATE POLICY "time_categories_insert" ON public.time_categories FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "time_categories_update" ON public.time_categories;
CREATE POLICY "time_categories_update" ON public.time_categories FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "time_categories_delete" ON public.time_categories;
CREATE POLICY "time_categories_delete" ON public.time_categories FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Time Entries
DROP POLICY IF EXISTS "time_entries_select" ON public.time_entries;
CREATE POLICY "time_entries_select" ON public.time_entries FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "time_entries_insert" ON public.time_entries;
CREATE POLICY "time_entries_insert" ON public.time_entries FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "time_entries_update" ON public.time_entries;
CREATE POLICY "time_entries_update" ON public.time_entries FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "time_entries_delete" ON public.time_entries;
CREATE POLICY "time_entries_delete" ON public.time_entries FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Financial Entries
DROP POLICY IF EXISTS "financial_entries_all" ON public.financial_entries;
CREATE POLICY "financial_entries_all" ON public.financial_entries FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- =============================================================================
-- 5. TRIGGERS
-- =============================================================================
DROP TRIGGER IF EXISTS update_time_entries_updated_at ON public.time_entries;
CREATE TRIGGER update_time_entries_updated_at
    BEFORE UPDATE ON public.time_entries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================================================
-- 6. SEED DATA
-- =============================================================================
INSERT INTO public.time_categories (name, icon, color, is_default) VALUES
    ('Design', '🎨', '#8b5cf6', true),
    ('Desenvolvimento', '💻', '#3b82f6', true),
    ('Reunião', '📞', '#10b981', true),
    ('Barman', '🍸', '#f59e0b', true),
    ('Sono', '😴', '#6366f1', true),
    ('Outros', '📋', '#6b7280', true)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- END OF MODULE
-- =============================================================================
