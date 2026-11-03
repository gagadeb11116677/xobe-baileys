// Contoh: bot dengan beberapa command lewat makeCommandRouter
import makeWASocket, { useMultiFileAuthState, makeCommandRouter } from "xobe-baileys";

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const sock = makeWASocket({ auth: state });
  sock.ev.on("creds.update", saveCreds);

  const router = makeCommandRouter({
    prefix: ".",
    ownerJids: ["628xxxxxxxxxx@s.whatsapp.net"], // ganti sesuai nomor owner
    commands: {
      ping: {
        handler: async ({ sock, jid }) => {
          await sock.sendMessage(jid, { text: "Pong." });
        },
      },
      menu: {
        aliases: ["help"],
        handler: async ({ sock, jid }) => {
          await sock.sendMessage(jid, { text: `Command: ${router.list().join(", ")}` });
        },
      },
      restart: {
        ownerOnly: true,
        handler: async ({ sock, jid }) => {
          await sock.sendMessage(jid, { text: "Hanya owner yang bisa restart bot." });
        },
      },
    },
    onUnauthorized: async ({ sock, jid }) => {
      await sock.sendMessage(jid, { text: "Command ini khusus owner." });
    },
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message || msg.key.fromMe) return;
    await router.handle(sock, msg);
  });
}

start();
