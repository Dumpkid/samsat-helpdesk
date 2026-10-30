# Helpdesk Gangguan Jaringan Samsat

Aplikasi sederhana untuk melaporkan dan menangani gangguan jaringan di lokasi Samsat

**Stack:** Node.js + Express · MySQL 8 · Bootstrap 5 + JavaScript · Chart.js · Docker Compose

## Fitur
- Login dua peran: **petugas** (melapor & memantau tiketnya) dan **admin** (memproses semua tiket)
- Lapor gangguan: judul, lokasi, kategori, prioritas, pelapor, deskripsi → kode tiket otomatis `TKT-0001`
- Daftar tiket: pencarian, filter status, paginasi; tiket Baru & prioritas Tinggi di atas
- Tindak lanjut admin: Baru → Diproses → Selesai (tidak bisa mundur, menutup tiket wajib catatan)
- Dashboard: jumlah per status, laporan hari ini, rata-rata lama penanganan, grafik kategori & 5 lokasi terbanyak

## Menjalankan
```bash
docker compose up -d --build
```
Buka http://localhost:3002

| Akun | Username | Password |
|---|---|---|
| Admin Jaringan | `admin` | `admin123` |
| Petugas Lokasi | `petugas` | `petugas123` |

MySQL dari host: `localhost:3308` (user `helpdesk` / `helpdesk123`). Data awal (lokasi + 12 tiket contoh) dimuat saat
volume DB masih kosong; untuk reset: `docker compose down -v && docker compose up -d`.

Uji unit: `docker compose exec app npm test`

## Pemetaan Unit Kompetensi BNSP (Full Stack Developer)
| Unit | Bukti |
|---|---|
| J.62SAD00.006.1 Dokumentasi kebutuhan | [docs/01-dokumentasi-kebutuhan.docx](docs/01-dokumentasi-kebutuhan.docx) |
| J.62SAD00.008.1 Spesifikasi kebutuhan | [docs/02-skpl.docx](docs/02-skpl.docx) |
| J.62SAD00.009.1 Review via spesifikasi & prototipe | [docs/03-review-kebutuhan.docx](docs/03-review-kebutuhan.docx) |
| J.62SAD00.010.1 Validasi & UAT | [docs/04-uat.docx](docs/04-uat.docx) |
| J.62SAD00.011.1 Struktur perangkat lunak | [docs/05-perancangan.docx](docs/05-perancangan.docx) |
| J.620100.005.02 User interface | `public/*.html`, `public/js/*.js` (Bootstrap, modal, toast, filter tombol, responsif) |
| J.620100.010.01 Perintah eksekusi bahasa pemrograman | `src/server.js` (async/await, retry), `public/js/tickets.js` (event, DOM, fetch), grafik Chart.js |
| J.620100.013.01 Subrutin | `src/utils/ticketRules.js` (`validateTicket`, `canChangeStatus`, `validateStatusUpdate`, `formatTicketCode`, `resolutionHours`) |
| J.620100.019.02 Library / komponen pre-existing | Express, mysql2, bcryptjs, express-session, Bootstrap 5, Chart.js, Jest, Supertest |
| J.620100.021.02 Akses basis data | `src/services/*.js` (query berparameter, JOIN, agregasi, foreign key), `db/init/*.sql` |
| J.620100.025.02 Debugging | [docs/06-debugging.docx](docs/06-debugging.docx) |
| J.620100.033.02 Pengujian unit | `tests/`, [docs/07-pengujian-unit.docx](docs/07-pengujian-unit.docx) |
