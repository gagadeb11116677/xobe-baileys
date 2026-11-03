// Contoh: matikan bot dengan bersih (simpen session dulu) pas Ctrl+C / restart dari hosting
import makeWASocket, { useMultiFileAuthState, attachGracefulShutdown } from "xobe-baileys";

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const sock = makeWASocket({ auth: state });
  sock.ev.on("creds.update", saveCreds);

  attachGracefulShutdown(sock, {
    saveCreds,
    onShutdown: (signal) => console.log(`Menerima ${signal}, menyimpan session sebelum keluar...`),
  });
}

start();
