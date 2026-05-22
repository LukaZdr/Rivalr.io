import { signInWithGoogle } from '../lib/auth.js';
import { t } from '../lib/i18n.js';

/**
 * Render the login page.
 */
export function renderLogin() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="login-page">
      <div class="login-bg-orb login-bg-orb-1"></div>
      <div class="login-bg-orb login-bg-orb-2"></div>
      <div class="login-bg-orb login-bg-orb-3"></div>

      <div class="login-container animate-in">
        <div class="login-card glass-card">
          <div class="login-logo">
            <span class="login-logo-text text-gradient">R</span>
          </div>

          <h1 class="login-title">${t('login.title')}</h1>
          <p class="login-subtitle">${t('login.subtitle')}</p>

          <div class="login-features">
            <div class="login-feature">
              <span class="login-feature-icon">🎯</span>
              <span>Set personal fitness goals</span>
            </div>
            <div class="login-feature">
              <span class="login-feature-icon">👥</span>
              <span>Compete with friends only</span>
            </div>
            <div class="login-feature">
              <span class="login-feature-icon">📊</span>
              <span>Track progress together</span>
            </div>
          </div>

          <button id="btn-google-signin" class="btn btn-primary btn-lg w-full login-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <form id="email-login-form" class="mt-4 flex flex-col gap-2">
            <input type="email" id="login-email" class="input" placeholder="${t('login.email')}" required />
            <input type="password" id="login-password" class="input" placeholder="${t('login.password')}" required />
            <div class="flex gap-2 mt-2">
              <button type="submit" class="btn btn-primary flex-1" id="btn-email-signin">${t('login.signin')}</button>
              <button type="button" class="btn btn-ghost flex-1" id="btn-email-signup">${t('login.signup')}</button>
            </div>
            <div id="login-error" class="text-error text-sm hidden mt-2"></div>
          </form>

          <p class="login-footer text-xs text-tertiary text-center mt-6">
            Progress is personal. Motivation is social. Visibility is earned.
          </p>
        </div>
      </div>
    </div>
  `;

  // Bind Google sign-in button
  document.getElementById('btn-google-signin').addEventListener('click', async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google Sign in failed:', err);
    }
  });

  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const errorDiv = document.getElementById('login-error');

  const showError = (msg) => {
    errorDiv.textContent = msg;
    errorDiv.classList.remove('hidden');
  };

  document.getElementById('email-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.classList.add('hidden');
    try {
      await import('../lib/auth.js').then(m => m.signInWithEmail(emailInput.value, passwordInput.value));
    } catch (err) {
      showError(err.message || t('login.error'));
    }
  });

  document.getElementById('btn-email-signup').addEventListener('click', async () => {
    errorDiv.classList.add('hidden');
    if (!emailInput.value || !passwordInput.value) {
      showError('Please enter email and password');
      return;
    }
    try {
      await import('../lib/auth.js').then(m => m.signUpWithEmail(emailInput.value, passwordInput.value));
      showError('Check your email or sign in directly if auto-confirmed!');
    } catch (err) {
      showError(err.message || 'Failed to sign up');
    }
  });
}
