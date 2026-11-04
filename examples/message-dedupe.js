// Contoh: cegah bot membalas dua kali untuk pesan yang sama (misal pas reconnect)
import makeWASocket, { useMultiFileAuthState, makeMessageDedupe } from "xobe-baileys";

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const sock = makeWASocket({ auth: state });
  sock.ev.on("creds.update", saveCreds);

  const dedupe = makeMessageDedupe({ ttlMs: 10 * 60_000 });

  sock.ev.on("messages.upsert", dedupe.wrapHandler(async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message || msg.key.fromMe) return;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    if (text === ".ping") await sock.sendMessage(msg.key.remoteJid, { text: "Pong." });
  }));
}

start();
