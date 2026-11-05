# Changelog

Semua perubahan yang lumayan penting dicatat di sini.

## [1.0.0] — 2026-10-31

Rilis stabil pertama. Basis: `ourin-baileys` 9.0.21 (mod dari Baileys v7 / WhiskeySockets).

### Ditambah
- `makeCachedGroupMetadata()` di `Utils/jid-cache.js`: cache in-memory (TTL) buat
  `groupMetadata`, biar kirim pesan ke grup yang sama berkali-kali nggak nembak
  query ke WhatsApp tiap kali. Diekspor dari root (`import { makeCachedGroupMetadata } from "xobe-baileys"`).
  Auto-invalidate pas ada event `groups.update` / `group-participants.update`.
- Folder `examples/`: `basic-bot.js`, `pairing-code.js`, `group-metadata-cache.js`.
- `SECURITY.md`, `CHANGELOG.md` (file ini).

### Diubah
- Nama paket: `ourin-baileys` → `xobe-baileys`.

### Dihapus (dari 9.0.21)
- Fitur auto-follow channel WhatsApp otomatis saat koneksi terbuka
  (`triggerAutoFollow`, JID channel hardcoded, opsi `autoFollowNewsletter*`
  di `Defaults`). Lihat [NOTICE.md](./NOTICE.md).
- File source map (`.map`).

### Belum diaudit penuh
- `lib/assets/wasm/*` dan `lib/WAM/constants.js` (bundle besar, minified).
- Kode lain di luar jalur auto-follow yang sudah dicek.

### Catatan versi
Baileys resmi (WhiskeySockets) per akhir Oktober 2026 masih di jalur stabil 6.7.x,
dengan jalur 7.x sebagai release candidate. `ourin-baileys`/`xobe-baileys` pakai
penomoran sendiri (9.x) dan sudah banyak dimodifikasi dari basis itu, jadi versi
1.0.0 di sini **bukan** klaim sejajar dengan rilis resmi Baileys mana pun — ini
rilis stabil pertama untuk fork ini sendiri. `fetchLatestWaWebVersion()` tetap
narik versi protokol WhatsApp Web terbaru saat runtime, jadi itu nggak kena
pengaruh nomor versi paket ini.

## [1.1.0] — 2026-10-31

### Ditambah
- `makeMessageQueue()` — antri pengiriman pesan dengan jeda + batas per menit, buat ngurangin risiko akun kena flag spam.
- `resolvePNJid()`, `resolvePNJids()`, `resolveLidJid()`, `toJid()` di `Utils/jid-resolve.js` — nerjemahin LID ↔ JID nomor telepon, numpang `signalRepository.lidMapping` bawaan socket. Mengatasi kasus mention/tag yang kebaca sebagai LID bukan JID.
- `createLogger()` — wrapper pino dengan default siap pakai.
- `withReconnect()` — reconnect dengan exponential backoff, biar nggak jadi tight loop pas WhatsApp gangguan.
- `.github/ISSUE_TEMPLATE/`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/workflows/check.yml` (CI: `node --check` ke semua file js tiap push/PR).
- Bagian "Credits" di README.

### Diperbaiki
- `lib/Utils/jid-cache.js` (ditambahkan di 1.0.0) sebelumnya tidak punya file `.d.ts` dan tidak terdaftar di `Utils/index.d.ts`, jadi pemakai TypeScript tidak dapat tipe untuk `makeCachedGroupMetadata`. Sudah ditambahkan, sekaligus untuk semua util baru di atas.

### Audit
- `lib/WAM/constants.js` dan `lib/assets/wasm/*` sudah diaudit (lihat `SECURITY.md`): tidak ditemukan kode eksekusi mencurigakan, keduanya berasal dari kode WhatsApp Web resmi (data statis dan hasil build Emscripten).

## [1.1.1] — 2026-10-31

### Ditambah
- `attachSessionGuard()` di `Utils/session-guard.js` — mendeteksi kegagalan dekripsi berulang (`MessageCounterError`, `Bad MAC`, `No matching sessions found`) untuk kontak tertentu, lalu menghapus **hanya** session kontak tersebut (bukan seluruh folder session), sehingga protokol Signal membangun ulang session secara otomatis tanpa memerlukan login ulang.
- Contoh: `examples/session-guard.js`.

### Audit
- Diverifikasi: seluruh perubahan sejak fork dari ourin-baileys (lihat riwayat di atas) tidak menyentuh `lib/Signal/` sama sekali. Error kelas `MessageCounterError` bersumber dari dependensi pihak ketiga `libsignal` (implementasi protokol Signal), bukan dari kode xobe-baileys, dan juga dapat terjadi pada ourin-baileys maupun Baileys resmi dalam kondisi yang sama (umumnya: dua instance bot berjalan bersamaan dengan session yang sama, atau restart proses yang tidak bersih).

### Diubah
- `README.md` ditulis ulang dengan gaya bahasa formal dan struktur bernomor, mencakup referensi API lengkap untuk manajemen grup, status/presence, dan tombol interaktif (button message), yang sebelumnya tidak didokumentasikan secara rinci.

## [1.1.2] — 2026-11-03

### Diperbaiki (bug nyata, ditemukan lewat full audit + uji import langsung)
- `lib/Modded/message_builder.js` masih mencetak `console.warn` berisi tulisan
  `[ourin-baileys]` saat modul opsional `sharp`/`fluent-ffmpeg` tidak terpasang
  — kelewat dari rebranding sebelumnya. Sekarang menampilkan `[xobe-baileys]`.
  Ditemukan dengan cara benar-benar meng-import paket ini (`import('./lib/index.js')`)
  dan memeriksa output di terminal, bukan cuma grep nama variabel/komentar.

### Ditambah
- `attachGracefulShutdown()` di `Utils/graceful-shutdown.js` — menangani
  `SIGINT`/`SIGTERM` (Ctrl+C, atau restart/redeploy dari platform hosting):
  memastikan `saveCreds()` selesai dan `sock.end()` terpanggil sebelum proses
  keluar. Ini melengkapi `attachSessionGuard` (7.4): yang satu mencegah
  korupsi session di titik awal, yang satu lagi menangani jika sudah terlanjur
  korup.
- Contoh: `examples/graceful-shutdown.js`.

### Audit
- Seluruh file `.js` di `lib/`, `WAProto/`, dan `examples/` lolos `node --check`.
- Paket diverifikasi dengan benar-benar di-import (`import('./lib/index.js')`,
  bukan cuma pemeriksaan sintaks statis) dan seluruh 10 fungsi utilitas dari
  v1.0.0–1.1.1 dikonfirmasi ter-ekspor dan dapat dipanggil dari root paket.

## [1.1.2-r] — 2026-11-03

### Diperbaiki (ditemukan lewat audit tautan internal README)
- Tautan "lihat alternatif untuk CommonJS" pada bagian Instalasi mengarah ke
  `#kalau-project-lu-commonjs`, anchor dari gaya README lama (sebelum ditulis
  ulang formal di v1.1.1) yang sudah tidak ada — tautan tersebut rusak sejak
  v1.1.1. Konten panduan CommonJS (import dinamis / konversi penuh ke ESM)
  ditambahkan kembali pada bagian Pemecahan Masalah dengan anchor yang valid.

### Ditambah
- **Bagian 7 — Fitur Berkelas via Protobuf**: dokumentasi `poll` (Poll Message)
  dan `event` (Event Message) — keduanya fitur yang sudah ada di kode sejak
  basis ourin-baileys (memetakan langsung ke field protobuf
  `pollCreationMessage`/`eventMessage` di `WAProto.proto`), namun belum pernah
  didokumentasikan sebelumnya.

### Diubah
- README ditulis ulang dengan gaya naratif/sinematik pada bagian pembuka dan
  penutup, tanpa mengubah keakuratan isi teknis. Struktur bernomor direvisi
  dari 11 menjadi 12 bagian untuk mengakomodasi Bagian 7 yang baru; seluruh
  tautan internal (daftar isi + referensi silang antar-bagian) diperbarui dan
  diverifikasi ulang.

### Audit
- Seluruh 34 heading dan 41 tautan internal pada README diverifikasi secara
  terprogram; satu tautan rusak (lihat di atas) ditemukan dan diperbaiki.
- `node --check` dijalankan ulang pada seluruh berkas `.js` di `lib/`,
  `WAProto/`, dan `examples/` — tidak ada perubahan kode pada rilis ini selain
  dokumentasi, sehingga tidak ada risiko regresi fungsional.

## [1.1.3] — 2026-11-03

### Ditambah
- `makeCommandRouter()` di `Utils/command-router.js` — router command berbasis prefix (`.ping`, `!menu`, dst.): pencocokan nama command + alias, pengecekan `ownerOnly`, dan penangkapan error per command (satu command error tidak menjatuhkan proses bot). Didokumentasikan di Bagian 8.8, contoh di `examples/command-router.js`.
- Diverifikasi dengan import langsung (`import('./lib/index.js')`), bukan cuma pemeriksaan sintaks.

### Diubah — README
- Elemen kutipan italic dekoratif diganti dengan efek visual yang benar-benar dirender GitHub:
  - Diagram silsilah (Baileys → ourin-baileys → xobe-baileys) pada Bagian 1, sebelumnya ASCII box statis, sekarang diagram alur **Mermaid** (dirender sebagai grafik, bukan teks).
  - Kutipan pembuka/penutup diganti dengan **GitHub alert box** (`[!IMPORTANT]`, `[!CAUTION]`, `[!NOTE]`) dan tabel ringkasan/status.
  - Ditambahkan tabel "fitur sekilas" di header dan tabel "status audit per komponen" di Bagian 11.
- Diperbaiki: label "lihat [Bagian 10]" pada Bagian 1 salah menunjuk ke `#11-keamanan` (nomor bagian tidak sinkron dengan tautannya) — sekarang konsisten sebagai "Bagian 11".
- Daftar isi dan seluruh tautan internal diverifikasi ulang secara terprogram setelah penambahan Bagian 8.8.

## [1.1.4] — 2026-11-03

### Ditambah
- `makeMessageDedupe()` di `Utils/message-dedupe.js` — mencegah bot memproses/membalas pesan yang sama dua kali akibat redelivery WhatsApp (umumnya terjadi saat reconnect). Didokumentasikan di Bagian 8.9, contoh di `examples/message-dedupe.js`.

### Audit
- Diverifikasi: semantik `null` pada `authState.keys.set({ session: { [addr]: null } })` yang dipakai `attachSessionGuard` (v1.1.1) memang berarti "hapus entri" pada `useMultiFileAuthState` (`value ? writeData(...) : removeData(...)`) — dikonfirmasi benar, bukan bug.
- Seluruh 11 fungsi utilitas (v1.0.0–1.1.4) diverifikasi lewat import langsung ke paket (`import('./lib/index.js')`), bukan hanya pemeriksaan sintaks statis.
- Konsistensi dokumen (`package.json`, `LICENSE`, `SECURITY.md`, `CHANGELOG.md`) diperiksa ulang; tidak ditemukan versi yang saling bertentangan.

### Catatan jujur soal keterbatasan
- "Anti error" secara mutlak tidak realistis untuk perangkat lunak apa pun dan tidak diklaim di sini — fitur baru pada rilis ini menangani satu kelas bug spesifik (pesan terduplikasi), bukan seluruh kemungkinan error.
- README tidak menyertakan animasi (GIF/video) karena memerlukan berkas media yang di-hosting; GitHub Markdown secara teknis tidak mendukung animasi selain lewat berkas media semacam itu. Diagram Mermaid dan badge (sudah ada sejak v1.1.3) adalah elemen visual dinamis yang didukung secara native.

## [1.1.5] — 2026-11-04

### Diperbaiki (ditemukan lewat audit `package.json`)
- `package.json` tidak memiliki field `"exports"`. Tanpa ini, konsumen TypeScript dengan konfigurasi modern (`moduleResolution: "node16"` atau `"bundler"`, umum pada setup Next.js/Vite terbaru) berpotensi gagal me-resolve tipe meskipun field `"main"` dan `"types"` sudah benar. Ditambahkan `"exports"` dengan kondisi `types`/`import`/`default` yang eksplisit. Diverifikasi tidak mematahkan resolusi import yang sudah berjalan (`import('./lib/index.js')` diuji ulang setelah perubahan).

### Diubah — README
- Banner ASCII statis diganti dengan header animasi dari **capsule-render** (SVG yang digenerate dari parameter URL, bukan gambar yang disalin dari pihak lain) dan teks animasi dari **readme-typing-svg**. Footer juga ditambahkan dengan elemen serupa.
- Catatan: permintaan untuk menyertakan GIF dari hasil pencarian internet tidak dipenuhi apa adanya — lisensi/hak cipta gambar hasil pencarian tidak dapat diverifikasi, dan menyalin aset milik pihak lain ke repositori publik berisiko dari sisi hak cipta. `capsule-render` dan `readme-typing-svg` dipilih sebagai alternatif karena keduanya men-generate SVG baru per permintaan (bukan menyalin aset), sehingga tidak ada isu lisensi.

### Audit
- Seluruh file `.js` lolos `node --check`; seluruh 12 fungsi utilitas diverifikasi tetap dapat di-import setelah perubahan `exports` field.
