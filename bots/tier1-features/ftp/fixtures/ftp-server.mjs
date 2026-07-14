// Hermetic loopback PLAIN-FTP server for the FTP/SFTP category triples
// (Track 18 — closes the "protocol: ftp deferred" gap from Track 10).
//
// One approved dev dependency: ftp-srv (apps/sgtester devDependency, MIT,
// test-only — never shipped). It serves the classic FTP verb set that
// basic-ftp issues for the nine FTP runners' ftp legs: USER/PASS, CWD, MKD,
// RMD, DELE, LIST, SIZE, RETR, STOR, TYPE, PASV/EPSV. The backing directory
// lives INSIDE the test's scratch dir, so every remote-side effect is a
// direct `{ file: … }` prediction-DSL witness — fully out-of-band from the
// plugin under test. Same launch/handshake/shutdown contract as
// fixtures/sftp-server.mjs:
//
//   SGT_FTP_ROOT         backing directory (jail root; created if missing)
//   SGT_FTP_PORT_FILE    written with the ephemeral port once listening
//   SGT_FTP_STOP_FILE    polled every 200ms; when it appears, exit 0
//   SGT_FTP_BACKSTOP_MS  self-exit wall clock (default 45000)
//   SGT_FTP_USER / SGT_FTP_PASSWORD  fixed test credential
//                        (default sgt / sgt-tr18-pass — loopback fixture,
//                        not a real secret)
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// ── Resolve ftp-srv through apps/sgtester (its devDependency) ────────────────
function findRepoRoot(start) {
  let dir = start;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error(`ftp-server: pnpm-workspace.yaml not found above ${start}`);
}
const repoRoot = findRepoRoot(process.cwd());
const sgtesterRequire = createRequire(path.join(repoRoot, "apps/sgtester/package.json"));
const { FtpSrv } = sgtesterRequire("ftp-srv");

// ── Config ───────────────────────────────────────────────────────────────────
const ROOT = path.resolve(process.env.SGT_FTP_ROOT ?? "");
const PORT_FILE = process.env.SGT_FTP_PORT_FILE ?? "";
const STOP_FILE = process.env.SGT_FTP_STOP_FILE ?? "";
const BACKSTOP_MS = Number(process.env.SGT_FTP_BACKSTOP_MS ?? 45000);
const USER = process.env.SGT_FTP_USER ?? "sgt";
const PASSWORD = process.env.SGT_FTP_PASSWORD ?? "sgt-tr18-pass";
if (!ROOT || !PORT_FILE || !STOP_FILE) {
  console.error("ftp-server: SGT_FTP_ROOT, SGT_FTP_PORT_FILE and SGT_FTP_STOP_FILE are required");
  process.exit(1);
}
fs.mkdirSync(ROOT, { recursive: true });

// ── Server ───────────────────────────────────────────────────────────────────
// Port 0 → ephemeral; pasv_url pins the address returned in PASV replies to
// loopback (data connections also bind ephemeral ports on 127.0.0.1). ftp-srv
// jails each session's filesystem to the `root` passed at login resolution.
const server = new FtpSrv({
  url: "ftp://127.0.0.1:0",
  pasv_url: "127.0.0.1",
  anonymous: false,
  greeting: "sgt loopback ftp fixture",
});

server.on("login", ({ username, password }, resolve, reject) => {
  if (username === USER && password === PASSWORD) {
    resolve({ root: ROOT });
  } else {
    reject(new Error("bad credentials"));
  }
});

// A client dropping mid-command must not kill the server.
server.on("client-error", () => {});

server.listen().then(() => {
  fs.writeFileSync(PORT_FILE, String(server.server.address().port));
});

// Deterministic shutdown: the bot's CLEANUP step writes the stop file.
const stopWatcher = setInterval(() => {
  if (fs.existsSync(STOP_FILE)) {
    clearInterval(stopWatcher);
    server.close().then(() => process.exit(0));
    setTimeout(() => process.exit(0), 500).unref();
  }
}, 200);

// Backstop: never outlive the test slot.
setTimeout(() => process.exit(0), BACKSTOP_MS).unref();
