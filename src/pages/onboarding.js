import { createProfile, checkUsernameAvailable } from '../lib/api.js';
import { navigate } from '../lib/router.js';
import { showToast } from '../components/toast.js';

let debounceTimer = null;

/**
 * Render the onboarding / username selection page.
 */
export function renderOnboarding() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="onboarding-page">
      <div class="onboarding-container animate-in">
        <div class="onboarding-card glass-card">
          <div class="login-logo">
            <span class="login-logo-text text-gradient">R</span>
          </div>

          <h1 class="onboarding-title">Choose your identity</h1>
          <p class="text-muted text-center mb-6">Pick a unique username. Friends will use it to find you.</p>

          <form id="onboarding-form" class="flex flex-col gap-4">
            <div class="input-group">
              <label for="onboarding-username">Username</label>
              <div class="username-input-wrapper">
                <span class="username-prefix">@</span>
                <input
                  type="text"
                  id="onboarding-username"
                  class="input username-input"
                  placeholder="yourname"
                  maxlength="24"
                  pattern="[a-zA-Z0-9_]+"
                  autocomplete="off"
                  required
                />
              </div>
              <div id="username-status" class="username-status"></div>
            </div>

            <div class="input-group">
              <label for="onboarding-displayname">Display Name</label>
              <input
                type="text"
                id="onboarding-displayname"
                class="input"
                placeholder="How friends will see you"
                maxlength="40"
                required
              />
            </div>

            <button type="submit" id="onboarding-submit" class="btn btn-primary btn-lg w-full mt-4" disabled>
              Let's go →
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  const usernameInput = document.getElementById('onboarding-username');
  const displayNameInput = document.getElementById('onboarding-displayname');
  const submitBtn = document.getElementById('onboarding-submit');
  const statusEl = document.getElementById('username-status');
  const form = document.getElementById('onboarding-form');

  let usernameAvailable = false;

  // Real-time username availability check
  usernameInput.addEventListener('input', () => {
    const val = usernameInput.value.trim().replace(/[^a-zA-Z0-9_]/g, '');
    usernameInput.value = val;

    usernameAvailable = false;
    submitBtn.disabled = true;

    if (val.length < 3) {
      statusEl.innerHTML = val.length > 0
        ? '<span class="text-tertiary text-xs">Minimum 3 characters</span>'
        : '';
      return;
    }

    statusEl.innerHTML = '<span class="text-tertiary text-xs">Checking...</span>';

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(val);
        if (usernameInput.value.trim() !== val) return; // stale
        if (available) {
          statusEl.innerHTML = '<span class="username-available text-xs">✓ Available</span>';
          usernameAvailable = true;
          if (displayNameInput.value.trim().length > 0) submitBtn.disabled = false;
        } else {
          statusEl.innerHTML = '<span class="username-taken text-xs">✕ Already taken</span>';
          usernameAvailable = false;
          submitBtn.disabled = true;
        }
      } catch {
        statusEl.innerHTML = '<span class="text-tertiary text-xs">Could not check</span>';
      }
    }, 400);
  });

  displayNameInput.addEventListener('input', () => {
    submitBtn.disabled = !(usernameAvailable && displayNameInput.value.trim().length > 0);
  });

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!usernameAvailable) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Creating...';

    try {
      await createProfile(usernameInput.value, displayNameInput.value);
      showToast('Profile created! Welcome to Rivalr.io', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message || 'Failed to create profile', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = "Let's go →";
    }
  });
}
