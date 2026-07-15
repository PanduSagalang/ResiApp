# 📦 Blueprint Aplikasi Manajemen Resi & Laporan Keuangan Penjualan Shopee (Offline Desktop App)

> Dokumen ini adalah **acuan tunggal (single source of truth)** untuk membangun aplikasi ini dari nol.
> Simpan file ini, dan setiap kali minta bantuan ke AI (Gemini/Claude/dll), **lampirkan/paste isi file ini** supaya AI selalu tahu konteks penuh proyek dan tidak "lupa arah".

---

## 1. Ringkasan Proyek

Aplikasi desktop **offline** untuk:
1. Upload resi Shopee (PDF tunggal atau ZIP berisi banyak PDF).
2. Membaca otomatis (parsing) data dari resi tersebut.
3. Menyimpan data ke database lokal, dikelompokkan per **Toko**.
4. Menampilkan dashboard laporan pesanan yang bisa difilter, dicari, diedit, dihapus.
5. Menghitung keuangan otomatis per pesanan (HPP, admin, PPN, untung kotor/bersih).
6. Export laporan ke CSV (harian/mingguan/bulanan/tahunan).
7. Cetak nota per pesanan, termasuk penyesuaian jika retur.
8. Membersihkan file PDF mentah secara berkala **tanpa menghapus data rekap** (supaya storage tidak bengkak).

Target pengguna: **non-teknis** → tidak boleh ada instruksi "buka XAMPP/Laragon dulu", "jalankan npm start dulu", dll. Harus **klik 1 ikon, langsung jalan**.

---

## 2. Masalah Arsitektur & Solusinya (WAJIB DIBACA)

### Masalah
- React butuh proses build/server.
- Node.js backend butuh proses `node server.js` yang tetap hidup.
- MySQL butuh service database yang menyala (biasanya lewat Laragon/XAMPP).
- Kamu tidak mau user awam harus menyalakan semua itu manual.

### Solusi: Bungkus dengan Electron
**Electron** = aplikasi desktop yang isinya sebenarnya web app (React), tapi dijalankan dalam "jendela browser" mandiri, dan **bisa menjalankan proses Node.js di background secara otomatis** saat aplikasi dibuka, lalu mematikannya saat aplikasi ditutup.

Alur teknis singkat:
```
User klik "AplikasiResi.exe"
        │
        ▼
Electron Main Process menyala
        │
        ├──► Menjalankan Node.js/Express server secara internal (child process / import langsung)
        │        di port lokal misalnya 4321 (invisible buat user)
        │
        ├──► (Jika pakai MySQL) Menjalankan mysqld portable secara internal juga
        │        atau, opsi lebih simpel: pakai SQLite (lihat di bawah)
        │
        └──► Membuka window yang me-load React (hasil build) yang berkomunikasi
                 ke server lokal tadi lewat http://localhost:4321
```
User **tidak pernah melihat** localhost, terminal, atau Laragon. Semua otomatis.

### Pilihan Database — pilih salah satu sebelum lanjut

| Opsi | MySQL (sesuai request awal) | SQLite (rekomendasi untuk distribusi akhir) |
|---|---|---|
| Setup development | Laragon di laptop kamu (mudah, familiar) | File lokal, tanpa server sama sekali |
| Setup di laptop teman | Perlu bundle `mysqld` portable + auto-start via Electron (agak rumit tapi bisa) | Tinggal 1 file `.db`, otomatis jalan, paling ringan & paling anti-gagal untuk user awam |
| Multi-user/network | Bisa | Tidak didesain untuk itu (tapi kasusmu single laptop, jadi tidak masalah) |
| Rekomendasi saya | Pakai untuk **development** dan belajar dulu | Pakai untuk **versi final yang dikasih ke teman** |

**Strategi yang saya sarankan (dipakai di seluruh dokumen ini):**
- Development: MySQL via Laragon (sesuai kemauanmu, dan kamu sudah familiar toolingnya).
- Gunakan **Sequelize (ORM)** di Node.js — bukan raw SQL query — supaya nanti tinggal ganti config `dialect: 'mysql'` → `dialect: 'sqlite'` tanpa nulis ulang logic.
- Saat packaging final (Fase 7 di bawah), tinggal switch ke SQLite supaya distribusi ke laptop teman jadi 1 file installer tanpa drama MySQL portable.

> Jika kamu tetap ingin MySQL sampai final, itu juga bisa — bagian Fase 7 nanti akan jelaskan cara bundling `mysqld` portable + auto-start-nya. Tapi saya sarankan SQLite untuk versi akhir karena jauh lebih stabil untuk user awam.

---

## 3. Tech Stack Final

| Layer | Teknologi |
|---|---|
| Frontend | React (Vite) + Tailwind CSS |
| Backend | Node.js + Express |
| ORM | Sequelize |
| Database (dev) | MySQL (Laragon) |
| Database (produksi/final) | SQLite (rekomendasi) atau MySQL Portable |
| Packaging desktop | Electron + `electron-builder` |
| Parsing PDF | `pdf-parse` (ekstrak teks) + `pdfjs-dist` (kalau butuh posisi teks lebih presisi) |
| Baca ZIP | `adm-zip` atau `unzipper` |
| Export CSV | `json2csv` |
| Cetak Nota | `pdf-lib` atau `puppeteer` (generate PDF nota dari HTML) |
| Penjadwalan cleanup | `node-schedule` atau `node-cron` |
| Auth (opsional) | Session/JWT sederhana, single-user cukup pakai PIN lokal |

### 3.1 Pakai CLI/Scaffolding Bawaan Framework (Jangan Semua Dibuat Manual dari Nol)

Poin ini penting diluruskan: **"belajar ketik manual" tidak berarti semua file harus dibuat dari kosong.**
Sama seperti di PHP/Laravel kamu terbiasa pakai `php artisan make:model`, `make:controller`, `make:migration`, dsb —
di ekosistem React/Node.js juga ada tool CLI standar bawaan framework/library yang **wajib dipakai** karena itu
best-practice resmi, bukan "jalan pintas". Yang tetap kamu ketik manual adalah **isi/logic-nya** (query, kalkulasi,
komponen UI, dsb) — bukan boilerplate/struktur dasarnya.

| Kebutuhan | Perintah CLI resmi yang dipakai (setara `artisan make:...`) |
|---|---|
| Inisialisasi project React | `npm create vite@latest frontend -- --template react` |
| Tambah Tailwind ke Vite | `npm install tailwindcss @tailwindcss/vite` (ikuti setup resmi Tailwind untuk Vite) |
| Inisialisasi project Node/Express | `npm init -y` lalu `npm install express` (Express memang minim generator, struktur dasar tetap kita susun sendiri sesuai Bagian 4 — ini normal, bukan pengecualian) |
| Inisialisasi Sequelize + config | `npx sequelize-cli init` (otomatis membuat folder `config/`, `models/`, `migrations/`, `seeders/`) |
| Membuat 1 model + migration | `npx sequelize-cli model:generate --name Resi --attributes no_resi:string,no_pesanan:string,...` (setara `make:model` + `make:migration` sekaligus) |
| Menjalankan migration ke database | `npx sequelize-cli db:migrate` |
| Inisialisasi Electron + builder | `npm install electron electron-builder --save-dev`, lalu setup `electron-builder.yml` (electron-builder punya opsi `--init` di beberapa versi/template) |
| Membuat komponen React baru | Tidak ada generator wajib (React tidak seketat Laravel) — biasanya cukup buat file `.jsx` manual di folder `components/`/`pages/`, ini memang standar di ekosistem React |

**Aturan praktis yang dipakai di seluruh dokumen ini:**
- **Boilerplate/struktur dasar** (init project, generate model+migration, setup config) → **pakai CLI resmi di atas**.
- **Logic bisnis** (isi function parsing PDF, kalkulasi keuangan, query custom, komponen React, routing Express) → **ketik manual**, ini bagian yang paling penting untuk belajar.
- Kalau ragu apakah sesuatu ada generator resminya atau tidak, tanyakan ke AI pembimbing dulu sebelum bikin manual — supaya tidak reinvent-the-wheel.

---

## 3a. Prinsip Penting: Manual Belajar ≠ Manual Semua

Tujuan dokumen ini adalah kamu **paham logika aplikasi** (parsing, kalkulasi, alur data) dengan mengetik sendiri kode bisnisnya. Tapi ini **bukan berarti menghindari tools/CLI standar** yang memang sudah jadi konvensi industri di ekosistem Node.js & React. Kalau ada perkakas resmi/standar yang tersedia, **pakai itu**, sama seperti Laravel punya `php artisan make:model`, `migrate`, dll.

Yang **WAJIB pakai CLI/scaffolding bawaan** (jangan bikin manual dari nol):

| Kebutuhan | Tool/CLI yang dipakai | Perintah contoh |
|---|---|---|
| Bikin project React | Vite scaffold | `npm create vite@latest frontend -- --template react` |
| Init project Node | npm init | `npm init -y` |
| Model & migration database | **Sequelize CLI** | `npx sequelize-cli init`, `npx sequelize-cli model:generate --name Resi --attributes no_resi:string,...`, `npx sequelize-cli db:migrate` |
| Seed data awal (misal data testing) | Sequelize CLI seeder | `npx sequelize-cli seed:generate --name demo-toko` |
| Auto-restart server saat dev | `nodemon` | `npx nodemon backend/src/app.js` |
| Environment variable | `dotenv` | `.env` + `require('dotenv').config()` |
| Setup Electron + build installer | `electron-builder` scaffold | sesuai dokumentasi resmi, bukan bikin build script manual dari nol |
| Linting/format kode | ESLint + Prettier | `npm init @eslint/config` |
| Routing Express | Express Router bawaan (`express.Router()`) | bagian dari `express`, bukan bikin router custom |

**Yang tetap kamu tulis manual (di sinilah proses belajarnya):**
- Isi logika di dalam model/controller (relasi antar tabel, validasi).
- Isi query/filter spesifik untuk fitur laporan & pencarian.
- Fungsi parsing PDF (`pdfParser.service.js`) — karena ini logika bisnis unik untuk resi Shopee, tidak ada generator untuk ini.
- Fungsi kalkulasi keuangan (`kalkulasi.service.js`).
- Komponen React & tampilan dashboard.
- Konfigurasi khusus (koneksi database, route API, dsb).

**Aturan sederhana:** kalau itu adalah *cara membuat struktur/boilerplate* (project baru, model, migration, build config) → **pakai CLI resmi**. Kalau itu adalah *logika/aturan bisnis aplikasi kamu sendiri* → **tulis manual supaya paham**.

Migration database (`sequelize-cli db:migrate`) juga menggantikan cara "jalankan SQL manual di phpMyAdmin" yang disebut di Bagian 5 — SQL DDL di Bagian 5 tetap berguna sebagai **referensi skema**, tapi eksekusinya nanti lewat file migration Sequelize, bukan copy-paste manual ke phpMyAdmin (kecuali kamu ingin cepat saat awal belajar, itu juga sah-sah saja).

---

## 4. Struktur Folder Proyek

```
aplikasi-resi-shopee/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── models/
│   │   │   ├── Toko.js
│   │   │   ├── Resi.js
│   │   │   ├── ResiItem.js
│   │   │   ├── ProdukMaster.js
│   │   │   ├── Transaksi.js
│   │   │   ├── UploadLog.js
│   │   │   └── Retur.js
│   │   ├── routes/
│   │   │   ├── toko.routes.js
│   │   │   ├── upload.routes.js
│   │   │   ├── resi.routes.js
│   │   │   ├── produk.routes.js
│   │   │   ├── laporan.routes.js
│   │   │   └── nota.routes.js
│   │   ├── services/
│   │   │   ├── pdfParser.service.js
│   │   │   ├── zipHandler.service.js
│   │   │   ├── kalkulasi.service.js
│   │   │   ├── csvExport.service.js
│   │   │   └── cleanup.service.js
│   │   ├── uploads/            <-- tempat file PDF sementara (akan dibersihkan berkala)
│   │   └── app.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── PilihToko.jsx
│   │   │   ├── DashboardResi.jsx
│   │   │   ├── UploadResi.jsx
│   │   │   ├── MasterProduk.jsx
│   │   │   ├── LaporanKeuangan.jsx
│   │   │   └── Nota.jsx
│   │   ├── components/
│   │   ├── services/api.js
│   │   └── App.jsx
│   └── package.json
├── electron/
│   ├── main.js          <-- entry point Electron, auto-start backend
│   └── preload.js
└── BLUEPRINT_APLIKASI_RESI_SHOPEE.md   <-- file ini
```

---

## 5. Skema Database (ERD Deskriptif)

```
User (opsional, jika multi-user)
  └── Toko (1 user bisa banyak toko)
        └── Resi (1 toko banyak resi)
              ├── ResiItem (1 resi banyak produk/varian)
              └── Transaksi (1 resi punya 1 rekap keuangan)
        └── ProdukMaster (1 toko banyak produk master: harga beli/jual/admin/ppn)
        └── UploadLog (histori file yang pernah diupload, untuk cleanup)
Retur (terhubung ke Resi tertentu, jika ada pesanan retur)
```

### DDL SQL (MySQL — sesuaikan tipe data untuk SQLite bila migrasi nanti)

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE toko (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  nama_toko VARCHAR(150) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE resi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  toko_id INT NOT NULL,
  no_resi VARCHAR(100) NOT NULL,
  no_pesanan VARCHAR(100) NOT NULL,
  penerima_nama VARCHAR(150),
  penerima_alamat TEXT,
  pengirim VARCHAR(150),
  berat DECIMAL(10,2),
  tanggal_pesan DATE,
  status ENUM('aktif','retur','dibatalkan') DEFAULT 'aktif',
  file_asal VARCHAR(255),      -- nama file pdf sumber, untuk audit
  upload_log_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (toko_id) REFERENCES toko(id),
  UNIQUE KEY uniq_resi_per_toko (toko_id, no_resi)
);

CREATE TABLE resi_item (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resi_id INT NOT NULL,
  nama_produk VARCHAR(255) NOT NULL,
  variasi VARCHAR(150),
  qty INT NOT NULL DEFAULT 1,
  produk_master_id INT NULL,   -- diisi otomatis kalau match dengan master produk
  FOREIGN KEY (resi_id) REFERENCES resi(id) ON DELETE CASCADE
);

CREATE TABLE produk_master (
  id INT AUTO_INCREMENT PRIMARY KEY,
  toko_id INT NOT NULL,
  nama_produk VARCHAR(255) NOT NULL,
  variasi VARCHAR(150),
  harga_beli DECIMAL(12,2) NOT NULL DEFAULT 0,   -- HPP
  harga_jual DECIMAL(12,2) NOT NULL DEFAULT 0,
  admin_persen DECIMAL(5,2) DEFAULT 0,
  ppn_persen DECIMAL(5,2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (toko_id) REFERENCES toko(id),
  UNIQUE KEY uniq_produk_toko (toko_id, nama_produk, variasi)
);

CREATE TABLE transaksi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resi_id INT NOT NULL,
  hpp_total DECIMAL(12,2) DEFAULT 0,
  harga_jual_total DECIMAL(12,2) DEFAULT 0,
  admin_fee DECIMAL(12,2) DEFAULT 0,
  ppn DECIMAL(12,2) DEFAULT 0,
  potongan_retur DECIMAL(12,2) DEFAULT 0,
  penghasilan_kotor DECIMAL(12,2) DEFAULT 0,
  penghasilan_bersih DECIMAL(12,2) DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (resi_id) REFERENCES resi(id) ON DELETE CASCADE
);

CREATE TABLE retur (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resi_id INT NOT NULL,
  alasan TEXT,
  tanggal_retur DATE,
  jumlah_potongan DECIMAL(12,2) DEFAULT 0,
  FOREIGN KEY (resi_id) REFERENCES resi(id)
);

CREATE TABLE upload_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  toko_id INT NOT NULL,
  nama_file VARCHAR(255),
  jumlah_resi INT DEFAULT 0,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  file_dihapus_pada DATETIME NULL,   -- diisi saat cleanup job jalan
  FOREIGN KEY (toko_id) REFERENCES toko(id)
);
```

> Catatan: `file_dihapus_pada` di `upload_log` adalah kunci fitur "hapus PDF tapi data tetap ada" — job cleanup hanya menghapus **file fisik** di folder `uploads/`, bukan baris di database.

---

## 6. Alur Kerja Aplikasi End-to-End (User Journey)

1. **Buka aplikasi** → langsung tampil "Pilih Toko" (tanpa login, atau login PIN sederhana jika mau).
2. **Buat/Pilih Toko** → user bisa `+ Tambah Toko Baru`, lalu pilih salah satu toko untuk masuk.
3. **Masuk Dashboard Toko** → melihat tabel resi yang sudah pernah diupload untuk toko itu.
4. **Upload Resi** → user drag & drop PDF tunggal atau ZIP.
   - Backend deteksi tipe file.
   - Jika ZIP → extract dulu ke folder sementara.
   - Setiap PDF diparsing satu per satu.
   - Hasil parsing disimpan ke tabel `resi` + `resi_item`.
   - Baris di `upload_log` dicatat (nama file, jumlah resi berhasil diparsing).
5. **Review Hasil Upload** → tabel menampilkan resi baru, user bisa cek jika ada yang gagal parsing (misal format aneh) untuk edit manual.
6. **Isi Master Produk** (halaman terpisah) → user input nama produk, harga beli, harga jual, admin %, ppn %.
7. **Sistem otomatis mencocokkan** `resi_item.nama_produk` + `variasi` dengan `produk_master` → mengisi `produk_master_id`.
8. **Hitung Otomatis** → setiap kali resi baru masuk / master produk diedit, backend menghitung ulang baris `transaksi` terkait (HPP, admin, ppn, untung kotor/bersih).
9. **Halaman Laporan Keuangan** → filter tanggal/minggu/bulan/tahun, cari nama/no resi/no pesanan, lihat total kotor & bersih, export CSV.
10. **Nota** → user klik 1 resi → generate nota (PDF) berisi rincian biaya, bisa cetak/simpan.
11. **Retur** → user tandai 1 resi sebagai retur, isi alasan & jumlah potongan → sistem otomatis mengurangi penghasilan bersih toko itu.
12. **Cleanup terjadwal (berjalan di background, tanpa aksi user)** → setiap interval (misal 30 hari), file PDF asli di folder `uploads/` yang usianya lebih dari X hari dihapus otomatis. Data di tabel **tidak disentuh**.

---

## 7. Detail Parsing PDF Resi Shopee

Beberapa hal penting yang perlu kamu tahu sebelum menulis kode:

- Resi Shopee **tidak punya format PDF yang 100% seragam** — ada versi thermal (kecil, memanjang) dan versi A4 (kertas biasa, berisi beberapa resi per halaman kadang).
- Pendekatan paling aman:
  1. Ekstrak seluruh teks halaman PDF dengan `pdf-parse` → hasilnya string teks mentah per halaman.
  2. Gunakan **regex per field** dengan pola label yang biasanya konsisten muncul, misalnya:
     - `No. Resi` diikuti kode alfanumerik.
     - `No. Pesanan` diikuti kode.
     - Blok "Kepada" untuk penerima+alamat.
     - Blok "Dari" untuk pengirim.
     - `Berat` diikuti angka + satuan (gr/kg).
  3. Untuk daftar produk (nama, variasi, qty) biasanya berada di tabel bagian bawah — ini paling rawan berubah-ubah formatnya. Sarannya: ambil teks di antara marker "Rincian Pesanan" (atau sejenis) sampai marker berikutnya (misal "Catatan" atau garis pemisah), lalu parse baris per baris.
- **Selalu sediakan mode "edit manual"** di UI untuk resi yang gagal terparsing sempurna — jangan andalkan parsing 100% otomatis, karena format bisa berubah sewaktu-waktu.

### Kerangka kode (untuk kamu ketik & pelajari sendiri — bukan implementasi lengkap)

```js
// backend/src/services/pdfParser.service.js
const pdfParse = require('pdf-parse');
const fs = require('fs');

async function parseResiPDF(filePath) {
  // 1. Baca file PDF sebagai buffer
  const dataBuffer = fs.readFileSync(filePath);

  // 2. Ekstrak teks mentah
  const data = await pdfParse(dataBuffer);
  const teks = data.text;

  // 3. TODO: pisahkan per "halaman/resi" jika 1 file berisi banyak resi
  //    petunjuk: cari marker berulang seperti "No. Resi" untuk split teks

  // 4. TODO: ambil tiap field pakai regex, contoh pola (SESUAIKAN dengan resi asli kamu):
  const noResiMatch = teks.match(/No\.?\s*Resi[:\s]*([A-Z0-9]+)/i);
  const noPesananMatch = teks.match(/No\.?\s*Pesanan[:\s]*([A-Z0-9]+)/i);
  // TODO: lanjutkan untuk penerima, alamat, pengirim, berat, dan daftar produk

  return {
    no_resi: noResiMatch ? noResiMatch[1] : null,
    no_pesanan: noPesananMatch ? noPesananMatch[1] : null,
    // TODO: field lainnya
  };
}

module.exports = { parseResiPDF };
```

**Saran belajar:** ambil 3-5 contoh PDF resi asli kamu, buka dengan `pdf-parse` di script kecil terpisah, `console.log(data.text)`, lalu lihat pola teksnya persis seperti apa. Regex kamu HARUS dibuat berdasarkan pola nyata itu, bukan tebakan — ini langkah paling penting sebelum lanjut coding backend.

---

## 8. Formula Perhitungan Keuangan

Per satu **resi/pesanan**:

```
HPP_total          = Σ (harga_beli_produk × qty)   untuk semua item di resi itu
Harga_Jual_total   = Σ (harga_jual_produk × qty)
Admin_Fee          = admin_persen × Harga_Jual_total     (admin_persen dari produk_master atau setting toko)
PPN                = ppn_persen × (Harga_Jual_total)     (atau sesuai aturan pajak yang kamu tentukan)
Potongan_Retur     = diisi manual saat resi ditandai retur

Penghasilan_Kotor  = Harga_Jual_total − HPP_total
Penghasilan_Bersih = Penghasilan_Kotor − Admin_Fee − PPN − Potongan_Retur
```

Total laporan (harian/mingguan/bulanan/tahunan) = jumlahkan semua `transaksi` yang `resi.tanggal_pesan` masuk rentang tanggal filter, dan `resi.status != 'dibatalkan'`.

---

## 9. Fitur Filter & Pencarian (Dashboard & Laporan)

- Filter tanggal: custom range, atau preset (hari ini/minggu ini/bulan ini/tahun ini).
- Search bar: cari berdasarkan `no_resi`, `no_pesanan`, atau `penerima_nama` (LIKE query).
- Filter status: aktif / retur / dibatalkan.
- Filter toko: hanya berlaku data toko yang sedang aktif dipilih.

---

## 10. Export CSV

- Tombol "Export" di halaman Dashboard Resi → export sesuai filter yang sedang aktif.
- Tombol "Export" di halaman Laporan Keuangan → export rekap keuangan sesuai rentang tanggal.
- Format kolom CSV harus rapi, contoh untuk laporan keuangan:

```
Tanggal, No Resi, No Pesanan, Nama Produk, Qty, HPP, Harga Jual, Admin, PPN, Kotor, Bersih
```

Gunakan library `json2csv` di backend, endpoint mengirim file CSV sebagai response download.

---

## 11. Fitur Nota & Retur

- Nota per pesanan: generate dari data resi + transaksi, tampilkan rincian biaya lengkap, bisa export PDF (pakai `pdf-lib` atau render HTML lalu `puppeteer` print-to-pdf).
- Retur: user pilih resi → form isi alasan & jumlah potongan → simpan ke tabel `retur` → trigger hitung ulang `transaksi.penghasilan_bersih`.
- Edit/Hapus resi: harus ada endpoint `PUT /resi/:id` dan `DELETE /resi/:id`, dengan konfirmasi di UI sebelum hapus (karena ini data permanen).

---

## 12. Strategi Retensi File PDF (Anti Storage Bengkak)

- File asli hasil upload disimpan di `backend/src/uploads/{toko_id}/{upload_log_id}/...pdf`.
- Job terjadwal (`node-cron`, jalan sekali sehari saat aplikasi menyala) mengecek `upload_log` yang `uploaded_at` lebih lama dari **N hari** (setting bisa diatur user, default 30 hari) dan `file_dihapus_pada IS NULL`.
- Untuk baris yang memenuhi syarat: hapus file fisik di folder `uploads/`, lalu isi `file_dihapus_pada = NOW()`.
- **Data di tabel `resi`, `resi_item`, `transaksi` tidak pernah dihapus oleh job ini** — hanya file PDF mentahnya saja.

---

## 13. Daftar Endpoint API (Ringkasan)

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/toko` | List semua toko |
| POST | `/api/toko` | Buat toko baru |
| POST | `/api/upload/:tokoId` | Upload PDF/ZIP resi |
| GET | `/api/resi/:tokoId` | List resi (dengan query filter/search) |
| PUT | `/api/resi/:id` | Edit resi |
| DELETE | `/api/resi/:id` | Hapus resi |
| POST | `/api/resi/:id/retur` | Tandai retur |
| GET | `/api/produk-master/:tokoId` | List master produk |
| POST | `/api/produk-master/:tokoId` | Tambah/update produk master |
| GET | `/api/laporan/:tokoId` | Data laporan keuangan (dengan filter tanggal) |
| GET | `/api/laporan/:tokoId/export` | Export CSV laporan |
| GET | `/api/nota/:resiId` | Generate nota PDF |

---

## 14. Rencana Tahapan Pengerjaan (Fase demi Fase)

> Ini adalah urutan yang harus diikuti AI (Gemini) saat memandu kamu. **Jangan lompat fase.**

**Fase 0 — Persiapan**
- Install Node.js, Laragon (MySQL aktif), VS Code.
- Buat folder root project, lalu scaffold `frontend` pakai `npm create vite@latest frontend -- --template react` dan `backend` pakai `npm init -y` — jangan bikin file `package.json` manual.

**Fase 1 — Database**
- Buat database `db_resi_shopee` di Laragon/phpMyAdmin (cukup buat database kosong, tabelnya lewat migration).
- Install & init Sequelize CLI: `npx sequelize-cli init` (ini otomatis bikin folder `config/`, `models/`, `migrations/`, `seeders/`).
- Generate migration untuk tiap tabel pakai `sequelize-cli model:generate` (bukan tulis file migration dari nol), sesuaikan kolom dengan skema di Bagian 5.
- Jalankan `npx sequelize-cli db:migrate` untuk eksekusi ke database — ini menggantikan cara run SQL manual.
- Sambungkan konfigurasi koneksi MySQL di `config/config.json` (hasil generate CLI) sesuai kredensial Laragon.

**Fase 2 — Backend dasar**
- Setup Express server (`app.js`) — gunakan `express.Router()` bawaan untuk routing, jangan bikin router custom sendiri.
- Model sudah otomatis ada dari hasil `sequelize-cli model:generate` di Fase 1; lengkapi relasi antar model (misal `Resi.hasMany(ResiItem)`) secara manual di file model, karena ini bagian logika yang perlu kamu pahami.
- Pasang `nodemon` untuk auto-restart saat development.
- Test koneksi DB berhasil.

**Fase 3 — Fitur Toko**
- Endpoint CRUD toko selesai & bisa ditest via Postman/Thunder Client.

**Fase 4 — Upload & Parsing PDF**
- Endpoint upload menerima file.
- Implementasi `pdfParser.service.js` sungguhan berdasarkan contoh PDF resi asli kamu.
- Implementasi `zipHandler.service.js` untuk ZIP banyak resi.
- Simpan hasil ke DB.

**Fase 5 — Frontend Dasar**
- Project React sudah ada dari scaffold Fase 0; tambahkan Tailwind lewat cara resmi (`npm install tailwindcss @tailwindcss/vite` sesuai dokumentasi terbaru Tailwind, jangan setup manual dari nol).
- Halaman Pilih Toko, Dashboard Resi (list + upload) — komponen ini kamu tulis sendiri karena ini tampilan spesifik aplikasimu.
- Hubungkan ke backend via `axios`/`fetch`.

**Fase 6 — Master Produk & Kalkulasi Keuangan**
- Halaman Master Produk (CRUD).
- Service `kalkulasi.service.js` sesuai formula Bagian 8.
- Trigger hitung ulang tiap ada resi baru / produk master berubah.

**Fase 7 — Laporan, Export, Nota, Retur**
- Halaman Laporan Keuangan + filter + export CSV.
- Fitur Nota (generate PDF).
- Fitur tandai Retur.
- Fitur cleanup file PDF terjadwal.

**Fase 8 — Packaging Electron**
- Setup Electron pakai struktur resmi (`npm install electron electron-builder --save-dev`), konfigurasi build lewat `electron-builder.yml`/`package.json` sesuai dokumentasi resmi — jangan tulis script build manual dari nol.
- `main.js` menjalankan backend Express secara internal (bagian ini logika spesifik aplikasimu, ditulis manual).
- (Jika lanjut SQLite) migrasi config Sequelize dari MySQL ke SQLite lewat `sequelize-cli` (ganti `dialect` di config, generate ulang migration jika perlu), test ulang semua fitur.
- Build installer dengan `electron-builder` (`npx electron-builder`) → hasil `.exe` yang bisa diinstall di laptop teman tanpa perlu Node/MySQL terpasang.

**Fase 9 — Testing Akhir**
- Test end-to-end di laptop lain (idealnya laptop teman itu sendiri) sebelum dianggap selesai.

---

## 15. Prompt Lengkap untuk AI (Gemini) — Copy-Paste Ini ke Chat Baru

```
Kamu adalah mentor pemrograman yang membimbing saya membangun sebuah aplikasi
dari NOL, langkah demi langkah, dan saya akan MENGETIK sendiri semua kodenya
(bukan kamu generate file utuh) supaya saya belajar.

KONTEKS PROYEK (WAJIB DIIKUTI PERSIS):
Saya sedang membangun aplikasi desktop offline untuk mengelola resi Shopee.
Detail lengkap arsitektur, skema database, alur kerja, formula perhitungan,
dan tahapan pengerjaan SUDAH saya tuliskan di dokumen "BLUEPRINT_APLIKASI_RESI_SHOPEE.md"
yang saya lampirkan/paste di bawah ini. Ikuti dokumen ini sebagai acuan tunggal,
jangan menyimpang dari struktur folder, skema database, atau urutan fase yang
sudah ditentukan di sana, kecuali kamu punya alasan teknis kuat — dan jika ada,
jelaskan alasannya dulu ke saya sebelum mengubah.

ATURAN CARA MENGAJAR:
0. Untuk hal-hal yang sudah punya tools/CLI standar di ekosistem Node.js/React
   (contoh: scaffold project dengan Vite, model & migration dengan Sequelize CLI,
   routing dengan express.Router(), build installer dengan electron-builder),
   ARAHKAN saya memakai tools/perintah CLI resmi tersebut — jangan suruh saya
   menulis boilerplate itu dari nol manual. Bagian yang saya tulis manual hanya
   logika bisnis aplikasi (parsing PDF, kalkulasi keuangan, komponen UI, query
   spesifik), sesuai Bagian 3a di blueprint.
1. Ikuti urutan Fase 0 sampai Fase 9 sesuai Bagian 14 di blueprint. Jangan lompat
   fase sebelum saya konfirmasi fase sebelumnya selesai dan berjalan.
2. Untuk setiap langkah, jelaskan DULU konsepnya secara singkat (apa yang kita
   buat dan kenapa), baru berikan kode.
3. Berikan kode per file, satu file per response (jangan gabung banyak file
   sekaligus), dan jelaskan setiap bagian penting dari kode itu (bukan cuma
   dump kode mentah).
4. Setelah saya ketik dan jalankan, saya akan kasih tahu hasilnya (error atau
   sukses). Bantu saya debug berdasarkan pesan error itu, jangan asumsi.
5. Jangan generate seluruh proyek sekaligus dalam 1 response besar — ini akan
   membuat saya tidak paham apa yang terjadi. Sedikit-sedikit tapi paham.
6. Setiap kali ada keputusan teknis penting (misal: pilih library A vs B),
   jelaskan trade-off singkatnya ke saya, baru kasih rekomendasi.
7. Ingatkan saya untuk test tiap fitur kecil sebelum lanjut ke fitur berikutnya.
8. Gunakan Bahasa Indonesia dalam semua penjelasan.

Mulai dari Fase 0 pada Bagian 14 di blueprint saya. Tanyakan dulu ke saya apakah
Node.js, Laragon (MySQL), dan VS Code sudah terpasang, baru lanjutkan.

--- MULAI ISI BLUEPRINT DI BAWAH INI ---
[TEMPEL SELURUH ISI FILE BLUEPRINT_APLIKASI_RESI_SHOPEE.md DI SINI]
--- AKHIR BLUEPRINT ---
```

---

## 16. Catatan Belajar & Cara Pakai Dokumen Ini

- **Jangan minta AI generate seluruh project sekaligus.** Tujuannya kamu belajar, bukan cuma punya aplikasi jadi tanpa paham isinya.
- Setiap fase di Bagian 14, minta AI jelaskan konsep dulu → kamu ketik manual → kamu jalankan → laporkan hasil/error → baru lanjut.
- Simpan file blueprint ini di root folder project kamu, dan **update bagian yang relevan** kalau di tengah jalan kamu mengubah keputusan (misal jadi pakai SQLite beneran, atau nama tabel berubah) — supaya dokumen ini tetap jadi acuan yang akurat.
- Kalau nanti butuh nambah fitur baru di luar dokumen ini, tambahkan sebagai section baru di file ini juga (misal "## 17. Fitur Tambahan: ..."), supaya AI yang kamu ajak diskusi berikutnya tetap dapat konteks penuh.
