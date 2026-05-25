/**
 * Leaderboard component for Rivalr.io
 */
import { t } from '../lib/i18n.js';

export function renderLeaderboard(container, leaderboardData, currentUserId) {
  const userMap = new Map();

  leaderboardData.forEach(goal => {
    const uid = goal.user_id;
    if (!userMap.has(uid)) {
      userMap.set(uid, {
        userId: uid,
        username: goal.profiles?.username || 'unknown',
        displayName: goal.profiles?.display_name || 'Unknown',
        avatarUrl: goal.profiles?.avatar_url || null,
        goals: [],
        totalProgress: 0,
        totalGoals: 0,
      });
    }
    const entry = userMap.get(uid);
    const start = goal.start_value || 0;
    const targetDiff = goal.target - start;
    const currentDiff = goal.current - start;
    const progress = targetDiff > 0 ? Math.min(Math.max(currentDiff / targetDiff, 0), 1) : (goal.current >= goal.target ? 1 : 0);
    entry.goals.push({ ...goal, progress });
    entry.totalProgress += progress;
    entry.totalGoals += 1;
  });

  const ranked = Array.from(userMap.values())
    .map(u => ({ ...u, avgProgress: u.totalGoals > 0 ? u.totalProgress / u.totalGoals : 0 }))
    .sort((a, b) => b.avgProgress - a.avgProgress);

  container.innerHTML = '';

  if (ranked.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🏆</div>
        <h3>${t('leaderboard.empty.title')}</h3>
        <p>${t('leaderboard.empty.desc')}</p>
      </div>
    `;
    return;
  }

  const list = document.createElement('div');
  list.className = 'leaderboard-list';

  ranked.forEach((user, index) => {
    const rank = index + 1;
    const percent = Math.round(user.avgProgress * 100);
    const isSelf = user.userId === currentUserId;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';

    const avatarHtml = user.avatarUrl
      ? `<img src="${user.avatarUrl}" alt="" class="avatar avatar-sm" referrerpolicy="no-referrer" />`
      : `<div class="avatar avatar-sm avatar-placeholder">${(user.displayName || '?')[0].toUpperCase()}</div>`;

    const topGoal = user.goals.sort((a, b) => b.progress - a.progress)[0];
    const goalLabel = topGoal ? `${esc(topGoal.goal_type)}: ${fmt(topGoal.current)}/${fmt(topGoal.target)} ${esc(topGoal.unit)}` : '';

    const row = document.createElement('div');
    row.className = `leaderboard-row glass-card-sm animate-in stagger-${Math.min(index + 1, 5)} ${isSelf ? 'leaderboard-self' : ''}`;
    row.innerHTML = `
      <div class="leaderboard-rank"><span class="rank-number ${rank <= 3 ? 'rank-top' : ''}">${medal || rank}</span></div>
      <div class="leaderboard-user">
        ${avatarHtml}
        <div class="leaderboard-user-info">
          <span class="leaderboard-name font-semibold ${isSelf ? 'text-gradient' : ''}">${esc(user.displayName)} ${isSelf ? '(You)' : ''}</span>
          <span class="text-xs text-tertiary">@${esc(user.username)}${goalLabel ? ' · ' + goalLabel : ''}</span>
        </div>
      </div>
      <div class="leaderboard-progress">
        <span class="leaderboard-percent font-bold ${percent >= 100 ? 'goal-complete' : ''}">${percent}%</span>
        <div class="progress-bar progress-bar-sm"><div class="progress-bar-fill ${percent >= 100 ? 'progress-complete' : ''}" style="width: ${percent}%"></div></div>
      </div>
    `;
    list.appendChild(row);
  });

  container.appendChild(list);
}

function fmt(n) {
  const num = parseFloat(n || 0);
  return Number.isInteger(num) ? num.toLocaleString() : num.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function esc(t) {
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}
