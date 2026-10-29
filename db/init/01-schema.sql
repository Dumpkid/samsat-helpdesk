-- Skema database Helpdesk Gangguan Jaringan Samsat
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  full_name     VARCHAR(100) NOT NULL,
  role          VARCHAR(10)  NOT NULL COMMENT 'admin / petugas',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locations (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  kode_lokasi   VARCHAR(10)  NOT NULL UNIQUE,
  nama_lokasi   VARCHAR(100) NOT NULL,
  jenis_layanan VARCHAR(20)  NOT NULL
);

CREATE TABLE IF NOT EXISTS tickets (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  judul       VARCHAR(150) NOT NULL,
  location_id INT          NOT NULL,
  kategori    VARCHAR(30)  NOT NULL COMMENT 'Internet Mati / Internet Lambat / VPN Putus / Perangkat Rusak / Lainnya',
  prioritas   VARCHAR(10)  NOT NULL COMMENT 'Rendah / Sedang / Tinggi',
  deskripsi   TEXT,
  pelapor     VARCHAR(100) NOT NULL,
  status      VARCHAR(10)  NOT NULL DEFAULT 'Baru' COMMENT 'Baru / Diproses / Selesai',
  catatan     TEXT COMMENT 'Catatan penanganan dari admin',
  created_by  INT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  CONSTRAINT fk_ticket_location FOREIGN KEY (location_id) REFERENCES locations(id),
  CONSTRAINT fk_ticket_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_created (created_at)
);
