import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { Store } from "../server/db.mjs";
import { createApp } from "../server/app.mjs";
let pg, db, server, base, cookie;
before(async () => {
  pg = await PGlite.create();
  await pg.exec("CREATE ROLE anon; CREATE ROLE authenticated;");
  await pg.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202611020001_elozia_foundation.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await pg.exec("SET search_path=elozia");
  db = new Store({ url: "local-postgres-validation" });
  db.db = { query: (sql, args = []) => pg.query(sql, args) };
  server = createApp(db);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = "http://127.0.0.1:" + server.address().port;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await pg.close();
});
async function call(route, data, method = data ? "POST" : "GET") {
  const r = await fetch(base + "/api" + route, {
    method,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(data ? { "Content-Type": "application/json" } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  const body = await r.json();
  if (r.headers.get("set-cookie"))
    cookie = r.headers.get("set-cookie").split(";")[0];
  return { status: r.status, body };
}
test("migration PostgreSQL cria schema privado e RLS em todas as tabelas", async () => {
  const tables = (
    await pg.query(
      "SELECT c.relname,c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='elozia' AND c.relkind='r'",
    )
  ).rows;
  assert.equal(tables.length, 16);
  assert(tables.every((t) => t.relrowsecurity));
  assert.equal(
    (
      await pg.query(
        "SELECT has_schema_privilege('authenticated','elozia','usage') AS allowed",
      )
    ).rows[0].allowed,
    false,
  );
});
test("cadastro e sessão funcionam com o dialeto PostgreSQL", async () => {
  const r = await call("/auth/signup", {
    company: "Empresa PostgreSQL",
    name: "Gestora PG",
    email: "pg@example.test",
    password: "Postgres-Test-2026",
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const me = await call("/me");
  assert.equal(me.body.company.name, "Empresa PostgreSQL");
  assert.equal(me.body.user.role, "admin");
});
test("marcações funcionam no PostgreSQL com sequência e imutabilidade", async () => {
  const result = await call("/punches", {
    kind: "entry",
    idempotency_key: "postgres-punch",
  });
  assert.equal(result.status, 201, JSON.stringify(result.body));
  assert.equal(result.body.receipt_number, 1);
  await assert.rejects(
    () =>
      pg.query("UPDATE elozia.punches SET kind='exit' WHERE id=$1", [
        result.body.id,
      ]),
    /immutable/,
  );
  await assert.rejects(
    () => pg.query("DELETE FROM elozia.audit_events"),
    /immutable/,
  );
});
test("anon não acessa tabelas e authenticated continua sem policy permissiva", async () => {
  await pg.exec("SET ROLE anon");
  await assert.rejects(
    () => pg.query("SELECT * FROM elozia.users"),
    /permission denied/,
  );
  await pg.exec("RESET ROLE");
  await pg.exec(
    "GRANT USAGE ON SCHEMA elozia TO authenticated; GRANT SELECT ON elozia.employees TO authenticated; SET ROLE authenticated",
  );
  const result = await pg.query("SELECT * FROM elozia.employees");
  assert.equal(result.rows.length, 0);
  await pg.exec("RESET ROLE");
});
