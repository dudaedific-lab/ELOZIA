import { Store } from "./db.mjs";
import { seed } from "./seed.mjs";
import { createApp } from "./app.mjs";
if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL)
  throw new Error(
    "Produção exige DATABASE_URL; o modo local é destinado a desenvolvimento.",
  );
if (
  process.env.DATABASE_URL &&
  (process.env.ELOZIA_PROJECT_REF !== "skgdyvjhbxotiqgflzke" ||
    !process.env.DATABASE_URL.includes("skgdyvjhbxotiqgflzke"))
)
  throw new Error(
    "DATABASE_URL deve apontar ao pooler do projeto Supabase exclusivo da Elozia e ELOZIA_PROJECT_REF deve estar confirmado.",
  );
const db = await new Store().open();
if (!db.url) await db.prepare();
await seed(db);
const server = createApp(db);
const port = Number(process.env.PORT ?? 3001),
  host = process.env.HOST ?? "127.0.0.1";
server.listen(port, host, () =>
  console.log(
    `Elozia em ${host}:${port} — ${db.url ? "PostgreSQL" : "desenvolvimento local; dados fictícios se habilitados"}`,
  ),
);
async function stop() {
  server.close(async () => {
    await db.close();
    process.exit(0);
  });
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
