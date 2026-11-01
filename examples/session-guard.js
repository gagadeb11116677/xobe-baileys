// Contoh: auto-clear session kalau ada kontak yang error decrypt berulang
import makeWASocket, { useMultiFileAuthState, attachSessionGuard } from "xobe-baileys";

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const sock = makeWASocket({ auth: state });
  sock.ev.on("creds.update", saveCreds);

  attachSessionGuard(sock, {
    threshold: 3,       // clear setelah 3x error beruntun untuk kontak yang sama
    windowMs: 120_000,  // dalam 2 menit
    onClear: (jid) => console.log(`[session-guard] Session untuk ${jid} di-reset`),
  });
}

start();
