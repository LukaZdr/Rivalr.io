-- ============================================
-- Rivalr.io — Migration 013: Goal Normalization
-- ============================================

ALTER TABLE public.goals 
ADD COLUMN start_value numeric NOT NULL DEFAULT 0 CHECK (start_value >= 0);
