import { signOut } from '../lib/auth.js';
import { navigate } from '../lib/router.js';
import { showToast } from './toast.js';
import { t } from '../lib/i18n.js';

/**
 * Render the app header.
 * @param {Object} profile - { username, display_name, avatar_url, theme_color, bio }
 * @param {number} pendingCount - number of pending friend requests
 * @param {Function} onEditProfile - Callback when clicking profile area
 */
export function renderHeader(profile, pendingCount = 0, onEditProfile = null) {
  const header = document.createElement('header');
  header.className = 'app-header';
  header.id = 'app-header';

  const avatarHtml = profile.avatar_url
    ? `<img src="${profile.avatar_url}" alt="${profile.display_name}" class="avatar avatar-sm" referrerpolicy="no-referrer" />`
    : `<div class="avatar avatar-sm avatar-placeholder">${(profile.display_name || profile.username || '?')[0].toUpperCase()}</div>`;

  const badgeHtml = pendingCount > 0
    ? `<span class="badge badge-warning header-badge">${pendingCount}</span>`
    : '';

  header.innerHTML = `
    <div class="header-inner">
      <a href="#/dashboard" class="header-brand">
        <span class="header-logo text-gradient">R</span>
        <span class="header-name">Rivalr<span class="text-gradient">.io</span></span>
      </a>

      <div class="header-right">
        ${badgeHtml ? `<div class="header-notifications">${badgeHtml}</div>` : ''}
        <div class="header-user cursor-pointer transition hover:opacity-80" id="btn-edit-profile" title="${t('header.editProfile')}">
          ${avatarHtml}
          <span class="header-username text-sm">@${profile.username}</span>
        </div>
        <button id="btn-signout" class="btn btn-ghost btn-sm" title="${t('header.signOut')}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  // Edit profile handler
  if (onEditProfile) {
    header.querySelector('#btn-edit-profile').addEventListener('click', onEditProfile);
  }

  // Sign out handler
  header.querySelector('#btn-signout').addEventListener('click', async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      showToast('Sign out failed', 'error');
    }
  });

  return header;
}

/**
 * Update the pending badge count in the header.
 */
export function updateHeaderBadge(count) {
  const header = document.getElementById('app-header');
  if (!header) return;

  let notifContainer = header.querySelector('.header-notifications');
  if (count > 0) {
    if (!notifContainer) {
      notifContainer = document.createElement('div');
      notifContainer.className = 'header-notifications';
      header.querySelector('.header-right').prepend(notifContainer);
    }
    notifContainer.innerHTML = `<span class="badge badge-warning header-badge">${count}</span>`;
  } else if (notifContainer) {
    notifContainer.remove();
  }
}
