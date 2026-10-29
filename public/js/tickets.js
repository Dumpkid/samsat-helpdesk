// Halaman tiket: daftar + pencarian + filter status + paginasi, lapor gangguan, detail & tindak lanjut admin
const state = { page: 1, limit: 10, q: '', status: '', user: null, current: null };

const tableBody = document.getElementById('ticketTable');
const ticketForm = document.getElementById('ticketForm');
const statusForm = document.getElementById('statusForm');
const formModal = new bootstrap.Modal(document.getElementById('formModal'));
const detailModal = new bootstrap.Modal(document.getElementById('detailModal'));
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

// Alur status yang boleh dipilih (sama dengan aturan di server)
const NEXT_STATUS = { Baru: ['Baru', 'Diproses', 'Selesai'], Diproses: ['Diproses', 'Selesai'], Selesai: ['Selesai'] };

function fillSelect(select, items, toLabel = (i) => i, toValue = (i) => i) {
  select.insertAdjacentHTML('beforeend', items
    .map((i) => `<option value="${escapeHtml(toValue(i))}">${escapeHtml(toLabel(i))}</option>`).join(''));
}

function renderRows(rows) {
  if (!rows.length) {
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">Tidak ada tiket</td></tr>';
    return;
  }
  tableBody.innerHTML = rows.map((t) => `
    <tr>
      <td class="ticket-code">${escapeHtml(t.kode)}</td>
      <td>${escapeHtml(t.judul)}</td>
      <td>${escapeHtml(t.nama_lokasi)}</td>
      <td>${escapeHtml(t.kategori)}</td>
      <td>${prioritasText(t.prioritas)}</td>
      <td>${statusBadge(t.status)}</td>
      <td class="text-nowrap">${formatDateTime(t.created_at)}</td>
      <td class="text-end"><button class="btn btn-sm btn-outline-primary" data-id="${t.id}"><i class="bi bi-eye"></i> Detail</button></td>
    </tr>`).join('');
}

function renderPagination({ page, totalPages, total, limit }) {
  const from = total ? (page - 1) * limit + 1 : 0;
  document.getElementById('pageInfo').textContent = `Menampilkan ${from}-${Math.min(page * limit, total)} dari ${total} tiket`;
  const item = (label, target, disabled, active) => `<li class="page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}">
    <a class="page-link" href="#" data-page="${target}">${label}</a></li>`;
  let html = item('&laquo;', page - 1, page === 1, false);
  for (let p = 1; p <= totalPages; p += 1) html += item(p, p, false, p === page);
  html += item('&raquo;', page + 1, page === totalPages, false);
  document.getElementById('pagination').innerHTML = html;
}

async function loadTickets() {
  try {
    const params = new URLSearchParams({ q: state.q, status: state.status, page: state.page, limit: state.limit });
    const result = await api(`/api/tickets?${params}`);
    renderRows(result.data);
    renderPagination(result.pagination);
  } catch (err) {
    if (err.message !== 'Belum login') showToast(err.message, 'danger');
  }
}

// ----- Error per field -----
function clearErrors(form) {
  form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
}

function showErrors(form, errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const input = form.elements[field];
    if (!input) return;
    input.classList.add('is-invalid');
    input.nextElementSibling.textContent = message;
  });
}

// ----- Lapor gangguan -----
function openForm() {
  ticketForm.reset();
  clearErrors(ticketForm);
  ticketForm.elements.pelapor.value = state.user.full_name;
  formModal.show();
}

ticketForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors(ticketForm);
  try {
    const { data } = await api('/api/tickets', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(ticketForm))) });
    formModal.hide();
    showToast(`Laporan terkirim dengan kode ${data.kode}`);
    loadTickets();
  } catch (err) {
    if (err.status === 422) showErrors(ticketForm, err.errors);
    else showToast(err.message, 'danger');
  }
});

// ----- Detail & tindak lanjut -----
function row(label, value) {
  return `<tr><th class="text-muted fw-normal" style="width:30%">${label}</th><td>${value}</td></tr>`;
}

async function openDetail(id) {
  try {
    const { data: t } = await api(`/api/tickets/${id}`);
    state.current = t;
    document.getElementById('detailTitle').textContent = `${t.kode} — ${t.judul}`;
    document.getElementById('detailBody').innerHTML = [
      row('Status', statusBadge(t.status)),
      row('Lokasi', `${escapeHtml(t.kode_lokasi)} — ${escapeHtml(t.nama_lokasi)}`),
      row('Kategori / Prioritas', `${escapeHtml(t.kategori)} / ${prioritasText(t.prioritas)}`),
      row('Pelapor', escapeHtml(t.pelapor)),
      row('Deskripsi', escapeHtml(t.deskripsi) || '-'),
      row('Dilaporkan', formatDateTime(t.created_at)),
      row('Selesai', t.resolved_at ? `${formatDateTime(t.resolved_at)} (${t.lama_jam} jam)` : '-'),
      row('Catatan Penanganan', escapeHtml(t.catatan) || '-'),
    ].join('');

    statusForm.classList.toggle('d-none', state.user.role !== 'admin');
    if (state.user.role === 'admin') {
      clearErrors(statusForm);
      const select = document.getElementById('statusSelect');
      select.innerHTML = '';
      fillSelect(select, NEXT_STATUS[t.status]);
      select.value = t.status;
      document.getElementById('catatanInput').value = t.catatan || '';
    }
    detailModal.show();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

statusForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors(statusForm);
  try {
    await api(`/api/tickets/${state.current.id}/status`, { method: 'PATCH', body: JSON.stringify(Object.fromEntries(new FormData(statusForm))) });
    detailModal.hide();
    showToast('Status tiket diperbarui');
    loadTickets();
  } catch (err) {
    if (err.status === 422) showErrors(statusForm, err.errors);
    else showToast(err.message, 'danger');
  }
});

document.getElementById('deleteBtn').addEventListener('click', () => {
  document.getElementById('deleteName').textContent = state.current.kode;
  detailModal.hide();
  deleteModal.show();
});

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
  try {
    await api(`/api/tickets/${state.current.id}`, { method: 'DELETE' });
    deleteModal.hide();
    showToast('Tiket berhasil dihapus');
    loadTickets();
  } catch (err) {
    showToast(err.message, 'danger');
  }
});

// ----- Pencarian, filter, paginasi -----
let searchTimer;
document.getElementById('searchInput').addEventListener('input', (event) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.q = event.target.value.trim(); state.page = 1; loadTickets(); }, 300);
});

document.getElementById('statusFilter').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-status]');
  if (!button) return;
  document.querySelectorAll('#statusFilter button').forEach((b) => b.classList.toggle('active', b === button));
  state.status = button.dataset.status;
  state.page = 1;
  loadTickets();
});

document.getElementById('pagination').addEventListener('click', (event) => {
  const link = event.target.closest('[data-page]');
  if (!link || link.parentElement.classList.contains('disabled')) return;
  event.preventDefault();
  state.page = Number(link.dataset.page);
  loadTickets();
});

tableBody.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-id]');
  if (button) openDetail(button.dataset.id);
});

document.getElementById('addBtn').addEventListener('click', openForm);

(async function initTickets() {
  try {
    state.user = await initLayout();
    const [options, locations] = await Promise.all([api('/api/options'), api('/api/locations')]);
    fillSelect(document.getElementById('kategoriSelect'), options.kategori);
    fillSelect(document.getElementById('prioritasSelect'), options.prioritas);
    fillSelect(document.getElementById('locationSelect'), locations.data, (l) => `${l.kode_lokasi} — ${l.nama_lokasi} (${l.jenis_layanan})`, (l) => l.id);
    loadTickets();
    // Dari tombol "Lapor Gangguan" di dashboard
    if (new URLSearchParams(window.location.search).has('lapor')) openForm();
  } catch (err) {
    // initLayout sudah mengarahkan ke halaman login bila belum login
  }
}());
