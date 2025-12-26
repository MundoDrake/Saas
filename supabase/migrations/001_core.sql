-- =============================================================================
-- MODULE: Core (Autenticação e Perfis)
-- Version: 1.0.0
-- Dependencies: None
-- =============================================================================

-- =============================================================================
-- 1. TYPES/ENUMS
-- =============================================================================
-- Nenhum tipo personalizado neste módulo

-- =============================================================================
-- 2. TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ROLES (Papéis de usuário)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- PROFILES (Perfis de usuário)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    role_id UUID REFERENCES public.roles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 3. INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);

-- =============================================================================
-- 4. RLS POLICIES
-- =============================================================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Roles: visíveis para todos autenticados
DROP POLICY IF EXISTS "roles_select_authenticated" ON public.roles;
CREATE POLICY "roles_select_authenticated"
    ON public.roles FOR SELECT TO authenticated USING (true);

-- Profiles: todos podem ver
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
    ON public.profiles FOR SELECT TO authenticated USING (true);

-- Profiles: usuários podem atualizar próprio perfil
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Profiles: admins podem atualizar qualquer perfil
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin"
    ON public.profiles FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- =============================================================================
-- 5. FUNCTIONS & TRIGGERS
-- =============================================================================

-- Função: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Função: Criar perfil automaticamente ao signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    default_role_id UUID;
BEGIN
    SELECT id INTO default_role_id FROM public.roles WHERE name = 'member' LIMIT 1;
    
    INSERT INTO public.profiles (user_id, full_name, role_id)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        default_role_id
    );
    
    RETURN NEW;
END;
$$;

-- Trigger: Criar perfil ao signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: updated_at para profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================================================
-- 6. SEED DATA
-- =============================================================================
INSERT INTO public.roles (name, description, permissions) VALUES
    ('admin', 'Administrador com acesso total', '["manage_users", "manage_finances", "manage_clients", "manage_projects", "view_reports"]'::jsonb),
    ('member', 'Membro da equipe', '["manage_clients", "manage_projects", "view_reports"]'::jsonb),
    ('viewer', 'Acesso somente leitura', '["view_reports"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- END OF MODULE
-- =============================================================================
