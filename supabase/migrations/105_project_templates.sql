-- =============================================================================
-- MODULE: Project Templates (Templates de Projeto)
-- Version: 1.0.0
-- Dependencies: 002_crm.sql (project_status, task_status, task_priority types)
-- =============================================================================

-- Criar tabela project_templates
CREATE TABLE IF NOT EXISTS public.project_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    default_status project_status DEFAULT 'draft',
    default_days INTEGER DEFAULT 30,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela template_tasks
CREATE TABLE IF NOT EXISTS public.template_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.project_templates(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    default_status task_status DEFAULT 'todo',
    priority task_priority DEFAULT 'medium',
    estimated_hours DECIMAL(5, 2) DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    dependencies UUID[],
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_project_templates_created_by ON public.project_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_template_tasks_template_id ON public.template_tasks(template_id);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_templates_all" ON public.project_templates;
CREATE POLICY "project_templates_all" ON public.project_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "template_tasks_all" ON public.template_tasks;
CREATE POLICY "template_tasks_all" ON public.template_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================================================
-- TRIGGERS
-- =============================================================================
DROP TRIGGER IF EXISTS update_project_templates_updated_at ON public.project_templates;
CREATE TRIGGER update_project_templates_updated_at
    BEFORE UPDATE ON public.project_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================================================
-- END OF MODULE
-- =============================================================================
