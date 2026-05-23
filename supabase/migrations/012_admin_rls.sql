-- ============================================
-- Rivalr.io — Migration 012: Admin Moderation RLS
-- ============================================

-- Goals
CREATE POLICY "Admins can update all goals" ON public.goals 
FOR UPDATE TO authenticated 
USING ( (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) );

CREATE POLICY "Admins can delete all goals" ON public.goals 
FOR DELETE TO authenticated 
USING ( (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) );

-- Goal Logs
CREATE POLICY "Admins can update all goal logs" ON public.goal_logs 
FOR UPDATE TO authenticated 
USING ( (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) );

CREATE POLICY "Admins can delete all goal logs" ON public.goal_logs 
FOR DELETE TO authenticated 
USING ( (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) );

-- Feed Posts
CREATE POLICY "Admins can update all feed posts" ON public.feed_posts 
FOR UPDATE TO authenticated 
USING ( (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) );

CREATE POLICY "Admins can delete all feed posts" ON public.feed_posts 
FOR DELETE TO authenticated 
USING ( (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) );

-- Feed Comments
CREATE POLICY "Admins can update all feed comments" ON public.feed_comments 
FOR UPDATE TO authenticated 
USING ( (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) );

CREATE POLICY "Admins can delete all feed comments" ON public.feed_comments 
FOR DELETE TO authenticated 
USING ( (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) );
