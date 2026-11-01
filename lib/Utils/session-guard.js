/**
 * Auto-clear session yang korup.
 *
 * Penyebab umum: session enkripsi (protokol Signal) ke satu kontak jadi
 * nggak sinkron -- biasanya karena ada dua instance bot jalan dengan session
 * yang sama, atau proses restart nggak bersih di hosting. Gejalanya di log:
 * `MessageCounterError: Key used already or never filled`, atau
 * `Bad MAC`, `No matching sessions found`, berulang untuk kontak yang sama.
 *
 * `attachSessionGuard` TIDAK menghapus seluruh folder session (itu akan
 * memaksa bot login ulang / scan QR lagi). Yang dihapus cuma kunci enkripsi
 * untuk satu kontak yang bermasalah, setelah error yang sama terjadi
 * berulang kali dalam rentang waktu tertentu. Setelah dihapus, protokol
 * Signal akan membangun ulang session itu secara otomatis di pesan
 * berikutnya (via prekey exchange), tanpa perlu re-login.
 *
 * Contoh:
 *   import makeWASocket, { attachSessionGuard } from "xobe-baileys";
 *
 *   const sock = makeWASocket({ auth: state });
 *   attachSessionGuard(sock, {
 *     threshold: 3,        // error ke-berapa yang memicu clear
 *     windowMs: 120_000,   // dalam rentang berapa ms
 *     onClear: (jid) => console.log(`Session untuk ${jid} di-reset otomatis`),
 *   });
 */

const DECRYPT_FAIL_PATTERN = /failed to decrypt message/i;
const SESSION_ERROR_PATTERN = /MessageCounterError|Bad MAC|No matching sessions|No open session|InvalidMessageException/i;

const extractJid = (logObj) => {
    return logObj?.key?.remoteJid || logObj?.key?.participant || logObj?.participant || null;
};

const clearSessionForJid = async (sock, jid) => {
    const addr = sock?.signalRepository?.jidToSignalProtocolAddress?.(jid);
    if (!addr) throw new Error('signalRepository.jidToSignalProtocolAddress tidak tersedia di socket ini');
    await sock.authState.keys.set({ session: { [addr]: null } });
};

export const attachSessionGuard = (sock, { threshold = 3, windowMs = 2 * 60_000, onClear } = {}) => {
    if (!sock?.logger?.error) {
        throw new Error('attachSessionGuard butuh sock.logger (pastikan dipanggil setelah makeWASocket)');
    }
    const failures = new Map(); // jid -> timestamp[]
    const originalError = sock.logger.error.bind(sock.logger);
    sock.logger.error = (objOrMsg, msg) => {
        originalError(objOrMsg, msg);
        try {
            const obj = typeof objOrMsg === 'object' && objOrMsg ? objOrMsg : {};
            const text = typeof objOrMsg === 'string' ? objOrMsg : (msg || '');
            const errText = String(obj?.err?.message || obj?.error?.message || '');
            const isRelevant = DECRYPT_FAIL_PATTERN.test(text) || SESSION_ERROR_PATTERN.test(errText) || SESSION_ERROR_PATTERN.test(text);
            if (!isRelevant) return;
            const jid = extractJid(obj);
            if (!jid) return;
            const now = Date.now();
            const list = (failures.get(jid) || []).filter((t) => now - t < windowMs);
            list.push(now);
            failures.set(jid, list);
            if (list.length >= threshold) {
                failures.delete(jid);
                clearSessionForJid(sock, jid)
                    .then(() => onClear?.(jid))
                    .catch((err) => originalError({ err }, `attachSessionGuard: gagal clear session untuk ${jid}`));
            }
        }
        catch {
            // guard ini nggak boleh bikin proses crash; diem aja kalau parsing gagal
        }
    };
    return {
        /** Hapus session untuk satu JID secara manual, kapan aja. */
        clearNow: (jid) => clearSessionForJid(sock, jid),
        /** Lepas guard ini, balikin sock.logger.error ke semula. */
        detach: () => { sock.logger.error = originalError; },
    };
};
