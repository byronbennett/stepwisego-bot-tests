// Hermetic loopback SFTP server for the FTP/SFTP category triples (Track 10).
//
// Zero new dependencies: ssh2@1.17.0 is already in the tree as
// ssh2-sftp-client's own dependency, and it ships a full SSH server with an
// SFTP subsystem. This script hosts one on 127.0.0.1:0 with its backing
// directory INSIDE the test's scratch dir, so every remote-side effect is
// directly assertable with `{ file: … }` prediction-DSL refs — fully
// out-of-band from the plugin under test.
//
// Contract with the launching bot (all via env):
//   SGT_SFTP_ROOT       backing directory (jail root; created if missing)
//   SGT_SFTP_PORT_FILE  written with the ephemeral port once listening
//   SGT_SFTP_STOP_FILE  polled every 200ms; when it appears, exit 0
//   SGT_SFTP_BACKSTOP_MS  self-exit wall clock (default 45000)
//   SGT_SFTP_USER / SGT_SFTP_PASSWORD  fixed test credential
//                        (default sgt / sgt-tr10-pass — loopback fixture,
//                        not a real secret)
//
// Handler set covers exactly what ssh2-sftp-client issues for the nine FTP
// runners' SFTP legs: LSTAT/STAT (exists), OPENDIR/READDIR/CLOSE (list),
// MKDIR (mkdir non-recursive; the client recurses), RMDIR, REMOVE (unlink),
// REALPATH (mkdir path normalization), OPEN/FSTAT/READ/WRITE/CLOSE
// (fastGet/fastPut), plus RENAME for completeness.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// ── Resolve ssh2 through ssh2-sftp-client from packages/shared ──────────────
// The spawned process's cwd is inside the repo (the engine process inherits
// it from `pnpm --filter … sgt verify`); walk up to the workspace root, then
// resolve exactly the module instance the FTP runners themselves use.
function findRepoRoot(start) {
  let dir = start;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error(`sftp-server: pnpm-workspace.yaml not found above ${start}`);
}
const repoRoot = findRepoRoot(process.cwd());
const sharedRequire = createRequire(path.join(repoRoot, "packages/shared/package.json"));
const sftpClientEntry = sharedRequire.resolve("ssh2-sftp-client");
const ssh2 = createRequire(sftpClientEntry)("ssh2");
const { Server, utils } = ssh2;
const { STATUS_CODE, flagsToString } = utils.sftp;

// ── Config ───────────────────────────────────────────────────────────────────
const ROOT = path.resolve(process.env.SGT_SFTP_ROOT ?? "");
const PORT_FILE = process.env.SGT_SFTP_PORT_FILE ?? "";
const STOP_FILE = process.env.SGT_SFTP_STOP_FILE ?? "";
const BACKSTOP_MS = Number(process.env.SGT_SFTP_BACKSTOP_MS ?? 45000);
const USER = process.env.SGT_SFTP_USER ?? "sgt";
const PASSWORD = process.env.SGT_SFTP_PASSWORD ?? "sgt-tr10-pass";
if (!ROOT || !PORT_FILE || !STOP_FILE) {
  console.error("sftp-server: SGT_SFTP_ROOT, SGT_SFTP_PORT_FILE and SGT_SFTP_STOP_FILE are required");
  process.exit(1);
}
fs.mkdirSync(ROOT, { recursive: true });

// ── Path jail ────────────────────────────────────────────────────────────────
/** Map a remote (posix) path onto the backing dir; escapes throw. */
function toLocal(remotePath) {
  const normalized = path.posix.normalize(
    remotePath.startsWith("/") ? remotePath : `/${remotePath}`,
  );
  const local = path.join(ROOT, normalized);
  if (local !== ROOT && !local.startsWith(ROOT + path.sep)) {
    throw Object.assign(new Error(`path escapes jail: ${remotePath}`), { code: "EACCES" });
  }
  return local;
}

function statusFor(err) {
  if (err && (err.code === "ENOENT" || err.code === "ENOTDIR")) return STATUS_CODE.NO_SUCH_FILE;
  if (err && (err.code === "EACCES" || err.code === "EPERM")) return STATUS_CODE.PERMISSION_DENIED;
  return STATUS_CODE.FAILURE;
}

/** SFTP attrs from an fs.Stats (times in seconds). */
function toAttrs(st) {
  return {
    mode: st.mode,
    uid: 0,
    gid: 0,
    size: st.size,
    atime: Math.floor(st.atimeMs / 1000),
    mtime: Math.floor(st.mtimeMs / 1000),
  };
}

/** `ls -l`-style longname; ssh2-sftp-client derives entry type from char 0. */
function toLongname(st, name) {
  const type = st.isDirectory() ? "d" : "-";
  return `${type}rw-r--r--    1 sgt      sgt      ${String(st.size).padStart(8)} Jan  1 00:00 ${name}`;
}

// ── Server ───────────────────────────────────────────────────────────────────
const hostKeys = [utils.generateKeyPairSync("ed25519").private];

const server = new Server({ hostKeys }, (client) => {
  client.on("error", () => {}); // a client dropping mid-handshake must not kill the server
  client.on("authentication", (ctx) => {
    if (ctx.method === "password" && ctx.username === USER && ctx.password === PASSWORD) {
      ctx.accept();
    } else {
      ctx.reject(["password"]);
    }
  });
  client.on("ready", () => {
    client.on("session", (acceptSession) => {
      const session = acceptSession();
      session.on("sftp", (acceptSftp) => {
        const sftp = acceptSftp();
        let nextHandle = 1;
        const fdHandles = new Map(); // handle id -> fd
        const dirHandles = new Map(); // handle id -> { entries, sent }

        const makeHandle = () => {
          const id = nextHandle++;
          const buf = Buffer.alloc(4);
          buf.writeUInt32BE(id, 0);
          return { id, buf };
        };
        const handleId = (handle) => (handle.length === 4 ? handle.readUInt32BE(0) : -1);

        sftp.on("REALPATH", (reqid, givenPath) => {
          const resolved = path.posix.normalize(
            givenPath.startsWith("/") ? givenPath : `/${givenPath}`,
          );
          sftp.name(reqid, [{ filename: resolved, longname: resolved, attrs: {} }]);
        });

        const xstat = (reqid, remotePath) => {
          try {
            sftp.attrs(reqid, toAttrs(fs.statSync(toLocal(remotePath))));
          } catch (err) {
            sftp.status(reqid, statusFor(err));
          }
        };
        sftp.on("STAT", xstat);
        sftp.on("LSTAT", xstat);

        sftp.on("FSTAT", (reqid, handle) => {
          const fd = fdHandles.get(handleId(handle));
          if (fd === undefined) return sftp.status(reqid, STATUS_CODE.FAILURE);
          try {
            sftp.attrs(reqid, toAttrs(fs.fstatSync(fd)));
          } catch (err) {
            sftp.status(reqid, statusFor(err));
          }
        });

        sftp.on("OPEN", (reqid, filename, flags) => {
          try {
            const fd = fs.openSync(toLocal(filename), flagsToString(flags) ?? "r");
            const h = makeHandle();
            fdHandles.set(h.id, fd);
            sftp.handle(reqid, h.buf);
          } catch (err) {
            sftp.status(reqid, statusFor(err));
          }
        });

        sftp.on("READ", (reqid, handle, offset, length) => {
          const fd = fdHandles.get(handleId(handle));
          if (fd === undefined) return sftp.status(reqid, STATUS_CODE.FAILURE);
          try {
            const buf = Buffer.alloc(length);
            const n = fs.readSync(fd, buf, 0, length, offset);
            if (n === 0) return sftp.status(reqid, STATUS_CODE.EOF);
            sftp.data(reqid, buf.subarray(0, n));
          } catch (err) {
            sftp.status(reqid, statusFor(err));
          }
        });

        sftp.on("WRITE", (reqid, handle, offset, data) => {
          const fd = fdHandles.get(handleId(handle));
          if (fd === undefined) return sftp.status(reqid, STATUS_CODE.FAILURE);
          try {
            fs.writeSync(fd, data, 0, data.length, offset);
            sftp.status(reqid, STATUS_CODE.OK);
          } catch (err) {
            sftp.status(reqid, statusFor(err));
          }
        });

        // fastPut may try to preserve the source mode; accept and ignore.
        sftp.on("FSETSTAT", (reqid) => sftp.status(reqid, STATUS_CODE.OK));
        sftp.on("SETSTAT", (reqid) => sftp.status(reqid, STATUS_CODE.OK));

        sftp.on("OPENDIR", (reqid, dirPath) => {
          try {
            const local = toLocal(dirPath);
            const names = fs.readdirSync(local);
            const entries = names.map((name) => {
              const st = fs.statSync(path.join(local, name));
              return { filename: name, longname: toLongname(st, name), attrs: toAttrs(st) };
            });
            const h = makeHandle();
            dirHandles.set(h.id, { entries, sent: false });
            sftp.handle(reqid, h.buf);
          } catch (err) {
            sftp.status(reqid, statusFor(err));
          }
        });

        sftp.on("READDIR", (reqid, handle) => {
          const state = dirHandles.get(handleId(handle));
          if (!state) return sftp.status(reqid, STATUS_CODE.FAILURE);
          if (state.sent) return sftp.status(reqid, STATUS_CODE.EOF);
          state.sent = true;
          sftp.name(reqid, state.entries);
        });

        sftp.on("CLOSE", (reqid, handle) => {
          const id = handleId(handle);
          const fd = fdHandles.get(id);
          if (fd !== undefined) {
            fdHandles.delete(id);
            try {
              fs.closeSync(fd);
            } catch {
              /* already closed */
            }
          }
          dirHandles.delete(id);
          sftp.status(reqid, STATUS_CODE.OK);
        });

        sftp.on("MKDIR", (reqid, dirPath) => {
          try {
            fs.mkdirSync(toLocal(dirPath));
            sftp.status(reqid, STATUS_CODE.OK);
          } catch (err) {
            sftp.status(reqid, statusFor(err));
          }
        });

        sftp.on("RMDIR", (reqid, dirPath) => {
          try {
            fs.rmdirSync(toLocal(dirPath));
            sftp.status(reqid, STATUS_CODE.OK);
          } catch (err) {
            sftp.status(reqid, statusFor(err));
          }
        });

        sftp.on("REMOVE", (reqid, filePath) => {
          try {
            fs.unlinkSync(toLocal(filePath));
            sftp.status(reqid, STATUS_CODE.OK);
          } catch (err) {
            sftp.status(reqid, statusFor(err));
          }
        });

        sftp.on("RENAME", (reqid, fromPath, toPath) => {
          try {
            fs.renameSync(toLocal(fromPath), toLocal(toPath));
            sftp.status(reqid, STATUS_CODE.OK);
          } catch (err) {
            sftp.status(reqid, statusFor(err));
          }
        });
      });
    });
  });
});

server.listen(0, "127.0.0.1", () => {
  fs.writeFileSync(PORT_FILE, String(server.address().port));
});

// Deterministic shutdown: the bot's CLEANUP step writes the stop file.
const stopWatcher = setInterval(() => {
  if (fs.existsSync(STOP_FILE)) {
    clearInterval(stopWatcher);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 500).unref();
  }
}, 200);

// Backstop: never outlive the test slot.
setTimeout(() => process.exit(0), BACKSTOP_MS).unref();
