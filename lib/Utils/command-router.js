import { jidNormalizedUser } from '../WABinary/jid-utils.js';

/**
 * Router command sederhana buat bot berbasis prefix (".ping", "!menu", dst).
 *
 * Bukan pengganti framework bot lengkap — ini cuma nanganin bagian yang
 * paling sering ditulis ulang manual di tiap project: parsing prefix,
 * cocokin nama command, cek owner-only, dan nangkep error PER COMMAND biar
 * satu command yang error nggak nge-crash seluruh proses bot.
 *
 * Contoh:
 *   import makeWASocket, { makeCommandRouter } from "xobe-baileys";
 *
 *   const router = makeCommandRouter({
 *     prefix: ".",
 *     ownerJids: ["628xxxxxxxxxx@s.whatsapp.net"],
 *     commands: {
 *       ping: {
 *         handler: async ({ sock, jid }) => {
 *           await sock.sendMessage(jid, { text: "Pong." });
 *         },
 *       },
 *       restart: {
 *         ownerOnly: true,
 *         handler: async ({ sock, jid }) => {
 *           await sock.sendMessage(jid, { text: "Restart diminta." });
 *         },
 *       },
 *     },
 *   });
 *
 *   sock.ev.on("messages.upsert", ({ messages }) => {
 *     for (const msg of messages) {
 *       if (!msg.message || msg.key.fromMe) continue;
 *       router.handle(sock, msg);
 *     }
 *   });
 *
 * Catatan cakupan: teks diambil dari `conversation` dan
 * `extendedTextMessage.text`. Kalau bot lu juga butuh baca command dari
 * caption gambar/video, tambahin sendiri di luar fungsi ini (atau proses
 * teksnya dulu sebelum dilempar ke `router.handle`).
 */

const extractText = (msg) => {
    return msg?.message?.conversation || msg?.message?.extendedTextMessage?.text || '';
};

export const makeCommandRouter = ({ prefix = '.', commands = {}, ownerJids = [], onUnauthorized, onError } = {}) => {
    const table = new Map();
    for (const [name, def] of Object.entries(commands)) {
        table.set(name.toLowerCase(), def);
        for (const alias of def.aliases || []) {
            table.set(alias.toLowerCase(), def);
        }
    }
    const isOwner = (msg) => {
        const senderJid = jidNormalizedUser(msg.key.participant || msg.key.remoteJid || '');
        return ownerJids.map(jidNormalizedUser).includes(senderJid);
    };
    /**
     * Proses satu pesan. Return `true` kalau pesan ini cocok sama command
     * (dan sudah ditangani / ditolak), `false` kalau bukan command (bot bisa
     * lanjut proses pesan itu dengan cara lain).
     */
    const handle = async (sock, msg) => {
        const text = extractText(msg).trim();
        if (!text.startsWith(prefix)) return false;
        const [rawName, ...args] = text.slice(prefix.length).trim().split(/\s+/);
        if (!rawName) return false;
        const name = rawName.toLowerCase();
        const def = table.get(name);
        if (!def) return false;
        const jid = msg.key.remoteJid;
        if (def.ownerOnly && !isOwner(msg)) {
            if (onUnauthorized) await onUnauthorized({ sock, msg, jid, name });
            return true;
        }
        try {
            await def.handler({ sock, msg, jid, args, text });
        }
        catch (err) {
            if (onError) {
                await onError(err, { sock, msg, jid, name, args });
            }
            else {
                sock?.logger?.error?.({ err, command: name }, `makeCommandRouter: command "${name}" gagal dijalankan`);
            }
        }
        return true;
    };
    return {
        handle,
        /** Daftar command yang terdaftar (termasuk alias), buat bikin menu otomatis. */
        list: () => [...new Set([...table.keys()])],
    };
};
