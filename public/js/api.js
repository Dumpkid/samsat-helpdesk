// Helper bersama untuk semua halaman: pemanggilan API, cek login, format, notifikasi.

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options,
  });
  if (response.status === 401 && !url.startsWith('/api/auth/login')) {
    window.location.href = '/login.html';
    throw new Error('Belum login');
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.errors = body.errors || {};
    throw error;
  }
  return body;
}

// Hindari XSS saat menyisipkan data ke HTML
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function statusBadge(status) {
  return `<span class="badge status-${escapeHtml(String(status).toLowerCase())}">${escapeHtml(status)}</span>`;
}

function prioritasText(prioritas) {
  return `<span class="prio-${escapeHtml(String(prioritas).toLowerCase())}">${escapeHtml(prioritas)}</span>`;
}

// "2026-10-30 09:15:00" -> "30 Okt 2026 09.15"
function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value.replace(' ', 'T')).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast align-items-center text-bg-${type} border-0`;
  el.innerHTML = `<div class="d-flex"><div class="toast-body">${escapeHtml(message)}</div>
    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
  container.appendChild(el);
  el.addEventListener('hidden.bs.toast', () => el.remove());
  new bootstrap.Toast(el, { delay: 3000 }).show();
}

// Dipanggil di setiap halaman yang butuh login: tampilkan nama user & aktifkan logout
async function initLayout() {
  const { user } = await api('/api/auth/me');
  document.getElementById('currentUser').textContent = `${user.full_name} (${user.role})`;
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await api('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
  });
  return user;
}
