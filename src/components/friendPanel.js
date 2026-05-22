import { searchUsers, sendFriendRequest, getPendingRequests, acceptFriendRequest, rejectFriendRequest, getFriends, removeFriend } from '../lib/api.js';
import { showToast } from './toast.js';
import { t } from '../lib/i18n.js';

let searchTimer = null;

/**
 * Render the friend panel (sidebar).
 * @param {HTMLElement} container
 * @param {Function} onFriendChange - callback when friendships change
 */
export async function renderFriendPanel(container, onFriendChange) {
  container.innerHTML = `
    <div class="friend-panel">
      <!-- Search -->
      <div class="panel mb-4">
        <div class="panel-header"><h2>${t('friends.addBtn')}</h2></div>
        <div class="panel-body">
          <div class="friend-search-wrap">
            <input type="text" id="friend-search-input" class="input" placeholder="${t('friends.addPlaceholder')}" autocomplete="off" />
            <div id="friend-search-results" class="friend-search-results"></div>
          </div>
        </div>
      </div>

      <!-- Pending Requests -->
      <div class="panel mb-4">
        <div class="panel-header">
          <h2>${t('friends.pendingTitle')}</h2>
          <span id="pending-count" class="badge badge-primary" style="display:none">0</span>
        </div>
        <div class="panel-body" id="pending-requests-list"></div>
      </div>

      <!-- Friends List -->
      <div class="panel">
        <div class="panel-header"><h2>${t('friends.listTitle')}</h2></div>
        <div class="panel-body" id="friends-list"></div>
      </div>
    </div>
  `;

  const searchInput = document.getElementById('friend-search-input');
  const searchResults = document.getElementById('friend-search-results');

  // Search handler
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim();
    if (q.length < 2) { searchResults.innerHTML = ''; return; }
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
      try {
        const users = await searchUsers(q);
        if (searchInput.value.trim() !== q) return;
        renderSearchResults(searchResults, users, onFriendChange);
      } catch { searchResults.innerHTML = ''; }
    }, 300);
  });

  // Load pending requests and friends
  await refreshFriendData(onFriendChange);
}

async function refreshFriendData(onFriendChange) {
  try {
    const [pending, friends] = await Promise.all([getPendingRequests(), getFriends()]);
    renderPendingRequests(document.getElementById('pending-requests-list'), pending, onFriendChange);
    renderFriendsList(document.getElementById('friends-list'), friends, onFriendChange);

    const badge = document.getElementById('pending-count');
    if (badge) {
      badge.textContent = pending.length;
      badge.style.display = pending.length > 0 ? 'inline-flex' : 'none';
    }
    return pending.length;
  } catch { return 0; }
}

function renderSearchResults(container, users, onFriendChange) {
  if (users.length === 0) {
    container.innerHTML = '<p class="text-xs text-tertiary" style="padding:8px">No users found</p>';
    return;
  }
  container.innerHTML = users.map(u => `
    <div class="search-result-row">
      <div class="flex items-center gap-2">
        ${avatarHtml(u)}
        <div>
          <span class="font-medium text-sm">${esc(u.display_name || u.username)}</span>
          <span class="text-xs text-tertiary"> @${esc(u.username)}</span>
        </div>
      </div>
      <button class="btn btn-primary btn-sm btn-add-friend" data-username="${esc(u.username)}">Add</button>
    </div>
  `).join('');

  container.querySelectorAll('.btn-add-friend').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = '...';
      try {
        await sendFriendRequest(btn.dataset.username);
        showToast(t('friends.addSuccess'), 'success');
        btn.textContent = t('friends.sent');
        btn.classList.replace('btn-primary', 'btn-ghost');
      } catch (err) {
        showToast(err.message || t('friends.addError'), 'error');
        btn.disabled = false;
        btn.textContent = t('friends.addBtn');
      }
    });
  });
}

function renderPendingRequests(container, requests, onFriendChange) {
  if (!container) return;
  if (requests.length === 0) {
    container.innerHTML = `<p class="text-xs text-tertiary">${t('friends.noPending')}</p>`;
    return;
  }
  container.innerHTML = requests.map(r => `
    <div class="request-row">
      <div class="flex items-center gap-2">
        ${avatarHtml(r.sender)}
        <div>
          <span class="font-medium text-sm">${esc(r.sender?.display_name || '')}</span>
          <span class="text-xs text-tertiary"> @${esc(r.sender?.username || '')}</span>
        </div>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-primary btn-sm btn-accept" data-id="${r.id}">${t('friends.accept')}</button>
        <button class="btn btn-ghost btn-sm btn-reject" data-id="${r.id}">✕</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.btn-accept').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await acceptFriendRequest(btn.dataset.id);
        onFriendChange();
        refreshFriendData(onFriendChange);
      } catch (err) { showToast(t('friends.acceptError'), 'error'); }
    });
  });

  container.querySelectorAll('.btn-reject').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await rejectFriendRequest(btn.dataset.id);
        refreshFriendData(onFriendChange);
      } catch { showToast(t('friends.declineError'), 'error'); }
    });
  });
}

function renderFriendsList(container, friends, onFriendChange) {
  if (!container) return;
  if (friends.length === 0) {
    container.innerHTML = `<p class="text-xs text-tertiary">${t('friends.empty.desc')}</p>`;
    return;
  }
  container.innerHTML = friends.map(f => {
    const p = f.profile;
    return `
    <div class="friend-row">
      <div class="flex items-center gap-2">
        ${avatarHtml(p)}
        <div>
          <span class="font-medium text-sm">${esc(p?.display_name || '')}</span>
          <span class="text-xs text-tertiary"> @${esc(p?.username || '')}</span>
        </div>
      </div>
      <button class="btn btn-danger btn-sm btn-remove-friend" data-id="${f.friend_id}" title="Remove friend">✕</button>
    </div>`;
  }).join('');

  container.querySelectorAll('.btn-remove-friend').forEach(btn => {
    btn.addEventListener('click', async () => {
      const username = btn.dataset.username || 'this user';
      if (!confirm(t('friends.removeConfirm', esc(username)))) return;
      try {
        await removeFriend(btn.dataset.id);
        onFriendChange();
        refreshFriendData(onFriendChange);
      } catch { showToast('Failed to remove friend', 'error'); }
    });
  });
}

export { refreshFriendData };

function avatarHtml(u) {
  if (!u) return '<div class="avatar avatar-sm avatar-placeholder">?</div>';
  return u.avatar_url
    ? `<img src="${u.avatar_url}" class="avatar avatar-sm" referrerpolicy="no-referrer" />`
    : `<div class="avatar avatar-sm avatar-placeholder">${(u.display_name || u.username || '?')[0].toUpperCase()}</div>`;
}

function esc(t) {
  const d = document.createElement('div');
  d.textContent = t || '';
  return d.innerHTML;
}
