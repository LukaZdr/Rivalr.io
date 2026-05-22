import { createFeedPost, toggleReaction, addComment, updateGoalTarget } from '../lib/api.js';
import { supabase } from '../lib/supabase.js';
import { showToast } from './toast.js';
import { showExtendGoalModal } from './goalCard.js';
import { t } from '../lib/i18n.js';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + t('feed.time.y');
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + t('feed.time.mo');
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + t('feed.time.d');
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + t('feed.time.h');
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + t('feed.time.m');
  return Math.floor(seconds) + t('feed.time.s');
}

export function renderFeed(container, feedData, currentUser, onRefresh) {
  container.innerHTML = '';

  // 1. Composer
  const composer = document.createElement('div');
  composer.className = 'feed-composer animate-in stagger-1 mb-6';
  
  let selectedFile = null;

  composer.innerHTML = `
    <textarea class="composer-input" placeholder="${t('feed.postPlaceholder')}"></textarea>
    <div class="composer-image-preview hidden">
      <img src="" alt="Preview" />
      <button class="composer-remove-image">✕</button>
    </div>
    <div class="composer-actions">
      <div>
        <input type="file" id="feed-image-upload" accept="image/*" class="hidden" />
        <button type="button" class="btn btn-ghost btn-icon" id="btn-upload-image" title="Add Image">
          📷
        </button>
      </div>
      <button class="btn btn-primary btn-sm" id="btn-post-feed">${t('feed.postBtn')}</button>
    </div>
  `;
  container.appendChild(composer);

  const fileInput = composer.querySelector('#feed-image-upload');
  const previewDiv = composer.querySelector('.composer-image-preview');
  const previewImg = composer.querySelector('img');
  const textArea = composer.querySelector('.composer-input');
  const btnPost = composer.querySelector('#btn-post-feed');

  composer.querySelector('#btn-upload-image').addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      selectedFile = e.target.files[0];
      previewImg.src = URL.createObjectURL(selectedFile);
      previewDiv.classList.remove('hidden');
    }
  });

  composer.querySelector('.composer-remove-image').addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';
    previewDiv.classList.add('hidden');
  });

  btnPost.addEventListener('click', async () => {
    const content = textArea.value.trim();
    if (!content && !selectedFile) return;

    btnPost.disabled = true;
    btnPost.textContent = t('feed.posting');

    try {
      await createFeedPost(text, selectedFile);
      showToast('Posted to feed', 'success');
      textArea.value = '';
      selectedFile = null;
      previewDiv.classList.add('hidden');
      onRefresh();
    } catch (error) {
      console.error(error);
      showToast('Failed to post', 'error');
      btnPost.disabled = false;
      btnPost.textContent = t('feed.postBtn');
    }
  });

  // 2. Feed Items
  const feedList = document.createElement('div');
  feedList.className = 'feed-container';

  if (!feedData || feedData.length === 0) {
    container.innerHTML += `
      <div class="empty-state">
        <div class="empty-state-icon">📡</div>
        <h3>${t('feed.empty.title')}</h3>
        <p>${t('feed.empty.desc')}</p>
      </div>
    `;
    return;
  }

  feedData.forEach((item, index) => {
    // Group likes by reaction_type
    const reactionCounts = {};
    const myReactions = new Set();
    item.likes.forEach(l => {
      const rt = l.reaction_type || 'like';
      reactionCounts[rt] = (reactionCounts[rt] || 0) + 1;
      if (l.user_id === currentUser.id) myReactions.add(rt);
    });

    const reactionsListHtml = Object.entries(reactionCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([rt, count]) => `<span class="feed-reaction-badge ${myReactions.has(rt) ? 'active' : ''}" style="cursor:pointer; padding:2px 6px; background:var(--color-surface); border-radius:12px; font-size:12px; border:1px solid ${myReactions.has(rt) ? 'var(--color-accent)' : 'transparent'}; margin-right:4px;">${rt === 'like' ? '❤️' : rt} ${count}</span>`)
      .join('');

    const commentCount = item.comments.length;
    
    const card = document.createElement('div');
    card.className = `feed-item animate-in stagger-${Math.min((index % 5) + 2, 5)}`;
    
    const avatarUrl = item.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.profile?.display_name || item.profile?.username || 'U')}&background=6366f1&color=fff`;
    const displayName = escapeHtml(item.profile?.display_name || item.profile?.username || 'Unknown');

    let contentHtml = '';

    if (item.itemType === 'post') {
      contentHtml = `<div class="feed-content">${escapeHtml(item.content)}</div>`;
      if (item.imageUrl) {
        contentHtml += `<img src="${escapeHtml(item.imageUrl)}" class="feed-image" alt="Post image" loading="lazy" />`;
      }
    } else if (item.itemType === 'log') {
      const isComplete = item.goal.goal_kind === 'milestone' 
        ? item.value >= item.goal.target 
        : item.goal.current >= item.goal.target; // Note: current might be the updated total

      let progressText = item.goal.goal_kind === 'cumulative' 
        ? t('feed.log.cumulative', item.value, escapeHtml(item.goal.unit))
        : t('feed.log.milestone', item.value, escapeHtml(item.goal.unit));

      contentHtml = `
        <div class="feed-log-box" style="padding: 12px; margin-top: 8px; ${isComplete ? 'background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15)); border-color: rgba(168, 85, 247, 0.3);' : ''}">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-lg">${isComplete ? '🏆' : '🔥'}</span>
            <strong>${isComplete ? t('feed.log.achieved') : t('feed.log.progress')}</strong>
            <span class="text-tertiary text-sm ml-auto font-bold">${escapeHtml(item.goal.goal_type)}</span>
          </div>
          <div class="feed-log-note">${progressText}</div>
          ${item.note ? `<div class="feed-log-note mt-1 italic text-secondary">"${escapeHtml(item.note)}"</div>` : ''}
          ${isComplete && item.userId === currentUser.id ? `
            <button class="btn btn-primary btn-sm mt-3 btn-extend-goal" data-goal-id="${item.goal.id}" data-current-target="${item.goal.target}">
              ${t('feed.extendBtn')}
            </button>
          ` : ''}
        </div>
      `;
    }

    card.innerHTML = `
      <div class="feed-item-header">
        <div class="feed-user-info">
          <img src="${avatarUrl}" class="avatar avatar-sm" alt="Avatar" />
          <div>
            <div class="feed-user-name">${displayName}</div>
            <div class="feed-time">${timeAgo(item.createdAt)}</div>
          </div>
        </div>
        ${item.userId === currentUser.id && item.itemType === 'post' ? `
          <button class="btn btn-ghost btn-sm btn-delete-post" data-id="${item.id}" title="Delete Post">🗑️</button>
        ` : ''}
      </div>
      
      ${contentHtml}

      <div class="feed-actions flex items-center mt-2">
        <div class="reaction-picker-container" style="position: relative;">
          <button class="feed-action-btn btn-add-reaction" style="font-weight:bold;">
            + <span class="like-count">${item.likes.length}</span>
          </button>
          <div class="reaction-picker hidden" style="position:absolute; bottom:100%; left:0; background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-md); padding:4px; display:flex; gap:4px; margin-bottom:4px; z-index:10;">
            <button class="reaction-option btn btn-ghost btn-sm" style="padding:4px;" data-reaction="🔥">🔥</button>
            <button class="reaction-option btn btn-ghost btn-sm" style="padding:4px;" data-reaction="💪">💪</button>
            <button class="reaction-option btn btn-ghost btn-sm" style="padding:4px;" data-reaction="👏">👏</button>
            <button class="reaction-option btn btn-ghost btn-sm" style="padding:4px;" data-reaction="🏃">🏃</button>
            <button class="reaction-option btn btn-ghost btn-sm" style="padding:4px;" data-reaction="🥇">🥇</button>
            <button class="reaction-option btn btn-ghost btn-sm" style="padding:4px;" data-reaction="❤️">❤️</button>
          </div>
        </div>
        <div class="reaction-summary flex items-center ml-2">
          ${reactionsListHtml}
        </div>
        <button class="feed-action-btn btn-comment-toggle ml-auto">
          💬 <span class="comment-count">${commentCount}</span>
        </button>
      </div>

      <div class="feed-comments hidden mt-3">
        <div class="comments-list">
          ${item.comments.map(c => `
            <div class="feed-comment">
              <img src="${c.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.profiles?.username || 'U')}&background=6366f1&color=fff`}" class="avatar avatar-sm" style="width: 24px; height: 24px;" alt="Avatar" />
              <div class="feed-comment-content">
                <div class="feed-comment-header">
                  <span class="feed-comment-name">${escapeHtml(c.profiles?.display_name || c.profiles?.username)}</span>
                  <span class="text-xs text-tertiary">${timeAgo(new Date(c.created_at))}</span>
                </div>
                <div class="feed-comment-text">${escapeHtml(c.content)}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <form class="comment-input-wrap">
          <input type="text" class="input comment-input" placeholder="${t('feed.commentPlaceholder')}" required maxlength="255" />
          <button type="submit" class="btn btn-primary btn-sm">${t('feed.replyBtn')}</button>
        </form>
      </div>
    `;

    // Delete post
    const deleteBtn = card.querySelector('.btn-delete-post');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!confirm(t('feed.deleteConfirm'))) return;
        try {
          await supabase.from('feed_posts').delete().eq('id', item.id);
          onRefresh();
        } catch (e) {
          showToast('Failed to delete post', 'error');
        }
      });
    }

    // Extend goal
    const extendBtn = card.querySelector('.btn-extend-goal');
    if (extendBtn) {
      extendBtn.addEventListener('click', async () => {
        const goalId = extendBtn.dataset.goalId;
        const currentTarget = extendBtn.dataset.currentTarget;
        showExtendGoalModal(goalId, currentTarget, onRefresh);
      });
    }

    // Reaction picker toggle
    const pickerContainer = card.querySelector('.reaction-picker-container');
    const picker = card.querySelector('.reaction-picker');
    const addReactionBtn = card.querySelector('.btn-add-reaction');

    addReactionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      picker.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!pickerContainer.contains(e.target)) {
        picker.classList.add('hidden');
      }
    });

    // Add reaction
    picker.querySelectorAll('.reaction-option').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const reaction = btn.dataset.reaction;
        const isReacted = myReactions.has(reaction);
        picker.classList.add('hidden');
        
        try {
          await toggleReaction(item.id, item.itemType, reaction, isReacted);
          onRefresh();
        } catch (err) {
          showToast('Reaction failed', 'error');
        }
      });
    });

    // Toggle existing reaction badges
    card.querySelectorAll('.feed-reaction-badge').forEach(badge => {
      badge.addEventListener('click', async () => {
        const text = badge.textContent.trim().split(' ')[0];
        const reaction = text === '❤️' ? 'like' : text;
        const isReacted = myReactions.has(reaction);
        try {
          await toggleReaction(item.id, item.itemType, reaction, isReacted);
          onRefresh();
        } catch (err) {
          showToast('Reaction failed', 'error');
        }
      });
    });

    // Comments toggle
    const commentsToggle = card.querySelector('.btn-comment-toggle');
    const commentsSection = card.querySelector('.feed-comments');
    commentsToggle.addEventListener('click', () => {
      commentsSection.classList.toggle('hidden');
    });

    // Add comment
    const commentForm = card.querySelector('.comment-input-wrap');
    const commentInput = card.querySelector('.comment-input');
    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = commentInput.value.trim();
      if (!text) return;

      const submitBtn = commentForm.querySelector('button');
      submitBtn.disabled = true;

      try {
        await addComment(item.id, item.itemType, text);
        commentInput.value = '';
        onRefresh(); // Refresh to show new comment
      } catch (e) {
        showToast('Failed to post comment', 'error');
        submitBtn.disabled = false;
      }
    });

    feedList.appendChild(card);
  });

  container.appendChild(feedList);
}
