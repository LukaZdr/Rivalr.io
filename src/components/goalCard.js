import { showToast } from './toast.js';
import { createGoal, logProgress, deleteGoal, updateGoalTarget, updateGoalLog, deleteGoalLog } from '../lib/api.js';
import { t } from '../lib/i18n.js';

/**
 * Render the goal cards section.
 * @param {HTMLElement} container
 * @param {Array} goals
 * @param {Function} onRefresh - callback to refresh data
 */
export function renderGoalCards(container, goals, onRefresh) {
  container.innerHTML = '';

  if (goals.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎯</div>
        <h3>${t('goals.empty.title')}</h3>
        <p>${t('goals.empty.desc')}</p>
      </div>
    `;
    return;
  }

  goals.forEach((goal, i) => {
    const progress = Math.min(goal.current / goal.target, 1);
    const percent = Math.round(progress * 100);
    const isComplete = percent >= 100;
    const kindLabel = goal.goal_kind === 'milestone' ? t('goal.milestone') : t('goal.cumulative');

    const card = document.createElement('div');
    card.className = `goal-card glass-card-sm animate-in stagger-${Math.min(i + 1, 5)}`;
    card.dataset.goalId = goal.id;

    card.innerHTML = `
      <div class="goal-card-header">
        <div class="goal-card-info">
          <h3 class="goal-card-title">${escapeHtml(goal.goal_type)}</h3>
          <div class="flex gap-2 items-center">
            <span class="badge ${goal.goal_kind === 'milestone' ? 'badge-primary' : 'badge-accent'}">${kindLabel}</span>
            <span class="goal-card-unit text-xs text-tertiary">${escapeHtml(goal.unit)}</span>
          </div>
        </div>
        <div class="goal-card-actions flex gap-1">
          ${isComplete ? `
          <button class="btn btn-ghost btn-sm btn-extend-goal-card text-xs text-primary" data-goal-id="${goal.id}" data-current-target="${goal.target}" title="${t('goal.extend')}">
            ${t('goal.extend')}
          </button>` : ''}
          <button class="btn btn-ghost btn-sm btn-edit-goal" data-goal-id="${goal.id}" title="Log progress">
            ➕
          </button>
          <button class="btn btn-ghost btn-sm btn-delete-goal" data-goal-id="${goal.id}" title="Delete goal">
            🗑️
          </button>
        </div>
      </div>

      <div class="goal-card-progress">
        <div class="goal-card-numbers">
          <span class="goal-current ${isComplete ? 'goal-complete' : ''}">${formatNum(goal.current)}</span>
          <span class="text-tertiary"> / ${formatNum(goal.target)} ${escapeHtml(goal.unit)}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-bar-fill ${isComplete ? 'progress-complete' : ''}" style="width: ${percent}%"></div>
        </div>
        <div class="goal-card-percent text-xs text-muted">${percent}%</div>
      </div>
    `;

    // Past milestones
    const milestoneLogs = (goal.goal_logs || []).filter(l => l.is_milestone).sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at));
    
    if (milestoneLogs.length > 0) {
      const msHtml = milestoneLogs.map(ms => {
        const d = new Date(ms.logged_at);
        const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const targetVal = ms.milestone_target ? formatNum(ms.milestone_target) : '?';
        return `<div class="text-xs text-tertiary flex items-center gap-1 mt-1"><span title="Milestone">🏆</span> <strong>${targetVal} ${escapeHtml(goal.unit)}</strong> Achieved on ${dateStr}</div>`;
      }).join('');

      card.innerHTML += `
        <div class="mt-4 pt-3" style="border-top: 1px solid var(--color-border);">
          <div class="text-xs font-bold text-secondary mb-2">${t('goal.pastMilestones')}</div>
          ${msHtml}
        </div>
      `;
    }

    // History section
    const logs = (goal.goal_logs || []).sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
    let historyHtml = '';
    if (logs.length > 0) {
      historyHtml = logs.map(l => {
        const d = new Date(l.logged_at);
        const dateStr = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        return `
          <div class="log-history-row flex justify-between items-center text-sm py-2 border-b border-white/5 last:border-0">
            <div>
              <div class="font-medium">${formatNum(l.value)} ${escapeHtml(goal.unit)}</div>
              <div class="text-xs text-tertiary">${dateStr}${l.note ? ` - <i>${escapeHtml(l.note)}</i>` : ''}</div>
            </div>
            <div class="flex gap-1">
              <button class="btn btn-ghost btn-xs btn-edit-log text-xs" data-log-id="${l.id}" data-goal-id="${goal.id}" title="${t('log.editTitle')}">✏️</button>
              <button class="btn btn-ghost btn-xs btn-delete-log text-xs" data-log-id="${l.id}" data-goal-id="${goal.id}" title="Delete">🗑️</button>
            </div>
          </div>
        `;
      }).join('');
    } else {
      historyHtml = `<div class="text-xs text-tertiary">${t('goal.history.empty')}</div>`;
    }

    card.innerHTML += `
      <div class="mt-4 pt-3" style="border-top: 1px solid var(--color-border);">
        <button class="btn btn-ghost btn-sm w-full text-xs text-secondary btn-toggle-history" data-goal-id="${goal.id}">
          ${t('goal.history.show')} ▼
        </button>
        <div class="log-history-container hidden mt-2" id="history-${goal.id}">
          ${historyHtml}
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  // Edit goal handlers
  container.querySelectorAll('.btn-edit-goal').forEach(btn => {
    btn.addEventListener('click', () => {
      const goalId = btn.dataset.goalId;
      const goal = goals.find(g => g.id === goalId);
      if (goal) showUpdateModal(goal, onRefresh);
    });
  });

  // Extend goal handlers
  container.querySelectorAll('.btn-extend-goal-card').forEach(btn => {
    btn.addEventListener('click', async () => {
      const goalId = btn.dataset.goalId;
      const currentTarget = btn.dataset.currentTarget;
      showExtendGoalModal(goalId, currentTarget, onRefresh);
    });
  });

  // Delete goal handlers
  container.querySelectorAll('.btn-delete-goal').forEach(btn => {
    btn.addEventListener('click', async () => {
      const goalId = btn.dataset.goalId;
      if (!confirm(t('goal.deleteConfirm'))) return;
      try {
        await deleteGoal(goalId);
        showToast(t('goal.deleted'), 'info');
        onRefresh();
      } catch (err) {
        showToast(t('goal.deleteError'), 'error');
      }
    });
  });

  // Toggle history handlers
  container.querySelectorAll('.btn-toggle-history').forEach(btn => {
    btn.addEventListener('click', () => {
      const goalId = btn.dataset.goalId;
      const historyDiv = container.querySelector(`#history-${goalId}`);
      if (historyDiv.classList.contains('hidden')) {
        historyDiv.classList.remove('hidden');
        btn.innerHTML = `${t('goal.history.hide')} ▲`;
      } else {
        historyDiv.classList.add('hidden');
        btn.innerHTML = `${t('goal.history.show')} ▼`;
      }
    });
  });

  // Edit log handlers
  container.querySelectorAll('.btn-edit-log').forEach(btn => {
    btn.addEventListener('click', () => {
      const logId = btn.dataset.logId;
      const goalId = btn.dataset.goalId;
      const goal = goals.find(g => g.id === goalId);
      const log = goal?.goal_logs.find(l => l.id === logId);
      if (goal && log) showEditLogModal(goal, log, onRefresh);
    });
  });

  // Delete log handlers
  container.querySelectorAll('.btn-delete-log').forEach(btn => {
    btn.addEventListener('click', async () => {
      const logId = btn.dataset.logId;
      const goalId = btn.dataset.goalId;
      if (!confirm(t('log.deleteConfirm'))) return;
      try {
        await deleteGoalLog(logId, goalId);
        showToast(t('log.deleted'), 'info');
        onRefresh();
      } catch (err) {
        showToast('Failed to delete log', 'error');
      }
    });
  });
}

/**
 * Show a modal to log progress on a goal.
 */
function showUpdateModal(goal, onRefresh) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'update-goal-modal';

  const isCumulative = goal.goal_kind === 'cumulative';
  const labelText = isCumulative ? t('log.amount') : t('log.attempt');
  const descText = isCumulative ? t('log.amountDesc') : t('log.attemptDesc');

  const todayStr = new Date().toISOString().split('T')[0];

  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>${t('log.title')}</h2>
        <button class="modal-close" id="close-update-modal">✕</button>
      </div>
      <p class="text-muted mb-4">${escapeHtml(goal.goal_type)} — Target: ${formatNum(goal.target)} ${escapeHtml(goal.unit)}</p>
      <form id="update-goal-form" class="flex flex-col gap-4">
        <div class="input-group">
          <label for="log-value">${labelText}</label>
          <input type="number" id="log-value" class="input" placeholder="e.g. 5" min="0" step="any" required />
          <p class="text-xs text-tertiary">${descText}</p>
        </div>
        <div class="input-group">
          <label for="log-date">${t('log.date')}</label>
          <input type="date" id="log-date" class="input" value="${todayStr}" max="${todayStr}" />
        </div>
        <div class="input-group">
          <label for="log-note">${t('log.note')}</label>
          <input type="text" id="log-note" class="input" placeholder="e.g. Morning run" maxlength="100" />
        </div>
        <button type="submit" class="btn btn-primary btn-lg w-full">${t('log.submit')}</button>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  // Close
  const close = () => overlay.remove();
  overlay.querySelector('#close-update-modal').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // Submit
  overlay.querySelector('#update-goal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const val = parseFloat(overlay.querySelector('#log-value').value);
    const dateVal = overlay.querySelector('#log-date').value;
    const note = overlay.querySelector('#log-note').value;
    try {
      await logProgress(goal, val, note, dateVal || null);
      showToast(t('log.success'), 'success');
      close();
      onRefresh();
    } catch (err) {
      showToast(t('log.error'), 'error');
    }
  });
}

/**
 * Show a modal to edit an existing log.
 */
function showEditLogModal(goal, log, onRefresh) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'edit-log-modal';

  const isCumulative = goal.goal_kind === 'cumulative';
  const labelText = isCumulative ? t('log.amount') : t('log.attempt');
  const descText = isCumulative ? t('log.amountDesc') : t('log.attemptDesc');

  const logDateStr = new Date(log.logged_at).toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];

  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>${t('log.editTitle')}</h2>
        <button class="modal-close" id="close-edit-modal">✕</button>
      </div>
      <p class="text-muted mb-4">${escapeHtml(goal.goal_type)}</p>
      <form id="edit-log-form" class="flex flex-col gap-4">
        <div class="input-group">
          <label for="edit-log-value">${labelText}</label>
          <input type="number" id="edit-log-value" class="input" value="${log.value}" min="0" step="any" required />
          <p class="text-xs text-tertiary">${descText}</p>
        </div>
        <div class="input-group">
          <label for="edit-log-date">${t('log.date')}</label>
          <input type="date" id="edit-log-date" class="input" value="${logDateStr}" max="${todayStr}" required />
        </div>
        <div class="input-group">
          <label for="edit-log-note">${t('log.note')}</label>
          <input type="text" id="edit-log-note" class="input" value="${escapeHtml(log.note || '')}" maxlength="100" />
        </div>
        <button type="submit" class="btn btn-primary btn-lg w-full">${t('log.save')}</button>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  // Close
  const close = () => overlay.remove();
  overlay.querySelector('#close-edit-modal').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // Submit
  overlay.querySelector('#edit-log-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const val = parseFloat(overlay.querySelector('#edit-log-value').value);
    const dateVal = overlay.querySelector('#edit-log-date').value;
    const note = overlay.querySelector('#edit-log-note').value;
    const submitBtn = overlay.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      await updateGoalLog(log.id, goal.id, val, note, dateVal);
      showToast(t('log.editSuccess'), 'success');
      close();
      onRefresh();
    } catch (err) {
      showToast(t('log.error'), 'error');
      submitBtn.disabled = false;
    }
  });
}

/**
 * Show the Create Goal modal.
 */
export function showCreateGoalModal(onRefresh) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'create-goal-modal';

  const presets = [
    { type: 'Lose Weight', unit: 'kg', icon: '⚖️' },
    { type: 'Pushups', unit: 'reps', icon: '💪' },
    { type: 'Running', unit: 'km', icon: '🏃' },
    { type: 'Pull-ups', unit: 'reps', icon: '🏋️' },
    { type: 'Swimming', unit: 'laps', icon: '🏊' },
    { type: 'Cycling', unit: 'km', icon: '🚴' },
  ];

  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>New Goal</h2>
        <button class="modal-close" id="close-create-modal">✕</button>
      </div>
      <div class="goal-presets">
        ${presetsHtml}
      </div>
      <form id="create-goal-form" class="flex flex-col gap-4 mt-4">
        <div class="input-group">
          <label for="goal-type">${t('createGoal.type')}</label>
          <input type="text" id="goal-type" class="input" placeholder="e.g. Running" required />
        </div>
        <div class="flex gap-4">
          <div class="input-group flex-2">
            <label for="goal-target">${t('createGoal.target')}</label>
            <input type="number" id="goal-target" class="input" placeholder="e.g. 50" min="0.1" step="any" required />
          </div>
          <div class="input-group flex-1">
            <label for="goal-unit">${t('createGoal.unit')}</label>
            <input type="text" id="goal-unit" class="input" placeholder="e.g. km" required />
          </div>
        </div>
        <div class="input-group">
          <label for="goal-kind">${t('createGoal.kind')}</label>
          <select id="goal-kind" class="input">
            <option value="cumulative">${t('createGoal.kind.cumulative')}</option>
            <option value="milestone">${t('createGoal.kind.milestone')}</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary btn-lg w-full mt-2">${t('createGoal.submit')}</button>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  const typeInput = overlay.querySelector('#goal-type');
  const targetInput = overlay.querySelector('#goal-target');
  const unitInput = overlay.querySelector('#goal-unit');
  const kindInput = overlay.querySelector('#goal-kind');

  // Close
  const close = () => overlay.remove();
  overlay.querySelector('#close-create-modal').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // Presets
  overlay.querySelectorAll('.goal-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      typeInput.value = btn.dataset.type;
      unitInput.value = btn.dataset.unit;
      targetInput.focus();
    });
  });

  // Submit
  overlay.querySelector('#create-goal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner"></span> ${t('createGoal.creating')}`;

    try {
      await createGoal(typeInput.value, targetInput.value, unitInput.value, kindInput.value);
      showToast(t('createGoal.success'), 'success');
      close();
      onRefresh();
    } catch (err) {
      showToast(err.message || t('createGoal.error'), 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = t('createGoal.submit');
    }
  });
}

function formatNum(n) {
  if (n === null || n === undefined) return '0';
  const num = parseFloat(n);
  if (Number.isInteger(num)) return num.toLocaleString();
  return num.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show a modal to extend a goal target.
 */
export function showExtendGoalModal(goalId, currentTarget, onRefresh) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'extend-goal-modal';

  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>${t('extend.title')}</h2>
        <button class="modal-close" id="close-extend-modal">✕</button>
      </div>
      <p class="text-muted mb-4">${t('extend.desc', formatNum(currentTarget))}</p>
      <form id="extend-goal-form" class="flex flex-col gap-4">
        <div class="input-group">
          <label for="extend-value">${t('extend.newTarget')}</label>
          <input type="number" id="extend-value" class="input" placeholder="e.g. ${Number(currentTarget) + 10}" min="${Number(currentTarget) + 0.1}" step="any" required />
          <p class="text-xs text-tertiary">${t('extend.mustBeGreater', formatNum(currentTarget))}</p>
        </div>
        <button type="submit" class="btn btn-primary btn-lg w-full">${t('extend.submit')}</button>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  // Close
  const close = () => {
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.remove(), 200);
  };
  
  overlay.querySelector('#close-extend-modal').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // Submit
  overlay.querySelector('#extend-goal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = overlay.querySelector('button[type="submit"]');
    btn.disabled = true;

    const newTarget = parseFloat(overlay.querySelector('#extend-value').value);
    
    if (newTarget > Number(currentTarget)) {
      try {
        await updateGoalTarget(goalId, newTarget);
        showToast(t('extend.success'), 'success');
        close();
        onRefresh();
      } catch (err) {
        showToast(t('extend.error'), 'error');
        btn.disabled = false;
      }
    } else {
      showToast(t('extend.mustBeGreater', formatNum(currentTarget)), 'error');
      btn.disabled = false;
    }
  });
}
