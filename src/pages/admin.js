import { getMyProfile, fetchAdminData, getUserGoals } from '../lib/api.js';
import { renderHeader } from '../components/header.js';
import { renderGoalCards } from '../components/goalCard.js';
import { navigate } from '../lib/router.js';

export async function renderAdmin() {
  const app = document.getElementById('app');
  const profile = await getMyProfile();

  if (!profile || !profile.is_admin) {
    navigate('/dashboard');
    return;
  }

  app.innerHTML = '';

  // Render header
  const header = renderHeader(profile, 0, () => {
    navigate('/dashboard'); // just back to dashboard instead of edit modal for admin page
  });
  app.appendChild(header);

  // Main container
  const main = document.createElement('main');
  main.className = 'dashboard flex flex-col gap-8';
  main.style.maxWidth = '1000px';
  main.style.margin = '0 auto';
  main.style.padding = '2rem 1rem';

  // Loading state
  main.innerHTML = `
    <div class="flex justify-center items-center py-20">
      <div class="spinner"></div>
    </div>
  `;
  app.appendChild(main);

  try {
    const data = await fetchAdminData();
    const stats = data.stats;
    const users = data.users;

    let usersHtml = '';
    if (users.length === 0) {
      usersHtml = `<div class="text-tertiary text-sm py-4 text-center">No users found.</div>`;
    } else {
      usersHtml = users.map(u => {
        const d = new Date(u.created_at);
        const dateStr = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        return `
          <tr class="border-b border-white/5 hover:bg-white/5 transition cursor-pointer user-row" data-user-id="${u.id}" data-username="${u.username}">
            <td class="py-3 px-4 font-medium">${u.is_admin ? '👑 ' : ''}@${u.username}</td>
            <td class="py-3 px-4 text-secondary">${u.display_name || '-'}</td>
            <td class="py-3 px-4 text-secondary text-sm">${dateStr}</td>
            <td class="py-3 px-4 text-secondary text-right font-mono">${u.goal_count || 0}</td>
          </tr>
        `;
      }).join('');
    }

    main.innerHTML = `
      <div class="animate-in stagger-1">
        <h1 class="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p class="text-secondary mb-8">Platform overview and user directory.</p>

        <div class="grid gap-4 mb-8" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
          <div class="glass-card-sm flex flex-col items-center justify-center p-6 text-center">
            <div class="text-4xl mb-2">👥</div>
            <div class="text-3xl font-bold text-gradient">${stats.totalUsers}</div>
            <div class="text-sm text-tertiary uppercase tracking-wider font-bold mt-1">Total Users</div>
          </div>
          <div class="glass-card-sm flex flex-col items-center justify-center p-6 text-center">
            <div class="text-4xl mb-2">🎯</div>
            <div class="text-3xl font-bold text-gradient">${stats.totalGoals}</div>
            <div class="text-sm text-tertiary uppercase tracking-wider font-bold mt-1">Total Goals</div>
          </div>
          <div class="glass-card-sm flex flex-col items-center justify-center p-6 text-center">
            <div class="text-4xl mb-2">📈</div>
            <div class="text-3xl font-bold text-gradient">${stats.totalLogs}</div>
            <div class="text-sm text-tertiary uppercase tracking-wider font-bold mt-1">Total Activity Logs</div>
          </div>
        </div>

        <div class="glass-card-sm">
          <div class="p-4 border-b border-white/10">
            <h2 class="text-xl font-bold">User Directory</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm whitespace-nowrap">
              <thead class="text-xs text-tertiary uppercase bg-black/20">
                <tr>
                  <th class="py-3 px-4 font-bold">Username</th>
                  <th class="py-3 px-4 font-bold">Display Name</th>
                  <th class="py-3 px-4 font-bold">Joined</th>
                  <th class="py-3 px-4 font-bold text-right">Goals Created</th>
                </tr>
              </thead>
              <tbody>
                ${usersHtml}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
    `;

    // Add click handlers for user rows
    main.querySelectorAll('.user-row').forEach(row => {
      row.addEventListener('click', async () => {
        const userId = row.dataset.userId;
        const username = row.dataset.username;
        showUserGoalsModal(userId, username);
      });
    });

  } catch (err) {
    main.innerHTML = `
      <div class="glass-card-sm p-8 text-center text-error border-error/20">
        <div class="text-4xl mb-4">⚠️</div>
        <h2 class="text-xl font-bold mb-2">Access Denied</h2>
        <p class="text-sm opacity-80">${err.message || 'You do not have permission to view this data.'}</p>
        <button class="btn btn-primary mt-6" onclick="window.location.hash='#/dashboard'">Return to Dashboard</button>
      </div>
    `;
  }
}

async function showUserGoalsModal(userId, username) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'user-goals-modal';

  overlay.innerHTML = `
    <div class="modal" style="max-width: 800px; width: 90%;">
      <div class="modal-header">
        <h2>@${username}'s Goals</h2>
        <button class="modal-close" id="close-user-goals-modal">✕</button>
      </div>
      <div id="user-goals-container" class="mt-4 flex flex-col gap-4">
        <div class="spinner mx-auto my-4"></div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('#close-user-goals-modal').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const container = overlay.querySelector('#user-goals-container');

  const refreshGoals = async () => {
    try {
      const goals = await getUserGoals(userId);
      // We pass the global profile to renderGoalCards? Actually, renderGoalCards determines admin rights via API endpoints failing or succeeding,
      // but wait, renderGoalCards uses `currentUser`... no, `goalCard.js` does NOT use `currentUser`. It just renders what is passed to it.
      // And the API endpoints for edit/delete use RLS which we just updated.
      // So renderGoalCards will work exactly the same!
      renderGoalCards(container, goals, refreshGoals);
    } catch (err) {
      container.innerHTML = `<div class="text-error">Failed to load goals.</div>`;
    }
  };

  await refreshGoals();
}
