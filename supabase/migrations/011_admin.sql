-- ============================================
-- Rivalr.io — Migration 011: Admin Dashboard
-- ============================================

-- 1. Add is_admin column
ALTER TABLE public.profiles 
ADD COLUMN is_admin boolean NOT NULL DEFAULT false;

-- 2. Make maestroluka an admin (if exists)
UPDATE public.profiles 
SET is_admin = true 
WHERE username = 'maestroluka';

-- 3. Create Admin RPC Function
CREATE OR REPLACE FUNCTION get_admin_dashboard_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_caller_admin boolean;
  total_users int;
  total_goals int;
  total_logs int;
  user_list json;
BEGIN
  -- 1. Check if caller is admin
  SELECT is_admin INTO is_caller_admin FROM public.profiles WHERE id = auth.uid();
  IF is_caller_admin IS NOT true THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 2. Aggregate stats
  SELECT count(*) INTO total_users FROM public.profiles;
  SELECT count(*) INTO total_goals FROM public.goals;
  SELECT count(*) INTO total_logs FROM public.goal_logs;

  -- 3. Get user list (with basic stats per user if desired, but we keep it simple for now)
  SELECT json_agg(
    json_build_object(
      'id', p.id,
      'username', p.username,
      'display_name', p.display_name,
      'created_at', p.created_at,
      'is_admin', p.is_admin,
      'goal_count', (SELECT count(*) FROM public.goals g WHERE g.user_id = p.id)
    ) ORDER BY p.created_at DESC
  ) INTO user_list
  FROM public.profiles p;

  -- 4. Return as JSON
  RETURN json_build_object(
    'stats', json_build_object(
      'totalUsers', total_users,
      'totalGoals', total_goals,
      'totalLogs', total_logs
    ),
    'users', COALESCE(user_list, '[]'::json)
  );
END;
$$;
