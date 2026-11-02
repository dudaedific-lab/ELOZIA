import { Store } from "./db.mjs";
import { readFile } from "node:fs/promises";
const expected = "skgdyvjhbxotiqgflzke";
if (!process.env.DATABASE_URL)
  throw new Error("Configure DATABASE_URL com a conexão PostgreSQL da Elozia.");
if (
  process.env.ELOZIA_PROJECT_REF !== expected ||
  !process.env.DATABASE_URL.includes(expected)
)
  throw new Error(
    "Confirme o projeto Elozia e utilize a URL do pooler contendo o project ref correto.",
  );
const db = await new Store().open();
try {
  await db.db.query(
    await readFile(
      new URL(
        "../supabase/migrations/202611020001_elozia_foundation.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  console.log(
    "Schema Elozia preparado. Nenhum dado de demonstração remoto criado.",
  );
} finally {
  await db.close();
}
