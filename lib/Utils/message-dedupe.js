/**
 * Guard anti-duplikat untuk event pesan masuk.
 *
 * WhatsApp kadang mengirim ulang pesan yang sama lewat `messages.upsert`
 * -- paling sering terjadi pas bot baru reconnect setelah koneksi sempat
 * putus. Kalau handler pesan nggak sadar soal ini, akibatnya bot membalas
 * dua kali (atau lebih) untuk satu pesan yang sama, yang dari sisi pengguna
 * kelihatan seperti bug acak.
 *
 * `makeMessageDedupe` melacak `message.key.id` yang sudah pernah diproses
 * dalam rentang waktu tertentu (TTL), dan membuang entri lama otomatis biar
 * memori nggak terus membengkak.
 *
 * Contoh pakai langsung:
 *   import { makeMessageDedupe } from "xobe-baileys";
 *
 *   const dedupe = makeMessageDedupe();
 *
 *   sock.ev.on("messages.upsert", ({ messages }) => {
 *     for (const msg of messages) {
 *       if (dedupe.isDuplicate(msg.key.id)) continue; // lewati, sudah pernah diproses
 *       // ...proses pesan seperti biasa
 *     }
 *   });
 *
 * Atau pakai `wrapHandler` biar nggak perlu nulis pengecekan manual:
 *   sock.ev.on("messages.upsert", dedupe.wrapHandler(async ({ messages }) => {
 *     // "messages" di sini sudah difilter, nggak ada duplikat
 *   }));
 */
export const makeMessageDedupe = ({ max = 1000, ttlMs = 10 * 60_000 } = {}) => {
    const seen = new Map(); // id -> timestamp masuk (Map menjaga urutan insersi)
    const purgeExpired = () => {
        const now = Date.now();
        for (const [id, t] of seen) {
            if (now - t > ttlMs) seen.delete(id);
            else break; // entri berikutnya pasti lebih baru (insertion order), aman berhenti di sini
        }
    };
    const isDuplicate = (id) => {
        if (!id) return false; // nggak ada id buat dilacak, anggap bukan duplikat
        purgeExpired();
        if (seen.has(id)) return true;
        seen.set(id, Date.now());
        if (seen.size > max) {
            const oldest = seen.keys().next().value;
            seen.delete(oldest);
        }
        return false;
    };
    /** Bungkus handler `messages.upsert` biar daftar `messages`-nya sudah bersih dari duplikat. */
    const wrapHandler = (handler) => async (payload) => {
        const fresh = (payload.messages || []).filter((m) => !isDuplicate(m.key?.id));
        if (!fresh.length) return;
        return handler({ ...payload, messages: fresh });
    };
    return {
        isDuplicate,
        wrapHandler,
        /** Berapa banyak id pesan yang masih dilacak saat ini. */
        get size() { return seen.size; },
        clear: () => seen.clear(),
    };
};
