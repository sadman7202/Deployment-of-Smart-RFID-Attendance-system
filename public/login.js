const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const message = document.getElementById('message');

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  message.textContent = 'Signing in...';

  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: usernameInput.value,
        password: passwordInput.value,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || `Login failed with status ${response.status}`);
    }

    message.textContent = 'Login successful. Redirecting...';
    window.location.href = '/dashboard';
  } catch (error) {
    message.textContent = error.message;
  }
});