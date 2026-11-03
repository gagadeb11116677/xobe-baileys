/**
 * Graceful shutdown.
 *
 * Penyebab paling umum session korup (lihat `session-guard.js` dan
 * `SECURITY.md`) adalah proses bot yang berhenti secara paksa -- kena
 * `SIGTERM`/`SIGKILL` dari platform hosting pas restart/redeploy, atau
 * `Ctrl+C` -- di tengah proses nulis file session, sehingga state di disk
 * jadi nggak lengkap/nggak sinkron pas proses nyala lagi.
 *
 * `attachGracefulShutdown` nangkep sinyal `SIGINT`/`SIGTERM`, mastiin
 * `saveCreds()` kepanggil sekali lagi dan kelar, nutup koneksi socket dengan
 * bersih (`sock.end()`), baru keluar. Ini NGGAK mencegah 100% kemungkinan
 * korup (`SIGKILL` nggak bisa ditangkep sama sekali, itu batasan OS, bukan
 * batasan library), tapi ngurangin kemungkinannya buat kasus restart/deploy
 * yang normal.
 *
 * Contoh:
 *   import makeWASocket, { useMultiFileAuthState, attachGracefulShutdown } from "xobe-baileys";
 *
 *   const { state, saveCreds } = await useMultiFileAuthState("./session");
 *   const sock = makeWASocket({ auth: state });
 *   sock.ev.on("creds.update", saveCreds);
 *
 *   attachGracefulShutdown(sock, {
 *     saveCreds,
 *     onShutdown: () => console.log("Mematikan bot dengan bersih..."),
 *   });
 */
export const attachGracefulShutdown = (sock, { saveCreds, onShutdown, signals = ['SIGINT', 'SIGTERM'], timeoutMs = 5000 } = {}) => {
    let shuttingDown = false;
    const handler = async (signal) => {
        if (shuttingDown) return; // cegah double-trigger kalau sinyal dikirim 2x
        shuttingDown = true;
        onShutdown?.(signal);
        const timeout = new Promise((resolve) => setTimeout(resolve, timeoutMs));
        const cleanup = (async () => {
            try {
                if (saveCreds) await saveCreds();
            }
            catch {
                // kalau gagal simpen, tetep lanjut nutup koneksi, jangan sampe nge-hang
            }
            try {
                sock?.end?.(undefined);
            }
            catch {
                // diem aja, yang penting proses tetep bisa keluar
            }
        })();
        await Promise.race([cleanup, timeout]);
        process.exit(0);
    };
    const bound = signals.map((sig) => {
        const fn = () => handler(sig);
        process.on(sig, fn);
        return [sig, fn];
    });
    return {
        /** Lepas listener ini (misalnya kalau mau pasang ulang dengan opsi lain). */
        detach: () => {
            for (const [sig, fn] of bound) process.removeListener(sig, fn);
        },
    };
};
