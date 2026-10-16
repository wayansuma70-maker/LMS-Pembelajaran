# Panduan Instalasi — EduLMS Pintar

## A. Backend (Google Apps Script)
1. Buka https://script.google.com → **Proyek baru**.
2. Ganti isi `Code.gs` dengan isi berkas **Kode.gs**. (Opsional: Project Settings → centang *Show appsscript.json*, lalu ganti isinya dengan berkas **appsscript.json**.)
3. Pilih fungsi `setupAppEnvironment` → **Run** → izinkan akses Drive, Sheets, Gmail. **Jalankan SEKALI saja.**
   Cek Execution Log: harus ada ✅ dan folder "📁 EduLMS Pintar" di Drive.
4. **Deploy → New deployment → Web app**: *Execute as* **Me**, *Who has access* **Anyone** → Deploy.
5. Salin URL yang berakhiran `/exec`.

Akun contoh: `admin/admin123`, `guru1/guru123`, `siswa1/siswa123`. **Segera buat akun asli lewat menu Kelola Pengguna** dan jangan pakai sandi contoh.

> Setiap mengubah Kode.gs: **Deploy → Manage deployments → Edit → New version → Deploy** (URL tetap sama).

## B. Frontend (GitHub Pages)
1. Ekstrak ZIP. Folder hasil ekstraksi **itulah folder kerja** (isinya langsung `index.html`, `css`, `js`). Jangan masuk lebih dalam.
2. Buka `js/config.js`, ganti `GAS_URL` dengan URL `/exec` tadi.
3. Buat repository **Public** baru di github.com (jangan centang README).
4. Buka terminal **di folder kerja tadi**, pastikan `dir` (Windows) / `ls` menampilkan `index.html`, lalu satu per satu:
```
git init
git add .
git commit -m "Upload pertama"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```
   Saat diminta password, pakai **Personal Access Token** (github.com/settings/tokens → classic → centang `repo`). Layar kosong saat paste itu normal.
5. Repo → **Settings → Pages** → *Deploy from a branch* → `main` / `(root)` → Save. Situs hidup dalam 1–2 menit di `https://USERNAME.github.io/NAMA-REPO/`.

Update berikutnya: `git add .` → `git commit -m "update"` → `git push`, lalu Ctrl+Shift+R.

## C. Uji
Login sebagai `guru1` → tambah materi & tugas → login `siswa1` → kumpulkan tugas → kembali sebagai guru → beri nilai → unduh rekap PDF.
