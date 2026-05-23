import { supabase } from './supabase.js';

// =============================
// PROFILES
// =============================

/**
 * Get the current user's profile.
 */
export async function getMyProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error && error.code === 'PGRST116') return null; // not found
  if (error) throw error;
  return data;
}

/**
 * Create a profile for the current user.
 */
export async function createProfile(username, displayName) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      username: username.toLowerCase().trim(),
      display_name: displayName.trim(),
      avatar_url: user.user_metadata?.avatar_url || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update the user's profile settings (bio, theme, display name).
 */
export async function updateProfile(displayName, bio, themeColor) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName.trim(),
      bio: bio ? bio.trim() : null,
      theme_color: themeColor || null,
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Check if a username is available.
 */
export async function checkUsernameAvailable(username) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase().trim())
    .maybeSingle();

  if (error) throw error;
  return !data;
}

/**
 * Search users by username (partial match).
 */
export async function searchUsers(query) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .ilike('username', `%${query.trim()}%`)
    .neq('id', user.id)
    .limit(10);

  if (error) throw error;
  return data || [];
}

// =============================
// GOALS (Milestones)
// =============================

/**
 * Get all goals for the current user.
 */
export async function getMyGoals() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('goals')
    .select('*, goal_logs(id, value, note, logged_at, is_milestone, milestone_target)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get all goals for a specific user (Admin use).
 */
export async function getUserGoals(userId) {
  const { data, error } = await supabase
    .from('goals')
    .select('*, goal_logs(id, value, note, logged_at, is_milestone, milestone_target)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Create a new goal.
 */
export async function createGoal(goalType, target, unit, goalKind = 'cumulative') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: activeGoals, error: countError } = await supabase
    .from('goals')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_archived', false);
  if (countError) throw countError;
  if (activeGoals && activeGoals.length >= 5) {
    throw new Error('limitReached');
  }

  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      goal_type: goalType.trim(),
      target: parseFloat(target),
      current: 0,
      unit: unit.trim(),
      goal_kind: goalKind,
      is_archived: false,
    })
    .select()
    .single();

  if (error) throw error;

  // Automatically post to feed
  try {
    await createFeedPost(`I just set a new goal: ${goalType.trim()}! Target: ${parseFloat(target)} ${unit.trim()} 🎯`);
  } catch (e) {
    console.error('Failed to post goal creation to feed:', e);
  }

  return data;
}

/**
 * Update progress on a goal (now unused directly, use logProgress instead).
 */
export async function updateGoalProgress(goalId, newCurrent) {
  const { data, error } = await supabase
    .from('goals')
    .update({
      current: parseFloat(newCurrent),
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update the target of a goal (extend goal).
 */
export async function updateGoalTarget(goalId, newTarget) {
  const { data, error } = await supabase
    .from('goals')
    .update({
      target: parseFloat(newTarget),
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Log progress towards a goal and update the current total/max.
 */
export async function logProgress(goal, value, note = '', loggedAt = null) {
  const numValue = parseFloat(value);
  
  // 2. Calculate the goal's current value and check for milestone
  let newCurrent = 0;
  let isMilestone = false;
  const target = parseFloat(goal.target);
  const prevCurrent = parseFloat(goal.current);

  if (goal.goal_kind === 'cumulative') {
    newCurrent = prevCurrent + numValue;
    if (prevCurrent < target && newCurrent >= target) {
      isMilestone = true;
    }
  } else if (goal.goal_kind === 'milestone') {
    newCurrent = Math.max(prevCurrent, numValue);
    if (prevCurrent < target && numValue >= target) {
      isMilestone = true;
    }
  }

  // 1. Insert the log entry (moved down so we can set is_milestone)
  const logData = {
    goal_id: goal.id,
    value: numValue,
    note: note.trim() || null,
    is_milestone: isMilestone
  };
  
  if (loggedAt) {
    // If a custom date was provided (e.g. 'YYYY-MM-DD'), store it as an ISO string or just the date
    logData.logged_at = new Date(loggedAt).toISOString();
  }
  if (isMilestone) {
    logData.milestone_target = target;
  }

  const { error: logError } = await supabase
    .from('goal_logs')
    .insert(logData);

  if (logError) throw logError;

  // 3. Update the goal's current value

  const { data, error: updateError } = await supabase
    .from('goals')
    .update({
      current: newCurrent,
      updated_at: new Date().toISOString()
    })
    .eq('id', goal.id)
    .select()
    .single();
    
  if (updateError) throw updateError;
  return data;
}

/**
 * Update an existing progress log.
 */
export async function updateGoalLog(logId, goalId, value, note, loggedAt) {
  const numValue = parseFloat(value);
  const updateData = {
    value: numValue,
    note: note.trim() || null,
  };
  if (loggedAt) {
    updateData.logged_at = new Date(loggedAt).toISOString();
  }

  const { error } = await supabase
    .from('goal_logs')
    .update(updateData)
    .eq('id', logId);

  if (error) throw error;
  return await recalculateGoalProgress(goalId);
}

/**
 * Delete a progress log.
 */
export async function deleteGoalLog(logId, goalId) {
  const { error } = await supabase
    .from('goal_logs')
    .delete()
    .eq('id', logId);

  if (error) throw error;
  return await recalculateGoalProgress(goalId);
}

/**
 * Recalculate goal progress (current) after a log is modified or deleted.
 */
async function recalculateGoalProgress(goalId) {
  // Fetch goal
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select('target, goal_kind')
    .eq('id', goalId)
    .single();

  if (goalError) throw goalError;

  // Fetch all remaining logs
  const { data: logs, error: logsError } = await supabase
    .from('goal_logs')
    .select('value, logged_at')
    .eq('goal_id', goalId)
    .order('logged_at', { ascending: true });

  if (logsError) throw logsError;

  let newCurrent = 0;
  if (goal.goal_kind === 'cumulative') {
    newCurrent = logs.reduce((sum, log) => sum + log.value, 0);
  } else if (goal.goal_kind === 'milestone') {
    newCurrent = logs.length > 0 ? Math.max(...logs.map(l => l.value)) : 0;
  }

  // Update goal
  const { data: updatedGoal, error: updateError } = await supabase
    .from('goals')
    .update({
      current: newCurrent,
      updated_at: new Date().toISOString()
    })
    .eq('id', goalId)
    .select()
    .single();

  if (updateError) throw updateError;
  return updatedGoal;
}

/**
 * Delete a goal.
 */
export async function deleteGoal(goalId) {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId);

  if (error) throw error;
}

/**
 * Archive a goal.
 */
export async function archiveGoal(goalId) {
  const { error } = await supabase
    .from('goals')
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq('id', goalId);
  if (error) throw error;
}

/**
 * Unarchive a goal.
 */
export async function unarchiveGoal(goalId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: activeGoals, error: countError } = await supabase
    .from('goals')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_archived', false);
  if (countError) throw countError;
  if (activeGoals && activeGoals.length >= 5) {
    throw new Error('limitReached');
  }

  const { error } = await supabase
    .from('goals')
    .update({ is_archived: false, updated_at: new Date().toISOString() })
    .eq('id', goalId);
  if (error) throw error;
}

/**
 * Get friends' goals for the leaderboard, including logs.
 */
export async function getLeaderboardData() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get all friends
  const { data: friendships, error: fError } = await supabase
    .from('friendships')
    .select('friend_id')
    .eq('user_id', user.id);

  if (fError) throw fError;

  const friendIds = (friendships || []).map(f => f.friend_id);
  const allIds = [user.id, ...friendIds];

  // Get goals with profiles and logs for all relevant users
  const { data: goals, error: gError } = await supabase
    .from('goals')
    .select(`
      id,
      goal_type,
      target,
      current,
      unit,
      goal_kind,
      updated_at,
      user_id,
      profiles:user_id (
        username,
        display_name,
        avatar_url
      ),
      goal_logs (
        value,
        logged_at,
        note,
        is_milestone,
        milestone_target
      )
    `)
    .eq('is_archived', false)
    .in('user_id', allIds)
    .order('updated_at', { ascending: false });

  if (gError) throw gError;
  return goals || [];
}

/**
 * ============================================
 * FEED & SOCIAL FEATURES
 * ============================================
 */

/**
 * Create a new feed post, optionally with an image.
 */
export async function createFeedPost(content, imageFile = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let imageUrl = null;

  if (imageFile) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('feed-images')
      .upload(filePath, imageFile);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('feed-images')
      .getPublicUrl(filePath);

    imageUrl = publicUrl;
  }

  const { data, error } = await supabase
    .from('feed_posts')
    .insert({
      user_id: user.id,
      content: content.trim(),
      image_url: imageUrl
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Toggle a reaction on a feed post or goal log.
 */
export async function toggleReaction(itemId, itemType, reactionType, isReacted) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const column = itemType === 'post' ? 'post_id' : 'log_id';

  if (isReacted) {
    // Remove reaction
    const { error } = await supabase
      .from('feed_likes')
      .delete()
      .eq('user_id', user.id)
      .eq(column, itemId)
      .eq('reaction_type', reactionType);
    if (error) throw error;
  } else {
    // Add reaction
    const { error } = await supabase
      .from('feed_likes')
      .insert({
        user_id: user.id,
        [column]: itemId,
        reaction_type: reactionType
      });
    if (error) throw error;
  }
}

/**
 * Add a comment to a feed post or goal log.
 */
export async function addComment(itemId, itemType, content) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const column = itemType === 'post' ? 'post_id' : 'log_id';

  const { data, error } = await supabase
    .from('feed_comments')
    .insert({
      user_id: user.id,
      [column]: itemId,
      content: content.trim()
    })
    .select(`
      id,
      content,
      created_at,
      profiles:user_id ( username, display_name, avatar_url )
    `)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get unified feed data (posts + logs) for self and friends.
 */
export async function getFeedData() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get friends
  const { data: friendships } = await supabase
    .from('friendships')
    .select('friend_id')
    .eq('user_id', user.id);

  const friendIds = (friendships || []).map(f => f.friend_id);
  const allIds = [user.id, ...friendIds];

  // Fetch Feed Posts
  const { data: posts, error: pError } = await supabase
    .from('feed_posts')
    .select(`
      id,
      content,
      image_url,
      created_at,
      user_id,
      profiles:user_id ( username, display_name, avatar_url, theme_color ),
      feed_likes ( user_id, reaction_type ),
      feed_comments (
        id,
        content,
        created_at,
        profiles:user_id ( username, display_name, avatar_url )
      )
    `)
    .in('user_id', allIds)
    .order('created_at', { ascending: false })
    .limit(30);

  if (pError) throw pError;

  // Fetch Goal Logs
  // Goal logs don't directly have a user_id, they belong to goals which belong to users.
  // We can fetch goal_logs where goal.user_id is in allIds.
  const { data: logs, error: lError } = await supabase
    .from('goal_logs')
    .select(`
      id,
      value,
      note,
      logged_at,
      goals!inner (
        id,
        user_id,
        goal_type,
        goal_kind,
        target,
        current,
        unit,
        profiles:user_id ( username, display_name, avatar_url, theme_color )
      ),
      feed_likes ( user_id, reaction_type ),
      feed_comments (
        id,
        content,
        created_at,
        profiles:user_id ( username, display_name, avatar_url )
      )
    `)
    .in('goals.user_id', allIds)
    .order('logged_at', { ascending: false })
    .limit(30);

  if (lError) throw lError;

  // Normalize and combine
  const feedItems = [];

  (posts || []).forEach(post => {
    feedItems.push({
      itemType: 'post',
      id: post.id,
      userId: post.user_id,
      profile: post.profiles,
      content: post.content,
      imageUrl: post.image_url,
      createdAt: new Date(post.created_at),
      likes: post.feed_likes || [],
      comments: post.feed_comments || []
    });
  });

  (logs || []).forEach(log => {
    feedItems.push({
      itemType: 'log',
      id: log.id,
      userId: log.goals.user_id,
      profile: log.goals.profiles,
      goal: log.goals,
      value: log.value,
      note: log.note,
      createdAt: new Date(log.logged_at),
      likes: log.feed_likes || [],
      comments: log.feed_comments || []
    });
  });

  // Sort descending by date
  feedItems.sort((a, b) => b.createdAt - a.createdAt);

  return feedItems.slice(0, 50); // Keep top 50
}

// =============================
// FRIEND REQUESTS
// =============================

/**
 * Send a friend request by username.
 */
export async function sendFriendRequest(username) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Find the target user
  const { data: target, error: findError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase().trim())
    .single();

  if (findError || !target) throw new Error('User not found');
  if (target.id === user.id) throw new Error("You can't add yourself");

  // Check if already friends
  const { data: existingFriend } = await supabase
    .from('friendships')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('friend_id', target.id)
    .maybeSingle();

  if (existingFriend) throw new Error('Already friends with this user');

  // Check for existing pending request in either direction
  const { data: existingReq } = await supabase
    .from('friend_requests')
    .select('id, status, sender_id')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${target.id}),and(sender_id.eq.${target.id},receiver_id.eq.${user.id})`)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingReq) throw new Error('A friend request already exists');

  const { data, error } = await supabase
    .from('friend_requests')
    .upsert({
      sender_id: user.id,
      receiver_id: target.id,
      status: 'pending',
      created_at: new Date().toISOString()
    }, {
      onConflict: 'sender_id,receiver_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get pending friend requests received by current user.
 */
export async function getPendingRequests() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('friend_requests')
    .select(`
      id,
      status,
      created_at,
      sender:sender_id (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('receiver_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get sent friend requests by current user.
 */
export async function getSentRequests() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('friend_requests')
    .select(`
      id,
      status,
      created_at,
      receiver:receiver_id (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('sender_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Accept a friend request (calls the DB function).
 */
export async function acceptFriendRequest(requestId) {
  const { error } = await supabase.rpc('accept_friend_request', {
    request_id: requestId,
  });
  if (error) throw error;
}

/**
 * Reject a friend request.
 */
export async function rejectFriendRequest(requestId) {
  const { error } = await supabase
    .from('friend_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId);

  if (error) throw error;
}

// =============================
// FRIENDSHIPS
// =============================

/**
 * Get all friends with profile info.
 */
export async function getFriends() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('friendships')
    .select(`
      friend_id,
      created_at,
      profile:friend_id (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('user_id', user.id);

  if (error) throw error;
  return data || [];
}

/**
 * Remove a friend (delete both directions).
 */
export async function removeFriend(friendId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Delete both directions
  const { error: e1 } = await supabase
    .from('friendships')
    .delete()
    .eq('user_id', user.id)
    .eq('friend_id', friendId);

  const { error: e2 } = await supabase
    .from('friendships')
    .delete()
    .eq('user_id', friendId)
    .eq('friend_id', user.id);

  if (e1) throw e1;
  if (e2) throw e2;
}

// =============================
// ADMIN API
// =============================

/**
 * Fetch aggregated data for the Admin Dashboard.
 */
export async function fetchAdminData() {
  const { data, error } = await supabase.rpc('get_admin_dashboard_data');
  if (error) throw error;
  return data;
}
