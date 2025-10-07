# RENTVIX — Hasil Generate

**Template Frontend:** `RentVix Pro`

Folder ini berisi dua proyek:
- **./lav-gen** — Laravel 12 (API)
- **./next-gen** — Next.js 14 (Frontend)

> Catatan: README ini dibuat otomatis oleh generator. Jika ingin menimpa konten ini di masa depan, panggil method dengan $overwrite=true atau edit manual file ini.

---

## Prasyarat
- **PHP ≥ 8.2** (+ ekstensi umum: OpenSSL, PDO, Mbstring, Tokenizer, XML, Ctype, JSON, BCMath, Fileinfo)
- **Composer**
- **Node.js ≥ 18.17** + npm (atau yarn/pnpm)
- **Database** (MySQL/PostgreSQL/SQLite) untuk Laravel
- Git (opsional)

---

## 1. Setup Backend (Laravel 12)
**Windows (PowerShell/CMD):**
```ps1
cd lav-gen
composer install
cp .env.example .env
# edit .env: DB_*, APP_URL=http://localhost:8000
php artisan key:generate
php artisan storage:link
php artisan route:install (opsional)
php artisan migrate
php artisan serve

---

## 2. Setup Frontend (Next 14)
**Windows (PowerShell/CMD):**
```ps1
cd next-gen
npm install / npm install --legacy-peer-deps / pnpm install / yarn
# buat file .env.local yang berisi
NEXT_PUBLIC_API_URL=http://localhost:8000/api (sesuaikan api backend)
npm run dev