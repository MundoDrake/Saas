-- =============================================================================
-- MODULE: CRM (Clientes, Projetos, Tarefas)
-- Version: 1.0.0
-- Dependencies: 001_core.sql
-- =============================================================================

-- =============================================================================
-- 1. TYPES/ENUMS
-- =============================================================================
DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE deadline_status AS ENUM ('pending', 'completed', 'overdue');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 2. TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CLIENTS (Clientes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    trading_name TEXT,
    document_number TEXT,
    email TEXT,
    phone TEXT,
    address JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- CLIENT_CONTACTS (Contatos de clientes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT,
    email TEXT,
    phone TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- PROJECTS (Projetos)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status project_status DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12, 2),
    cover_image TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- TASKS (Tarefas)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'backlog',
    priority task_priority DEFAULT 'medium',
    assignee_id UUID REFERENCES public.profiles(id),
    due_date DATE,
    estimated_hours DECIMAL(5, 2),
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- CLIENT_DEADLINES (Cronograma de entregas)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    status deadline_status DEFAULT 'pending',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 3. INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients(created_by);
CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON public.client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_client_deadlines_client_id ON public.client_deadlines(client_id);
CREATE INDEX IF NOT EXISTS idx_client_deadlines_due_date ON public.client_deadlines(due_date);

-- =============================================================================
-- 4. RLS POLICIES
-- =============================================================================
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_deadlines ENABLE ROW LEVEL SECURITY;

-- Clients
DROP POLICY IF EXISTS "clients_select" ON public.clients;
CREATE POLICY "clients_select" ON public.clients FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "clients_insert" ON public.clients;
CREATE POLICY "clients_insert" ON public.clients FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "clients_update" ON public.clients;
CREATE POLICY "clients_update" ON public.clients FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "clients_delete_admin" ON public.clients;
CREATE POLICY "clients_delete_admin" ON public.clients FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- Client Contacts
DROP POLICY IF EXISTS "client_contacts_all" ON public.client_contacts;
CREATE POLICY "client_contacts_all" ON public.client_contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Projects
DROP POLICY IF EXISTS "projects_all" ON public.projects;
CREATE POLICY "projects_all" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tasks
DROP POLICY IF EXISTS "tasks_all" ON public.tasks;
CREATE POLICY "tasks_all" ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Client Deadlines
DROP POLICY IF EXISTS "client_deadlines_all" ON public.client_deadlines;
CREATE POLICY "client_deadlines_all" ON public.client_deadlines FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================================================
-- 5. TRIGGERS
-- =============================================================================
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================================================
-- END OF MODULE
-- =============================================================================
