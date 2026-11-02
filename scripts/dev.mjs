import { spawn } from "node:child_process";
const children = [
  spawn(
    process.execPath,
    ["--use-env-proxy", "--env-file-if-exists=.env", "server/index.mjs"],
    { stdio: "inherit" },
  ),
  spawn(process.execPath, ["node_modules/vite/bin/vite.js"], {
    stdio: "inherit",
  }),
];
const stop = () => children.forEach((p) => p.kill("SIGTERM"));
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const p of children)
  p.on("exit", (code) => {
    stop();
    process.exitCode = code ?? 1;
  });
