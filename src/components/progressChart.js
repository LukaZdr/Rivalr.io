/**
 * Interactive SVG Progress Chart for Rivalr.io
 */

import { t } from '../lib/i18n.js';

/**
 * Renders the progress chart.
 * @param {HTMLElement} container - The container element to render the chart into
 * @param {Array} leaderboardData - Array of goal objects with logs
 * @param {string} currentUserId - The current user's ID
 */
export function renderProgressChart(container, leaderboardData, currentUserId) {
  if (!leaderboardData || leaderboardData.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📈</div>
        <h3>${t('chart.empty.title')}</h3>
        <p>${t('chart.empty.desc')}</p>
      </div>
    `;
    return;
  }

  // Pre-process data
  const users = new Map();
  const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
  let colorIdx = 1;

  leaderboardData.forEach(goal => {
    const uid = goal.user_id;
    if (!users.has(uid)) {
      const isSelf = uid === currentUserId;
      users.set(uid, {
        id: uid,
        displayName: goal.profiles?.display_name || goal.profiles?.username || 'Unknown',
        isSelf: isSelf,
        color: isSelf ? colors[0] : colors[colorIdx++ % colors.length],
        visible: true, // For toggling
        logs: [],
        goals: []
      });
    }
    const user = users.get(uid);
    user.goals.push(goal);
    
    if (goal.goal_logs && goal.goal_logs.length > 0) {
       // calculate cumulative sum for cumulative goals
       let runningTotal = 0;
       const sortedLogs = [...goal.goal_logs].sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at));
       
       sortedLogs.forEach(log => {
          let currentProgress = 0;
          const start = goal.start_value || 0;
          const targetDiff = goal.target - start;

          if (goal.goal_kind === 'cumulative') {
             runningTotal += log.value;
             const currentDiff = runningTotal - start;
             currentProgress = targetDiff > 0 ? Math.min(Math.max((currentDiff / targetDiff) * 100, 0), 100) : (runningTotal >= goal.target ? 100 : 0);
          } else {
             const currentDiff = log.value - start;
             currentProgress = targetDiff > 0 ? Math.min(Math.max((currentDiff / targetDiff) * 100, 0), 100) : (log.value >= goal.target ? 100 : 0);
          }
          
          user.logs.push({
            date: new Date(log.logged_at),
            progress: currentProgress,
            rawDate: log.logged_at,
            value: log.value,
            goalType: goal.goal_type,
            goalKind: goal.goal_kind,
            target: goal.target,
            unit: goal.unit,
            currentDisplayValue: goal.goal_kind === 'cumulative' ? runningTotal : log.value,
            goalId: goal.id,
            isMilestone: log.is_milestone
          });
       });
    }
  });

  const usersArray = Array.from(users.values());
  
  let currentTimeRange = 'month';

  const drawChart = () => {
    container.innerHTML = '';
    
    // Calculate date threshold
    const now = new Date();
    let minRangeDate = new Date(0); // all time
    
    if (currentTimeRange === 'year') {
      minRangeDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    } else if (currentTimeRange === 'month') {
      minRangeDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else if (currentTimeRange === 'week') {
      minRangeDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (currentTimeRange === 'today') {
      minRangeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    // Filter logs and find new min/max dates
    let minDate = new Date();
    let maxDate = new Date();
    let hasFilteredLogs = false;

    const filteredUsers = usersArray.map(u => {
      const mappedLogs = u.logs.map(l => {
        let newDate = l.date;
        if (currentTimeRange !== 'today') {
          newDate = new Date(l.date.getFullYear(), l.date.getMonth(), l.date.getDate());
        }
        return { ...l, date: newDate };
      });
      const fLogs = mappedLogs.filter(l => l.date >= minRangeDate);
      fLogs.forEach(l => {
        if (!hasFilteredLogs || l.date < minDate) minDate = l.date;
        if (!hasFilteredLogs || l.date > maxDate) maxDate = l.date;
        hasFilteredLogs = true;
      });
      return { ...u, logs: fLogs };
    });

    if (!hasFilteredLogs) {
      minDate = minRangeDate.getTime() === 0 ? new Date(now.getTime() - 86400000) : minRangeDate;
      maxDate = now;
    }

    const timePadding = (maxDate - minDate) * 0.05 || 86400000;
    minDate = new Date(minDate.getTime() - timePadding);
    maxDate = new Date(maxDate.getTime() + timePadding);

    // Header & Legend
    const header = document.createElement('div');
    header.className = 'chart-header mb-4';
    
    const titleRow = document.createElement('div');
    titleRow.className = 'flex justify-between items-center mb-2';
    titleRow.innerHTML = `
      <h3 class="font-bold">${t('chart.title')}</h3>
      <select id="chart-time-range" class="input input-sm" style="width: auto; padding: 4px 8px; font-size: 12px;">
        <option value="all" ${currentTimeRange === 'all' ? 'selected' : ''}>${t('chart.filter.all')}</option>
        <option value="year" ${currentTimeRange === 'year' ? 'selected' : ''}>${t('chart.filter.year')}</option>
        <option value="month" ${currentTimeRange === 'month' ? 'selected' : ''}>${t('chart.filter.month')}</option>
        <option value="week" ${currentTimeRange === 'week' ? 'selected' : ''}>${t('chart.filter.week')}</option>
        <option value="today" ${currentTimeRange === 'today' ? 'selected' : ''}>${t('chart.filter.today')}</option>
      </select>
    `;
    header.appendChild(titleRow);
    
    const legend = document.createElement('div');
    legend.className = 'chart-legend flex flex-wrap gap-2';
    
    filteredUsers.forEach(u => {
       const pill = document.createElement('button');
       pill.className = `chart-legend-pill ${u.visible ? '' : 'inactive'}`;
       pill.innerHTML = `
         <span class="legend-color" style="background-color: ${u.color}"></span>
         ${u.displayName} ${u.isSelf ? '(You)' : ''}
       `;
       pill.onclick = () => {
         const originalUser = usersArray.find(ou => ou.id === u.id);
         if (originalUser) originalUser.visible = !originalUser.visible;
         drawChart();
       };
       legend.appendChild(pill);
    });
    header.appendChild(legend);
    container.appendChild(header);

    // Attach range select listener
    const rangeSelect = container.querySelector('#chart-time-range');
    if (rangeSelect) {
      rangeSelect.addEventListener('change', (e) => {
        currentTimeRange = e.target.value;
        drawChart();
      });
    }

    // Chart Area
    const chartWrapper = document.createElement('div');
    chartWrapper.className = 'chart-wrapper';
    
    // Viewport and sizing
    const width = 800;
    const height = 300;
    const padding = { top: 20, right: 80, bottom: 30, left: 40 };
    
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    
    // Scale functions
    const scaleX = (date) => {
      return padding.left + ((date - minDate) / (maxDate - minDate)) * innerWidth;
    };
    
    const scaleY = (progress) => {
      // progress is 0-100
      return height - padding.bottom - (progress / 100) * innerHeight;
    };

    let svgHtml = `<svg viewBox="0 0 ${width} ${height}" class="progress-svg" preserveAspectRatio="xMidYMid meet">`;
    
    // Grid lines & labels (Y axis)
    [0, 25, 50, 75, 100].forEach(tick => {
      const y = scaleY(tick);
      svgHtml += `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" class="chart-grid-line" />
        <text x="${padding.left - 10}" y="${y + 4}" class="chart-axis-text" text-anchor="end">${tick}%</text>
      `;
    });

    // Grid labels (X axis)
    const numTicks = 5;
    for (let i = 0; i < numTicks; i++) {
      const t = i / (numTicks - 1);
      const tickDate = new Date(minDate.getTime() + (maxDate.getTime() - minDate.getTime()) * t);
      const x = scaleX(tickDate);
      const dateStr = currentTimeRange === 'today'
        ? tickDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        : tickDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      svgHtml += `
        <text x="${x}" y="${height - padding.bottom + 20}" class="chart-axis-text" text-anchor="middle">${dateStr}</text>
      `;
    }

    let tooltipsHtml = '';

    // Draw lines
    filteredUsers.forEach(u => {
      if (!u.visible || u.logs.length === 0) return;
      
      // Group logs by goal
      const logsByGoal = {};
      u.logs.forEach(l => {
        if (!logsByGoal[l.goalId]) logsByGoal[l.goalId] = [];
        logsByGoal[l.goalId].push(l);
      });

      Object.values(logsByGoal).forEach(goalLogs => {
        // Sort logs by date just in case
        const sortedLogs = goalLogs.sort((a, b) => a.date - b.date);
        
        // Build path data
        let pathD = `M ${scaleX(sortedLogs[0].date)} ${scaleY(sortedLogs[0].progress)}`;
        for (let i = 1; i < sortedLogs.length; i++) {
          pathD += ` L ${scaleX(sortedLogs[i].date)} ${scaleY(sortedLogs[i].progress)}`;
        }
        
        // Draw path
        svgHtml += `<path d="${pathD}" stroke="${u.color}" stroke-width="3" fill="none" class="chart-line animate-in" stroke-linecap="round" stroke-linejoin="round"/>`;
        
        // Draw points & tooltips
        sortedLogs.forEach((log, i) => {
          const cx = scaleX(log.date);
          const cy = scaleY(log.progress);
          const isLast = i === sortedLogs.length - 1;
          
          // Point
          if (log.isMilestone) {
            svgHtml += `<text x="${cx}" y="${cy + 5}" font-size="14" text-anchor="middle" class="chart-point" style="cursor:pointer;">🏆</text>`;
          } else {
            svgHtml += `<circle cx="${cx}" cy="${cy}" r="4" fill="${u.color}" stroke="var(--color-bg-secondary)" stroke-width="2" class="chart-point" />`;
          }
          
          // Tooltip target (invisible, larger hover area)
          svgHtml += `<circle cx="${cx}" cy="${cy}" r="15" fill="transparent" class="chart-hover-target" data-info="${esc(u.displayName)}|${esc(log.goalType)}|${log.currentDisplayValue}|${log.target}|${esc(log.unit)}|${log.date.toLocaleDateString()}" />`;
          
          // End point label
          if (isLast) {
            svgHtml += `
              <text x="${cx + 10}" y="${cy + 4}" fill="${u.color}" class="chart-end-label font-bold" font-size="12">
                ${formatNum(log.currentDisplayValue)}
              </text>
            `;
          }
        });
      });
    });

    svgHtml += `</svg>`;
    
    // Tooltip Element
    const tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    tooltip.style.opacity = '0';
    
    chartWrapper.innerHTML = svgHtml;
    chartWrapper.appendChild(tooltip);
    container.appendChild(chartWrapper);
    
    // Tooltip interactions
    const svg = chartWrapper.querySelector('svg');
    const hoverTargets = chartWrapper.querySelectorAll('.chart-hover-target');
    
    hoverTargets.forEach(target => {
      target.addEventListener('mouseenter', (e) => {
        const [name, goalType, val, tval, unit, dateStr] = target.dataset.info.split('|');
        const cx = parseFloat(target.getAttribute('cx'));
        const cy = parseFloat(target.getAttribute('cy'));
        
        tooltip.innerHTML = `
          <div class="font-bold text-sm mb-1">${name}</div>
          <div class="text-xs text-secondary">${goalType}</div>
          <div class="text-xs text-primary font-bold">${formatNum(val)} / ${formatNum(tval)} ${unit}</div>
          <div class="text-xs text-tertiary mt-1">${dateStr}</div>
        `;
        
        // Position tooltip
        const svgRect = svg.getBoundingClientRect();
        const wrapperRect = chartWrapper.getBoundingClientRect();
        
        // viewBox to pixel conversion roughly
        const ratioX = svgRect.width / width;
        const ratioY = svgRect.height / height;
        
        const px = cx * ratioX;
        const py = cy * ratioY;
        
        tooltip.style.left = `${px}px`;
        tooltip.style.top = `${py - 10}px`;
        tooltip.style.transform = 'translate(-50%, -100%)';
        tooltip.style.opacity = '1';
      });
      
      target.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
      });
    });
  };

  drawChart();
}

function formatNum(n) {
  if (n === null || n === undefined) return '0';
  const num = parseFloat(n);
  if (Number.isInteger(num)) return num.toLocaleString();
  return num.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function esc(t) {
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}
