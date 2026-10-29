// Aturan bisnis tiket dalam bentuk fungsi murni (tanpa akses DB) agar mudah diuji.

const KATEGORI = ['Internet Mati', 'Internet Lambat', 'VPN Putus', 'Perangkat Rusak', 'Lainnya'];
const PRIORITAS = ['Rendah', 'Sedang', 'Tinggi'];
const STATUS = ['Baru', 'Diproses', 'Selesai'];

// Alur status hanya boleh maju: Baru -> Diproses -> Selesai (Baru boleh langsung Selesai)
const NEXT_STATUS = { Baru: ['Diproses', 'Selesai'], Diproses: ['Selesai'], Selesai: [] };

function canChangeStatus(from, to) {
  return from === to || (NEXT_STATUS[from] || []).includes(to);
}

function text(value) {
  return String(value ?? '').trim();
}

// Validasi laporan baru dari petugas. Mengembalikan { errors, data }.
function validateTicket(input = {}) {
  const errors = {};
  const data = {
    judul: text(input.judul),
    location_id: Number(input.location_id),
    kategori: text(input.kategori),
    prioritas: text(input.prioritas),
    deskripsi: text(input.deskripsi),
    pelapor: text(input.pelapor),
  };

  if (data.judul.length < 5) errors.judul = 'Judul minimal 5 karakter';
  else if (data.judul.length > 150) errors.judul = 'Judul maksimal 150 karakter';
  if (!Number.isInteger(data.location_id) || data.location_id < 1) errors.location_id = 'Pilih lokasi';
  if (!KATEGORI.includes(data.kategori)) errors.kategori = 'Pilih kategori gangguan';
  if (!PRIORITAS.includes(data.prioritas)) errors.prioritas = 'Pilih prioritas';
  if (!data.pelapor) errors.pelapor = 'Nama pelapor wajib diisi';

  return { errors, data };
}

// Validasi perubahan status oleh admin
function validateStatusUpdate(currentStatus, input = {}) {
  const errors = {};
  const status = text(input.status);
  const catatan = text(input.catatan);

  if (!STATUS.includes(status)) errors.status = 'Status tidak dikenal';
  else if (!canChangeStatus(currentStatus, status)) errors.status = `Status tidak bisa diubah dari ${currentStatus} ke ${status}`;
  if (status === 'Selesai' && !catatan) errors.catatan = 'Catatan penanganan wajib diisi saat menutup tiket';

  return { errors, data: { status, catatan: catatan || null } };
}

// 12 -> "TKT-0012"
function formatTicketCode(id) {
  return `TKT-${String(id).padStart(4, '0')}`;
}

// Lama penanganan dalam jam (1 desimal), null bila belum selesai
function resolutionHours(createdAt, resolvedAt) {
  if (!resolvedAt) return null;
  const ms = new Date(resolvedAt) - new Date(createdAt);
  return Math.round((ms / 3600000) * 10) / 10;
}

function parsePagination(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  return { page, limit, offset: (page - 1) * limit };
}

module.exports = {
  KATEGORI,
  PRIORITAS,
  STATUS,
  canChangeStatus,
  validateTicket,
  validateStatusUpdate,
  formatTicketCode,
  resolutionHours,
  parsePagination,
};
