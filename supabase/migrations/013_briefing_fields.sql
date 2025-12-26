-- =============================================================================
-- BRIEFING FIELDS — Campos de Briefing para Projetos
-- Version: 1.0.0
-- Dependencies: 002_crm.sql
-- =============================================================================

-- Adicionar campos de briefing à tabela de projetos
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS nicho_mercado TEXT,
ADD COLUMN IF NOT EXISTS briefing_inicial TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.projects.nicho_mercado IS 'Nicho de mercado do cliente/projeto';
COMMENT ON COLUMN public.projects.briefing_inicial IS 'Briefing inicial coletado na criação do projeto';
