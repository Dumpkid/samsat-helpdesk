// Halaman login
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loginBtn = document.getElementById('loginBtn');

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.classList.add('d-none');
  loginBtn.disabled = true;
  try {
    await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value,
      }),
    });
    window.location.href = '/';
  } catch (err) {
    loginError.textContent = err.message;
    loginError.classList.remove('d-none');
  } finally {
    loginBtn.disabled = false;
  }
});
