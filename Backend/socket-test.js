// socket-test.js
import { io } from "socket.io-client";

// อ่าน args แบบ --key=value
const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, ...rest] = a.replace(/^--/, "").split("=");
    return [k, rest.join("=")];
  })
);

const SERVER_URL = process.env.SOCKET_URL || "http://localhost:5000";
const TOKEN = args.token;           // <-- ใส่ JWT ที่ได้จาก /login
const TO = args.to || "";           // <-- user_id ปลายทาง (เว้นว่างได้)
const TEXT = args.text || "hello from cli";

if (!TOKEN) {
  console.error("Usage: node socket-test.js --token=YOUR_JWT --to=TARGET_USER_ID --text='hi'");
  process.exit(1);
}

const socket = io(SERVER_URL, {
  auth: { token: TOKEN },           // auth ตามที่ server คาดหวัง
  transports: ["websocket"],        // บังคับ ws เพื่อดู log ชัด
});

socket.on("connect", () => {
  console.log("[client] connected:", socket.id);
  if (TO) {
    console.log(`[client] sending dm to ${TO}: ${TEXT}`);
    socket.emit("dm", { to_user_id: TO, text: TEXT });
  }
});

socket.on("dm", (msg) => {
  console.log("[client] received dm:", msg);
});

socket.on("dm:ack", (msg) => {
  console.log("[client] dm ack:", msg);
});

socket.on("connect_error", (err) => {
  console.error("[client] connect_error:", err.message);
});

socket.on("disconnect", (reason) => {
  console.log("[client] disconnected:", reason);
});
