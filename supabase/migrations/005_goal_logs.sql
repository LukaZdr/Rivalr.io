-- ============================================
-- Rivalr.io — Migration 005: Goal Logs & Goal Types
-- Adds goal_kind to goals table and creates goal_logs
-- ============================================

-- 1. Add goal_kind to goals
ALTER TABLE public.goals
ADD COLUMN goal_kind text NOT NULL DEFAULT 'cumulative' CHECK (goal_kind IN ('cumulative', 'milestone'));

-- 2. Create goal_logs table
CREATE TABLE public.goal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  value numeric NOT NULL CHECK (value >= 0),
  note text,
  logged_at timestamptz DEFAULT now()
);

ALTER TABLE public.goal_logs ENABLE ROW LEVEL SECURITY;

-- 3. RLS for goal_logs (similar to goals: owner or friend)
CREATE POLICY "Users can view own and friends goal logs"
  ON public.goal_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.goals
      WHERE goals.id = goal_logs.goal_id AND (
        goals.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.friendships
          WHERE (friendships.user_id = auth.uid() AND friendships.friend_id = goals.user_id)
             OR (friendships.friend_id = auth.uid() AND friendships.user_id = goals.user_id)
        )
      )
    )
  );

CREATE POLICY "Users can insert own goal logs"
  ON public.goal_logs FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.goals
      WHERE goals.id = goal_logs.goal_id AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own goal logs"
  ON public.goal_logs FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.goals
      WHERE goals.id = goal_logs.goal_id AND goals.user_id = auth.uid()
    )
  );

CREATE INDEX idx_goal_logs_goal ON public.goal_logs(goal_id);
CREATE INDEX idx_goal_logs_logged_at ON public.goal_logs(logged_at);
