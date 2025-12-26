-- =============================================================================
-- FIX: Brand Colors Schema Update
-- Version: 1.0.1
-- Purpose: Add project_id and category columns for proper project association
-- =============================================================================

-- Add project_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'brand_colors' 
        AND column_name = 'project_id'
    ) THEN
        ALTER TABLE public.brand_colors ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add category column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'brand_colors' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE public.brand_colors ADD COLUMN category TEXT DEFAULT 'primary';
    END IF;
END $$;

-- Create index on project_id
CREATE INDEX IF NOT EXISTS idx_brand_colors_project_id ON public.brand_colors(project_id);

-- Make client_id nullable (brand_colors are now associated with projects, not clients)
ALTER TABLE public.brand_colors ALTER COLUMN client_id DROP NOT NULL;

-- =============================================================================
-- END OF FIX
-- =============================================================================
