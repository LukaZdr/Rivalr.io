-- ============================================
-- Rivalr.io — Migration 004: Goals
-- Friendships table must exist before running this
-- ============================================

CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  goal_type text NOT NULL,
  target numeric NOT NULL CHECK (target > 0),
  current numeric NOT NULL DEFAULT 0 CHECK (current >= 0),
  unit text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Users can see own goals + friends' goals
CREATE POLICY "Users can view own and friends goals"
  ON public.goals FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.friendships
      WHERE (user_id = auth.uid() AND friend_id = goals.user_id)
         OR (friend_id = auth.uid() AND user_id = goals.user_id)
    )
  );

CREATE POLICY "Users can insert own goals"
  ON public.goals FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own goals"
  ON public.goals FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own goals"
  ON public.goals FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_goals_user ON public.goals(user_id);
