import { getMyProfile, getMyGoals, getLeaderboardData, getFeedData, updateProfile } from '../lib/api.js';
import { getCurrentUser } from '../lib/auth.js';
import { renderHeader, updateHeaderBadge } from '../components/header.js';
import { renderGoalCards, showCreateGoalModal } from '../components/goalCard.js';
import { renderLeaderboard } from '../components/leaderboard.js';
import { renderProgressChart } from '../components/progressChart.js';
import { renderFriendPanel, refreshFriendData } from '../components/friendPanel.js';
import { renderFeed } from '../components/feed.js';
import { showToast } from '../components/toast.js';
import { t, getLang, setLang } from '../lib/i18n.js';
import { supabase } from '../lib/supabase.js';

export function applyTheme(themeColor) {
  if (themeColor) {
    document.documentElement.style.setProperty('--gradient-primary', themeColor);
  } else {
    document.documentElement.style.removeProperty('--gradient-primary');
  }
}

function showEditProfileModal(profile, onSave) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  
  const colors = [
    { name: 'Default Purple', value: '' },
    { name: 'Emerald', value: 'linear-gradient(135deg, #10b981, #047857)' },
    { name: 'Crimson', value: 'linear-gradient(135deg, #f43f5e, #be123c)' },
    { name: 'Amber', value: 'linear-gradient(135deg, #fbbf24, #b45309)' },
    { name: 'Ocean', value: 'linear-gradient(135deg, #0ea5e9, #0369a1)' },
  ];

  const currentLang = getLang();

  modal.innerHTML = `
    <div class="modal-header">
      <h2 class="font-bold text-lg">${t('profile.edit.title')}</h2>
      <button class="btn btn-ghost btn-icon btn-close">✕</button>
    </div>
    <form id="edit-profile-form" class="flex flex-col gap-4">
      <div>
        <label class="text-sm font-bold text-secondary mb-1 block">${t('profile.displayName')}</label>
        <input type="text" id="prof-display" class="input" value="${profile.display_name || ''}" required />
      </div>
      <div>
        <label class="text-sm font-bold text-secondary mb-1 block">${t('profile.bio')}</label>
        <textarea id="prof-bio" class="input" rows="3" placeholder="${t('profile.bioPlaceholder')}">${profile.bio || ''}</textarea>
      </div>
      <div class="flex gap-4">
        <div class="flex-1">
          <label class="text-sm font-bold text-secondary mb-1 block">${t('profile.themeColor')}</label>
          <select id="prof-theme" class="input">
            ${colors.map(c => `<option value="${c.value}" ${profile.theme_color === c.value ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="flex-1">
          <label class="text-sm font-bold text-secondary mb-1 block">${t('profile.language')}</label>
          <select id="prof-lang" class="input">
            <option value="en" ${currentLang === 'en' ? 'selected' : ''}>English</option>
            <option value="de" ${currentLang === 'de' ? 'selected' : ''}>Deutsch</option>
          </select>
        </div>
      </div>
      <button type="submit" class="btn btn-primary mt-2">${t('profile.save')}</button>
    </form>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => {
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.remove(), 200);
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  modal.querySelector('.btn-close').addEventListener('click', close);

  modal.querySelector('#edit-profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    
    try {
      const display = modal.querySelector('#prof-display').value;
      const bio = modal.querySelector('#prof-bio').value;
      const theme = modal.querySelector('#prof-theme').value;
      const lang = modal.querySelector('#prof-lang').value;
      
      setLang(lang);
      const newProfile = await updateProfile(display, bio, theme);
      applyTheme(newProfile.theme_color);
      showToast(t('profile.success'), 'success');
      close();
      if (onSave) onSave(newProfile);
    } catch (err) {
      showToast(t('profile.error'), 'error');
      btn.disabled = false;
    }
  });
}

let realtimeChannel = null;

/**
 * Render the main dashboard page.
 */
export async function renderDashboard() {
  const app = document.getElementById('app');
  const user = await getCurrentUser();
  const profile = await getMyProfile();

  if (!profile) return;

  applyTheme(profile.theme_color);

  app.innerHTML = '';

  // Header
  const header = renderHeader(profile, 0, () => {
    showEditProfileModal(profile, async (updatedProfile) => {
      // Re-render dashboard to reflect new profile details if needed
      await renderDashboard();
    });
  });
  app.appendChild(header);

  // Main layout
  const main = document.createElement('main');
  main.className = 'dashboard';
  main.innerHTML = `
    <div class="dashboard-tabs animate-in stagger-1">
      <button class="dashboard-tab active" data-tab="goals">${t('tab.goals')}</button>
      <button class="dashboard-tab" data-tab="feed">${t('tab.feed')}</button>
      <button class="dashboard-tab" data-tab="leaderboard">${t('tab.leaderboard')}</button>
      <button class="dashboard-tab" data-tab="friends">${t('tab.friends')}</button>
    </div>

    <div class="dashboard-content">
      <!-- Tab 1: Goals -->
      <div id="tab-goals" class="dashboard-tab-content">
        <section class="dashboard-section animate-in stagger-2">
          <div id="chart-container"></div>
        </section>

        <section class="dashboard-section animate-in stagger-3" style="margin-top: 3rem;">
          <div class="section-header">
            <h2 class="section-title">${t('goals.title')}</h2>
            <button id="btn-add-goal" class="btn btn-primary btn-sm">${t('goals.newBtn')}</button>
          </div>
          <div id="goals-container"></div>
        </section>
      </div>

      <!-- Tab 2: Feed -->
      <div id="tab-feed" class="dashboard-tab-content hidden">
        <section class="dashboard-section animate-in stagger-2">
          <div class="section-header">
            <h2 class="section-title">${t('feed.title')}</h2>
          </div>
          <div id="feed-container"></div>
        </section>
      </div>

      <!-- Tab 3: Leaderboard -->
      <div id="tab-leaderboard" class="dashboard-tab-content hidden">
        <section class="dashboard-section animate-in stagger-2">
          <div class="section-header">
            <h2 class="section-title">${t('leaderboard.title')}</h2>
          </div>
          <div id="leaderboard-container"></div>
        </section>
      </div>

      <!-- Tab 4: Friends -->
      <div id="tab-friends" class="dashboard-tab-content hidden">
        <aside class="dashboard-sidebar animate-in stagger-2" style="max-width: 600px; margin: 0 auto; width: 100%;">
          <div id="friend-panel-container"></div>
        </aside>
      </div>
    </div>
  `;
  app.appendChild(main);

  // Tab switching logic
  const tabs = main.querySelectorAll('.dashboard-tab');
  const tabContents = main.querySelectorAll('.dashboard-tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update buttons
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update content
      const targetId = `tab-${tab.dataset.tab}`;
      tabContents.forEach(content => {
        if (content.id === targetId) {
          content.classList.remove('hidden');
        } else {
          content.classList.add('hidden');
        }
      });
    });
  });

  const chartContainer = document.getElementById('chart-container');
  const goalsContainer = document.getElementById('goals-container');
  const feedContainer = document.getElementById('feed-container');
  const leaderboardContainer = document.getElementById('leaderboard-container');
  const friendPanelContainer = document.getElementById('friend-panel-container');

  // Load all data
  async function refreshAll() {
    try {
      const [goals, lbData, feedData] = await Promise.all([
        getMyGoals(), 
        getLeaderboardData(),
        getFeedData()
      ]);

      const activeGoals = goals.filter(g => !g.is_archived);
      const btnAddGoal = document.getElementById('btn-add-goal');
      if (btnAddGoal) {
        if (activeGoals.length >= 5) {
          btnAddGoal.disabled = true;
          btnAddGoal.title = window.t ? window.t('goal.limitReached') : 'You can only have up to 5 active goals.';
          btnAddGoal.style.opacity = '0.5';
          btnAddGoal.style.cursor = 'not-allowed';
        } else {
          btnAddGoal.disabled = false;
          btnAddGoal.title = '';
          btnAddGoal.style.opacity = '1';
          btnAddGoal.style.cursor = 'pointer';
        }
      }

      renderGoalCards(goalsContainer, goals, refreshAll);
      renderLeaderboard(leaderboardContainer, lbData, user.id);
      renderProgressChart(chartContainer, lbData, user.id);
      renderFeed(feedContainer, feedData, user, refreshAll);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }

  async function onFriendChange() {
    await refreshAll();
    const count = await refreshFriendData(onFriendChange);
    updateHeaderBadge(count);
  }

  // Initial load
  await Promise.all([
    refreshAll(),
    renderFriendPanel(friendPanelContainer, onFriendChange),
  ]);

  // Add goal button
  document.getElementById('btn-add-goal').addEventListener('click', () => {
    showCreateGoalModal(refreshAll);
  });

  // Realtime subscriptions for live updates
  realtimeChannel = supabase
    .channel('dashboard-updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, () => refreshAll())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'goal_logs' }, () => refreshAll())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'feed_posts' }, () => refreshAll())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'feed_likes' }, () => refreshAll())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'feed_comments' }, () => refreshAll())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => onFriendChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => onFriendChange())
    .subscribe();

  // Return cleanup function
  return () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  };
}
