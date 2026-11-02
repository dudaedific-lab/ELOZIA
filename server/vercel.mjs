import { Store } from "./db.mjs";
import { createApp } from "./app.mjs";
import { SupabaseStorage } from "./storage.mjs";
const project = "skgdyvjhbxotiqgflzke";
export async function createCloudInstance() {
  if (
    !process.env.DATABASE_URL ||
    process.env.ELOZIA_PROJECT_REF !== project ||
    !process.env.DATABASE_URL.includes(project)
  )
    throw new Error("Conexão Supabase da Elozia não configurada.");
  if (process.env.STORAGE_DRIVER !== "supabase")
    throw new Error("A Vercel exige Storage privado externo.");
  const storage = new SupabaseStorage();
  const db = await new Store().open();
  try {
    await db.query("SELECT id FROM companies LIMIT 1");
    await storage.prepare();
    return { db, server: createApp(db, { storage }) };
  } catch (error) {
    await db.close();
    throw error;
  }
}
export function createVercelHandler(factory = createCloudInstance) {
  let pending;
  return async function handler(req, res) {
    try {
      const url = new URL(req.url, "https://elozia.invalid");
      const routed = url.searchParams.get("__elozia_path");
      if (routed !== null) {
        url.pathname = "/api/" + routed.replace(/^\/+/, "");
        url.searchParams.delete("__elozia_path");
        req.url = url.pathname + url.search;
      }
      if (!pending)
        pending = Promise.resolve()
          .then(factory)
          .catch((error) => {
            pending = undefined;
            throw error;
          });
      let instance = await pending;
      if (instance.db.connectionError) {
        await instance.db.close().catch(() => {});
        pending = undefined;
        instance = await (pending = Promise.resolve()
          .then(factory)
          .catch((error) => {
            pending = undefined;
            throw error;
          }));
      }
      await new Promise((resolve) => {
        res.once("finish", resolve);
        res.once("close", resolve);
        instance.server.emit("request", req, res);
      });
    } catch (error) {
      console.error("Elozia initialization failed:", error.code ?? error.name);
      if (!res.headersSent) {
        res.writeHead(503, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        });
        res.end(
          JSON.stringify({
            error:
              "A Elozia ainda precisa concluir a configuração do banco e do armazenamento na Vercel. Confira as variáveis e execute a preparação do Supabase.",
          }),
        );
      }
    }
  };
}
