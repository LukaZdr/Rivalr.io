-- ============================================
-- Rivalr.io — Migration 008: Profiles & Reactions
-- ============================================

-- Add new columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_color text;

-- Add reaction_type to feed_likes
ALTER TABLE public.feed_likes ADD COLUMN IF NOT EXISTS reaction_type text DEFAULT 'like' NOT NULL;

-- Safely drop the old unique constraint which didn't account for reaction_type
DO $$ 
DECLARE
  c_name text;
BEGIN
  SELECT conname INTO c_name
  FROM pg_constraint
  WHERE conrelid = 'public.feed_likes'::regclass
    AND contype = 'u'
    AND array_length(conkey, 1) = 3; -- Ensure we drop the 3-column unique constraint
    
  IF c_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.feed_likes DROP CONSTRAINT ' || c_name;
  END IF;
END $$;

-- Add the new unique constraint that includes reaction_type
ALTER TABLE public.feed_likes ADD CONSTRAINT feed_likes_reaction_key UNIQUE NULLS NOT DISTINCT (user_id, post_id, log_id, reaction_type);
