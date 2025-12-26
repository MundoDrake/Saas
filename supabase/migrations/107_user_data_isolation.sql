-- =============================================================================
-- MIGRATION: User Data Isolation (RLS Update)
-- Purpose: Each user can only see their own data
-- =============================================================================

-- =============================================================================
-- 1. Add created_by column to tables that don't have it
-- =============================================================================

-- Clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- =============================================================================
-- 2. Update RLS Policies - CLIENTS
-- =============================================================================
DROP POLICY IF EXISTS "clients_all" ON public.clients;
DROP POLICY IF EXISTS "clients_select" ON public.clients;
DROP POLICY IF EXISTS "clients_insert" ON public.clients;
DROP POLICY IF EXISTS "clients_update" ON public.clients;
DROP POLICY IF EXISTS "clients_delete" ON public.clients;

CREATE POLICY "clients_select" ON public.clients FOR SELECT TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "clients_insert" ON public.clients FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "clients_update" ON public.clients FOR UPDATE TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "clients_delete" ON public.clients FOR DELETE TO authenticated
    USING (created_by = auth.uid());

-- =============================================================================
-- 3. Update RLS Policies - PROJECTS
-- =============================================================================
DROP POLICY IF EXISTS "projects_all" ON public.projects;
DROP POLICY IF EXISTS "projects_select" ON public.projects;
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_update" ON public.projects;
DROP POLICY IF EXISTS "projects_delete" ON public.projects;

CREATE POLICY "projects_select" ON public.projects FOR SELECT TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "projects_insert" ON public.projects FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "projects_update" ON public.projects FOR UPDATE TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "projects_delete" ON public.projects FOR DELETE TO authenticated
    USING (created_by = auth.uid());

-- =============================================================================
-- 4. Update RLS Policies - TASKS (via project ownership)
-- =============================================================================
DROP POLICY IF EXISTS "tasks_all" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;

CREATE POLICY "tasks_select" ON public.tasks FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.created_by = auth.uid()
    ));

CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.created_by = auth.uid()
    ));

CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.created_by = auth.uid()
    ));

CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.created_by = auth.uid()
    ));

-- =============================================================================
-- 5. TIME_ENTRIES - Use user_id
-- =============================================================================
DROP POLICY IF EXISTS "time_entries_all" ON public.time_entries;
DROP POLICY IF EXISTS "time_entries_select" ON public.time_entries;
DROP POLICY IF EXISTS "time_entries_insert" ON public.time_entries;
DROP POLICY IF EXISTS "time_entries_update" ON public.time_entries;
DROP POLICY IF EXISTS "time_entries_delete" ON public.time_entries;

CREATE POLICY "time_entries_select" ON public.time_entries FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "time_entries_insert" ON public.time_entries FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "time_entries_update" ON public.time_entries FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "time_entries_delete" ON public.time_entries FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- =============================================================================
-- 6. FINANCIAL_ENTRIES - Use created_by
-- =============================================================================
DROP POLICY IF EXISTS "financial_entries_all" ON public.financial_entries;
DROP POLICY IF EXISTS "financial_entries_select" ON public.financial_entries;
DROP POLICY IF EXISTS "financial_entries_insert" ON public.financial_entries;
DROP POLICY IF EXISTS "financial_entries_update" ON public.financial_entries;
DROP POLICY IF EXISTS "financial_entries_delete" ON public.financial_entries;

CREATE POLICY "financial_entries_select" ON public.financial_entries FOR SELECT TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "financial_entries_insert" ON public.financial_entries FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "financial_entries_update" ON public.financial_entries FOR UPDATE TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "financial_entries_delete" ON public.financial_entries FOR DELETE TO authenticated
    USING (created_by = auth.uid());

-- =============================================================================
-- 6. PROJECT_TEMPLATES - Use created_by (Skip if table doesn't exist)
-- =============================================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_templates') THEN
        DROP POLICY IF EXISTS "project_templates_all" ON public.project_templates;
        DROP POLICY IF EXISTS "project_templates_select" ON public.project_templates;
        DROP POLICY IF EXISTS "project_templates_insert" ON public.project_templates;
        DROP POLICY IF EXISTS "project_templates_update" ON public.project_templates;
        DROP POLICY IF EXISTS "project_templates_delete" ON public.project_templates;
        CREATE POLICY "project_templates_select" ON public.project_templates FOR SELECT TO authenticated
            USING (created_by = auth.uid());
        CREATE POLICY "project_templates_insert" ON public.project_templates FOR INSERT TO authenticated
            WITH CHECK (created_by = auth.uid());
        CREATE POLICY "project_templates_update" ON public.project_templates FOR UPDATE TO authenticated
            USING (created_by = auth.uid());
        CREATE POLICY "project_templates_delete" ON public.project_templates FOR DELETE TO authenticated
            USING (created_by = auth.uid());
    END IF;
END $$;

-- =============================================================================
-- 7. TEMPLATE_TASKS (via template ownership) - Skip if table doesn't exist
-- =============================================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'template_tasks') THEN
        DROP POLICY IF EXISTS "template_tasks_all" ON public.template_tasks;
        DROP POLICY IF EXISTS "template_tasks_select" ON public.template_tasks;
        DROP POLICY IF EXISTS "template_tasks_insert" ON public.template_tasks;
        DROP POLICY IF EXISTS "template_tasks_update" ON public.template_tasks;
        DROP POLICY IF EXISTS "template_tasks_delete" ON public.template_tasks;
        CREATE POLICY "template_tasks_select" ON public.template_tasks FOR SELECT TO authenticated
            USING (EXISTS (
                SELECT 1 FROM public.project_templates pt WHERE pt.id = template_id AND pt.created_by = auth.uid()
            ));
        CREATE POLICY "template_tasks_insert" ON public.template_tasks FOR INSERT TO authenticated
            WITH CHECK (EXISTS (
                SELECT 1 FROM public.project_templates pt WHERE pt.id = template_id AND pt.created_by = auth.uid()
            ));
        CREATE POLICY "template_tasks_update" ON public.template_tasks FOR UPDATE TO authenticated
            USING (EXISTS (
                SELECT 1 FROM public.project_templates pt WHERE pt.id = template_id AND pt.created_by = auth.uid()
            ));
        CREATE POLICY "template_tasks_delete" ON public.template_tasks FOR DELETE TO authenticated
            USING (EXISTS (
                SELECT 1 FROM public.project_templates pt WHERE pt.id = template_id AND pt.created_by = auth.uid()
            ));
    END IF;
END $$;

-- =============================================================================
-- 8. BRAND STRATEGIES (via client ownership) - Skip if table doesn't exist
-- =============================================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brand_strategies') THEN
        DROP POLICY IF EXISTS "brand_strategies_all" ON public.brand_strategies;
        DROP POLICY IF EXISTS "brand_strategies_select" ON public.brand_strategies;
        DROP POLICY IF EXISTS "brand_strategies_insert" ON public.brand_strategies;
        DROP POLICY IF EXISTS "brand_strategies_update" ON public.brand_strategies;
        DROP POLICY IF EXISTS "brand_strategies_delete" ON public.brand_strategies;
        CREATE POLICY "brand_strategies_select" ON public.brand_strategies FOR SELECT TO authenticated
            USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.created_by = auth.uid()));
        CREATE POLICY "brand_strategies_insert" ON public.brand_strategies FOR INSERT TO authenticated
            WITH CHECK (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.created_by = auth.uid()));
        CREATE POLICY "brand_strategies_update" ON public.brand_strategies FOR UPDATE TO authenticated
            USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.created_by = auth.uid()));
        CREATE POLICY "brand_strategies_delete" ON public.brand_strategies FOR DELETE TO authenticated
            USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.created_by = auth.uid()));
    END IF;
END $$;

-- =============================================================================
-- 9. BRAND COLORS (via client ownership) - Skip if table doesn't exist
-- =============================================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brand_colors') THEN
        DROP POLICY IF EXISTS "brand_colors_all" ON public.brand_colors;
        DROP POLICY IF EXISTS "brand_colors_select" ON public.brand_colors;
        DROP POLICY IF EXISTS "brand_colors_insert" ON public.brand_colors;
        DROP POLICY IF EXISTS "brand_colors_update" ON public.brand_colors;
        DROP POLICY IF EXISTS "brand_colors_delete" ON public.brand_colors;
        CREATE POLICY "brand_colors_select" ON public.brand_colors FOR SELECT TO authenticated
            USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.created_by = auth.uid()));
        CREATE POLICY "brand_colors_insert" ON public.brand_colors FOR INSERT TO authenticated
            WITH CHECK (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.created_by = auth.uid()));
        CREATE POLICY "brand_colors_update" ON public.brand_colors FOR UPDATE TO authenticated
            USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.created_by = auth.uid()));
        CREATE POLICY "brand_colors_delete" ON public.brand_colors FOR DELETE TO authenticated
            USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.created_by = auth.uid()));
    END IF;
END $$;

-- =============================================================================
-- 10. BRAND FONTS (via client ownership) - Skip if table doesn't exist
-- =============================================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brand_fonts') THEN
        DROP POLICY IF EXISTS "brand_fonts_all" ON public.brand_fonts;
        DROP POLICY IF EXISTS "brand_fonts_select" ON public.brand_fonts;
        DROP POLICY IF EXISTS "brand_fonts_insert" ON public.brand_fonts;
        DROP POLICY IF EXISTS "brand_fonts_update" ON public.brand_fonts;
        DROP POLICY IF EXISTS "brand_fonts_delete" ON public.brand_fonts;
        CREATE POLICY "brand_fonts_select" ON public.brand_fonts FOR SELECT TO authenticated
            USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.created_by = auth.uid()));
        CREATE POLICY "brand_fonts_insert" ON public.brand_fonts FOR INSERT TO authenticated
            WITH CHECK (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.created_by = auth.uid()));
        CREATE POLICY "brand_fonts_update" ON public.brand_fonts FOR UPDATE TO authenticated
            USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.created_by = auth.uid()));
        CREATE POLICY "brand_fonts_delete" ON public.brand_fonts FOR DELETE TO authenticated
            USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.created_by = auth.uid()));
    END IF;
END $$;

-- =============================================================================
-- 11. BRAND VOICE (via client ownership) - Skip if table doesn't exist
-- =============================================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brand_voice') THEN
        DROP POLICY IF EXISTS "brand_voice_all" ON public.brand_voice;
        DROP POLICY IF EXISTS "brand_voice_select" ON public.brand_voice;
        DROP POLICY IF EXISTS "brand_voice_insert" ON public.brand_voice;
        DROP POLICY IF EXISTS "brand_voice_update" ON public.brand_voice;
        DROP POLICY IF EXISTS "brand_voice_delete" ON public.brand_voice;
        CREATE POLICY "brand_voice_select" ON public.brand_voice FOR SELECT TO authenticated
            USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.created_by = auth.uid()));
        CREATE POLICY "brand_voice_insert" ON public.brand_voice FOR INSERT TO authenticated
            WITH CHECK (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.created_by = auth.uid()));
        CREATE POLICY "brand_voice_update" ON public.brand_voice FOR UPDATE TO authenticated
            USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.created_by = auth.uid()));
        CREATE POLICY "brand_voice_delete" ON public.brand_voice FOR DELETE TO authenticated
            USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.created_by = auth.uid()));
    END IF;
END $$;

-- =============================================================================
-- 12. BRAND GUIDELINES (via client ownership) - Skip if table doesn't exist
-- =============================================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brand_guidelines') THEN
        DROP POLICY IF EXISTS "brand_guidelines_all" ON public.brand_guidelines;
        DROP POLICY IF EXISTS "brand_guidelines_select" ON public.brand_guidelines;
        DROP POLICY IF EXISTS "brand_guidelines_insert" ON public.brand_guidelines;
        DROP POLICY IF EXISTS "brand_guidelines_update" ON public.brand_guidelines;
        DROP POLICY IF EXISTS "brand_guidelines_delete" ON public.brand_guidelines;
        CREATE POLICY "brand_guidelines_select" ON public.brand_guidelines FOR SELECT TO authenticated
            USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.created_by = auth.uid()));
        CREATE POLICY "brand_guidelines_insert" ON public.brand_guidelines FOR INSERT TO authenticated
            WITH CHECK (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.created_by = auth.uid()));
        CREATE POLICY "brand_guidelines_update" ON public.brand_guidelines FOR UPDATE TO authenticated
            USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.created_by = auth.uid()));
        CREATE POLICY "brand_guidelines_delete" ON public.brand_guidelines FOR DELETE TO authenticated
            USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.created_by = auth.uid()));
    END IF;
END $$;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
