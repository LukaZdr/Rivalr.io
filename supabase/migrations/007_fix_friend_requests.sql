-- ============================================
-- Rivalr.io — Migration 007: Fix Friend Request Resend
-- ============================================

-- Allow the sender to update their own friend request (e.g. for upserting to retry a rejected request)
CREATE POLICY "Sender can update own friend request"
  ON public.friend_requests FOR UPDATE TO authenticated
  USING (sender_id = auth.uid());

-- Allow the sender to delete their own friend request (useful for cancelling requests or clearing rejections)
CREATE POLICY "Sender can delete own friend request"
  ON public.friend_requests FOR DELETE TO authenticated
  USING (sender_id = auth.uid());
