import './styles/index.css';
import './styles/pages.css';
import './styles/chart.css';
import './styles/feed.css';
import { route, setAuthGuard, initRouter, refreshRoute } from './lib/router.js';
import { getSession, onAuthStateChange } from './lib/auth.js';
import { getMyProfile } from './lib/api.js';
import { renderLogin } from './pages/login.js';
import { renderOnboarding } from './pages/onboarding.js';
import { renderDashboard } from './pages/dashboard.js';

// Register routes
route('/login', () => {
  renderLogin();
});

route('/onboarding', () => {
  renderOnboarding();
});

route('/dashboard', async () => {
  return await renderDashboard();
});

// Auth guard
setAuthGuard(async () => {
  try {
    const session = await getSession();
    if (!session) return { authenticated: false, hasProfile: false };

    const profile = await getMyProfile();
    return {
      authenticated: true,
      hasProfile: !!profile,
    };
  } catch {
    return { authenticated: false, hasProfile: false };
  }
});

// Listen for auth state changes
onAuthStateChange((event) => {
  if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
    refreshRoute();
  }
});

// Initialize
initRouter();
