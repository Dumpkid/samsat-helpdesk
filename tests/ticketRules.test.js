const {
  canChangeStatus, validateTicket, validateStatusUpdate, formatTicketCode, resolutionHours, parsePagination,
} = require('../src/utils/ticketRules');

describe('canChangeStatus (alur status hanya maju)', () => {
  test.each([
    ['Baru', 'Diproses', true],
    ['Baru', 'Selesai', true],
    ['Diproses', 'Selesai', true],
    ['Diproses', 'Diproses', true],
    ['Diproses', 'Baru', false],
    ['Selesai', 'Diproses', false],
    ['Selesai', 'Baru', false],
  ])('%s -> %s = %s', (from, to, expected) => expect(canChangeStatus(from, to)).toBe(expected));
});

describe('validateTicket', () => {
  const valid = {
    judul: ' Internet mati total ', location_id: '2', kategori: 'Internet Mati', prioritas: 'Tinggi', pelapor: 'Rina',
  };

  test('data valid dinormalisasi', () => {
    const { errors, data } = validateTicket(valid);
    expect(errors).toEqual({});
    expect(data.judul).toBe('Internet mati total');
    expect(data.location_id).toBe(2);
  });

  test('field wajib kosong menghasilkan error', () => {
    const { errors } = validateTicket({});
    expect(Object.keys(errors).sort()).toEqual(['judul', 'kategori', 'location_id', 'pelapor', 'prioritas']);
  });

  test('judul terlalu pendek & kategori di luar daftar', () => {
    const { errors } = validateTicket({ ...valid, judul: 'mati', kategori: 'Listrik' });
    expect(errors.judul).toBeDefined();
    expect(errors.kategori).toBeDefined();
  });
});

describe('validateStatusUpdate', () => {
  test('menutup tiket wajib ada catatan', () => {
    expect(validateStatusUpdate('Diproses', { status: 'Selesai' }).errors.catatan).toBeDefined();
    expect(validateStatusUpdate('Diproses', { status: 'Selesai', catatan: 'Modem diganti' }).errors).toEqual({});
  });

  test('status mundur ditolak', () => {
    expect(validateStatusUpdate('Selesai', { status: 'Baru' }).errors.status).toMatch(/tidak bisa diubah/);
  });

  test('status tidak dikenal ditolak', () => {
    expect(validateStatusUpdate('Baru', { status: 'Batal' }).errors.status).toBe('Status tidak dikenal');
  });
});

describe('fungsi bantu', () => {
  test('formatTicketCode', () => {
    expect(formatTicketCode(7)).toBe('TKT-0007');
    expect(formatTicketCode(12345)).toBe('TKT-12345');
  });

  test('resolutionHours', () => {
    expect(resolutionHours('2026-10-30 08:00:00', '2026-10-30 11:30:00')).toBe(3.5);
    expect(resolutionHours('2026-10-30 08:00:00', null)).toBeNull();
  });

  test('parsePagination', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 10, offset: 0 });
    expect(parsePagination({ page: '2', limit: '500' })).toEqual({ page: 2, limit: 100, offset: 100 });
  });
});
