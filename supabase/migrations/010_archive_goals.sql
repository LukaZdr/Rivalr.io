-- ============================================
-- Rivalr.io — Migration 010: Archive Goals
-- ============================================

ALTER TABLE public.goals 
ADD COLUMN is_archived boolean NOT NULL DEFAULT false;
