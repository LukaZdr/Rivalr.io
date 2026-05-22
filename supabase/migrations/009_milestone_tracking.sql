-- ============================================
-- Rivalr.io — Migration 009: Milestone Tracking
-- ============================================

-- Add is_milestone boolean to goal_logs to permanently stamp when a log achieves a goal
ALTER TABLE public.goal_logs ADD COLUMN IF NOT EXISTS is_milestone boolean DEFAULT false NOT NULL;

-- Track the exact target that was achieved at that milestone
ALTER TABLE public.goal_logs ADD COLUMN IF NOT EXISTS milestone_target numeric;
