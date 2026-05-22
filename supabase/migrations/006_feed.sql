-- ============================================
-- Rivalr.io — Migration 006: Social Feed & Storage
-- ============================================

-- 1. Create feed_posts table
CREATE TABLE public.feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- 2. Create feed_likes table (polymorphic between feed_posts and goal_logs)
CREATE TABLE public.feed_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  log_id uuid REFERENCES public.goal_logs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CHECK ((post_id IS NOT NULL AND log_id IS NULL) OR (post_id IS NULL AND log_id IS NOT NULL)),
  UNIQUE NULLS NOT DISTINCT (user_id, post_id, log_id)
);

-- 3. Create feed_comments table
CREATE TABLE public.feed_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  log_id uuid REFERENCES public.goal_logs(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CHECK ((post_id IS NOT NULL AND log_id IS NULL) OR (post_id IS NULL AND log_id IS NOT NULL))
);

-- 4. Enable RLS
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Feed Posts
CREATE POLICY "Users can view own and friends feed posts"
  ON public.feed_posts FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.friendships
      WHERE (user_id = auth.uid() AND friend_id = feed_posts.user_id)
         OR (friend_id = auth.uid() AND user_id = feed_posts.user_id)
    )
  );

CREATE POLICY "Users can insert own feed posts"
  ON public.feed_posts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own feed posts"
  ON public.feed_posts FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Feed Likes
-- For simplicity, if you can authenticate, you can view likes/comments of items you can view.
-- Since the items (posts/logs) themselves are RLS protected, we can allow SELECT on likes for all authenticated.
CREATE POLICY "Users can view all likes"
  ON public.feed_likes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON public.feed_likes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own likes"
  ON public.feed_likes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Feed Comments
CREATE POLICY "Users can view all comments"
  ON public.feed_comments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own comments"
  ON public.feed_comments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON public.feed_comments FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 6. Setup Storage Bucket for feed-images
INSERT INTO storage.buckets (id, name, public)
VALUES ('feed-images', 'feed-images', true)
ON CONFLICT (id) DO NOTHING;

-- Note: We assume the storage.objects table exists (standard in Supabase)
CREATE POLICY "Feed images are publicly readable"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'feed-images');

CREATE POLICY "Authenticated users can upload feed images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'feed-images' AND auth.uid() = owner);

CREATE POLICY "Authenticated users can delete own feed images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'feed-images' AND auth.uid() = owner);

-- Indexes for performance
CREATE INDEX idx_feed_posts_user ON public.feed_posts(user_id);
CREATE INDEX idx_feed_likes_post ON public.feed_likes(post_id);
CREATE INDEX idx_feed_likes_log ON public.feed_likes(log_id);
CREATE INDEX idx_feed_comments_post ON public.feed_comments(post_id);
CREATE INDEX idx_feed_comments_log ON public.feed_comments(log_id);
