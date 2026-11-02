import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { SupabaseStorage } from "../server/storage.mjs";
import { createVercelHandler } from "../server/vercel.mjs";
import { Store } from "../server/db.mjs";
import { createApp } from "../server/app.mjs";
const url = "https://skgdyvjhbxotiqgflzke.supabase.co";
test("Storage só aceita o projeto Elozia e envia arquivo privado sem upsert", async () => {
  assert.throws(
    () =>
      new SupabaseStorage({
        url: "https://outro.supabase.co",
        key: "synthetic",
      }),
    /exclusivo/,
  );
  const calls = [];
  const storage = new SupabaseStorage({
    url,
    key: "synthetic-test",
    fetcher: async (input, options) => {
      calls.push({ input, options });
      return new Response("{}", { status: 200 });
    },
  });
  await storage.put(
    "12345678-1234-1234-1234-123456789abc",
    Buffer.from("arquivo"),
    "text/plain",
  );
  assert.equal(
    calls[0].input,
    url +
      "/storage/v1/object/elozia-documents/12345678-1234-1234-1234-123456789abc",
  );
  assert.equal(calls[0].options.headers["x-upsert"], "false");
  assert.equal(calls[0].options.headers.Authorization, "Bearer synthetic-test");
  await assert.rejects(
    () => storage.put("../escape", Buffer.from("x"), "text/plain"),
    /inválido/,
  );
});
test("Storage recusa bucket público e cria somente bucket privado ausente", async () => {
  const unsafe = new SupabaseStorage({
    url,
    key: "synthetic",
    fetcher: async () => Response.json({ public: true }),
  });
  await assert.rejects(() => unsafe.prepare(), /privado/);
  let created;
  const storage = new SupabaseStorage({
    url,
    key: "synthetic",
    fetcher: async (input, options) => {
      if (options.method === "POST") {
        created = JSON.parse(options.body);
        return Response.json({}, { status: 201 });
      }
      return Response.json({}, { status: 404 });
    },
  });
  await storage.prepare();
  assert.equal(created.public, false);
  assert.equal(created.id, "elozia-documents");
  assert.equal(created.file_size_limit, 2 * 1024 * 1024);
});
test("download do Storage permanece autenticado e retorna os bytes originais", async () => {
  let input, headers;
  const storage = new SupabaseStorage({
    url,
    key: "synthetic",
    fetcher: async (u, o) => {
      input = u;
      headers = o.headers;
      return new Response("arquivo privado");
    },
  });
  const bytes = await storage.get("12345678-1234-1234-1234-123456789abc");
  assert(input.includes("/object/authenticated/"));
  assert(headers.Authorization);
  assert.equal(bytes.toString(), "arquivo privado");
});
test("adaptador Vercel preserva rotas, query e body já interpretado pela plataforma", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "elozia-cloud-"));
  const db = await new Store({
    file: path.join(directory, "db.sqlite"),
  }).open();
  await db.prepare();
  const app = createApp(db, { files: path.join(directory, "files") });
  let initialized = 0;
  const handler = createVercelHandler(async () => {
    initialized++;
    return { db, server: app };
  });
  const server = http.createServer(async (req, res) => {
    if (req.method === "POST") {
      let raw = "";
      for await (const c of req) raw += c;
      req.body = JSON.parse(raw);
    }
    await handler(req, res);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  try {
    const r = await fetch(base + "/api/index?__elozia_path=auth%2Fsignup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: "Empresa Vercel",
        name: "Pessoa administradora",
        email: "vercel@example.test",
        password: "Vercel-Password-2026",
      }),
    });
    assert.equal(r.status, 201);
    const cookie = r.headers.get("set-cookie").split(";")[0];
    const me = await fetch(base + "/api/index?__elozia_path=me", {
      headers: { cookie },
    });
    assert.equal((await me.json()).company.name, "Empresa Vercel");
    const punches = await fetch(
      base + "/api/index?__elozia_path=punches&employee=not-allowed",
      { headers: { cookie } },
    );
    assert.equal(punches.status, 404);
    assert.equal(initialized, 1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await db.close();
    await rm(directory, { recursive: true, force: true });
  }
});
test("configuração ausente retorna 503, sem expor conexão ou credencial", async () => {
  const handler = createVercelHandler(async () => {
    throw new Error("synthetic-private-value");
  });
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const r = await fetch(
      "http://127.0.0.1:" + server.address().port + "/api/health",
    );
    assert.equal(r.status, 503);
    assert(!(await r.text()).includes("synthetic-private-value"));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
test("artefatos de publicação incluem função Node, assets e preparação explícita do banco", async () => {
  const config = JSON.parse(
    await readFile(new URL("../vercel.json", import.meta.url), "utf8"),
  );
  assert.equal(config.framework, "vite");
  assert.equal(config.buildCommand, "npm run vercel:build");
  assert.equal(config.functions["api/index.mjs"].maxDuration, 60);
  assert(config.rewrites.some((r) => r.source === "/api/:path*"));
  assert(
    (
      await readFile(new URL("../public/favicon.svg", import.meta.url), "utf8")
    ).includes("<svg"),
  );
});
