// Uji endpoint API tanpa database: service di-mock dengan jest.mock
const request = require('supertest');

jest.mock('../src/services/ticketService');
jest.mock('../src/services/locationService');
jest.mock('../src/services/userService');

const ticketService = require('../src/services/ticketService');
const locationService = require('../src/services/locationService');
const userService = require('../src/services/userService');
const createApp = require('../src/app');

const app = createApp();
const ADMIN = { id: 1, username: 'admin', full_name: 'Admin Jaringan', role: 'admin' };
const PETUGAS = { id: 2, username: 'petugas', full_name: 'Petugas Lokasi', role: 'petugas' };
const ticket = {
  id: 5, judul: 'Internet mati', location_id: 2, status: 'Diproses', created_by: 2,
  created_at: '2026-10-30 08:00:00', resolved_at: null,
};

async function loginAs(user) {
  userService.verifyCredentials.mockResolvedValue(user);
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ username: user.username, password: 'x' }).expect(200);
  return agent;
}

beforeEach(() => jest.resetAllMocks());

describe('Autentikasi & hak akses', () => {
  test('tanpa login ditolak 401', async () => {
    await request(app).get('/api/tickets').expect(401);
  });

  test('login salah ditolak 401', async () => {
    userService.verifyCredentials.mockResolvedValue(null);
    await request(app).post('/api/auth/login').send({ username: 'a', password: 'b' }).expect(401);
  });

  test('petugas tidak boleh mengubah status (403)', async () => {
    const agent = await loginAs(PETUGAS);
    await agent.patch('/api/tickets/5/status').send({ status: 'Selesai', catatan: 'x' }).expect(403);
    expect(ticketService.updateStatus).not.toHaveBeenCalled();
  });

  test('petugas tidak bisa melihat tiket milik orang lain (404)', async () => {
    const agent = await loginAs(PETUGAS);
    ticketService.findById.mockResolvedValue({ ...ticket, created_by: 99 });
    await agent.get('/api/tickets/5').expect(404);
  });
});

describe('Tiket', () => {
  test('daftar tiket memakai filter user & paginasi', async () => {
    const agent = await loginAs(PETUGAS);
    ticketService.findAll.mockResolvedValue({ rows: [ticket], total: 1 });
    const res = await agent.get('/api/tickets?status=Diproses&q=mati').expect(200);
    expect(res.body.data[0].kode).toBe('TKT-0005');
    expect(ticketService.findAll).toHaveBeenCalledWith({
      q: 'mati', status: 'Diproses', user: PETUGAS, limit: 10, offset: 0,
    });
  });

  test('lapor gangguan valid -> 201', async () => {
    const agent = await loginAs(PETUGAS);
    locationService.exists.mockResolvedValue(true);
    ticketService.create.mockResolvedValue({ ...ticket, status: 'Baru' });
    const res = await agent.post('/api/tickets').send({
      judul: 'Internet mati', location_id: 2, kategori: 'Internet Mati', prioritas: 'Tinggi', pelapor: 'Rina',
    }).expect(201);
    expect(res.body.data.kode).toBe('TKT-0005');
    expect(ticketService.create).toHaveBeenCalledWith(expect.objectContaining({ judul: 'Internet mati' }), PETUGAS.id);
  });

  test('lapor dengan lokasi tidak ada -> 422', async () => {
    const agent = await loginAs(PETUGAS);
    locationService.exists.mockResolvedValue(false);
    const res = await agent.post('/api/tickets').send({
      judul: 'Internet mati', location_id: 999, kategori: 'Internet Mati', prioritas: 'Tinggi', pelapor: 'Rina',
    }).expect(422);
    expect(res.body.errors.location_id).toBe('Lokasi tidak ditemukan');
  });

  test('admin menutup tiket tanpa catatan -> 422', async () => {
    const agent = await loginAs(ADMIN);
    ticketService.findById.mockResolvedValue(ticket);
    await agent.patch('/api/tickets/5/status').send({ status: 'Selesai' }).expect(422);
  });

  test('admin menutup tiket dengan catatan -> 200', async () => {
    const agent = await loginAs(ADMIN);
    ticketService.findById.mockResolvedValue(ticket);
    ticketService.updateStatus.mockResolvedValue({ ...ticket, status: 'Selesai', resolved_at: '2026-10-30 10:00:00' });
    const res = await agent.patch('/api/tickets/5/status').send({ status: 'Selesai', catatan: 'Modem diganti' }).expect(200);
    expect(res.body.data.lama_jam).toBe(2);
  });

  test('admin menghapus tiket', async () => {
    const agent = await loginAs(ADMIN);
    ticketService.remove.mockResolvedValue(true);
    await agent.delete('/api/tickets/5').expect(200);
  });
});
