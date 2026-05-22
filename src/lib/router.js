/**
 * Hash-based SPA Router for Rivalr.io
 * Routes: #/login, #/onboarding, #/dashboard
 */

const routes = {};
let currentCleanup = null;
let authGuardFn = null;

/**
 * Register a route.
 * @param {string} path - Hash path, e.g. '/login'
 * @param {Function} handler - async (params) => cleanupFn | void
 */
export function route(path, handler) {
  routes[path] = handler;
}

/**
 * Set the auth guard function.
 * Should return { authenticated: boolean, hasProfile: boolean }
 */
export function setAuthGuard(fn) {
  authGuardFn = fn;
}

/**
 * Navigate to a hash route.
 */
export function navigate(path) {
  window.location.hash = '#' + path;
}

/**
 * Get the current path from hash.
 */
function getCurrentPath() {
  const hash = window.location.hash.slice(1) || '/login';
  return hash;
}

let currentNavigationId = 0;

/**
 * Resolve the current route, applying auth guards.
 */
async function resolveRoute() {
  const navId = ++currentNavigationId;

  // Clean up previous page
  if (currentCleanup && typeof currentCleanup === 'function') {
    currentCleanup();
    currentCleanup = null;
  }

  let path = getCurrentPath();

  // Auth guard
  if (authGuardFn) {
    const guard = await authGuardFn();
    
    // Check if this navigation was superseded
    if (navId !== currentNavigationId) return;

    if (!guard.authenticated && path !== '/login') {
      navigate('/login');
      return;
    }

    if (guard.authenticated && path === '/login') {
      navigate(guard.hasProfile ? '/dashboard' : '/onboarding');
      return;
    }

    if (guard.authenticated && !guard.hasProfile && path === '/dashboard') {
      navigate('/onboarding');
      return;
    }

    if (guard.authenticated && guard.hasProfile && path === '/onboarding') {
      navigate('/dashboard');
      return;
    }
  }

  const handler = routes[path];
  if (handler) {
    const cleanup = await handler();
    
    // If navigation was superseded during handler setup, clean up immediately
    if (navId !== currentNavigationId) {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
      return;
    }
    currentCleanup = cleanup;
  } else {
    // 404 — fallback to login
    navigate('/login');
  }
}

/**
 * Initialize the router. Call once on app start.
 */
export function initRouter() {
  window.addEventListener('hashchange', resolveRoute);
  resolveRoute();
}

/**
 * Force re-evaluate current route (e.g. after auth change).
 */
export function refreshRoute() {
  resolveRoute();
}
