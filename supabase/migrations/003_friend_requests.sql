-- ============================================
-- Rivalr.io — Migration 003: Friend Requests + Accept Function
-- ============================================

CREATE TABLE public.friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friend requests"
  ON public.friend_requests FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send friend requests"
  ON public.friend_requests FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Receiver can update friend request"
  ON public.friend_requests FOR UPDATE TO authenticated
  USING (receiver_id = auth.uid());

CREATE INDEX idx_friend_requests_receiver ON public.friend_requests(receiver_id);
CREATE INDEX idx_friend_requests_sender ON public.friend_requests(sender_id);

-- Function to accept a friend request and create bidirectional friendship
CREATE OR REPLACE FUNCTION public.accept_friend_request(request_id uuid)
RETURNS void AS $$
DECLARE
  req RECORD;
BEGIN
  SELECT * INTO req FROM public.friend_requests
  WHERE id = request_id AND receiver_id = auth.uid() AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friend request not found or not authorized';
  END IF;

  UPDATE public.friend_requests SET status = 'accepted' WHERE id = request_id;

  INSERT INTO public.friendships (user_id, friend_id)
    VALUES (req.sender_id, req.receiver_id)
    ON CONFLICT DO NOTHING;
  INSERT INTO public.friendships (user_id, friend_id)
    VALUES (req.receiver_id, req.sender_id)
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
