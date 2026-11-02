import { DatabaseSync } from "node:sqlite";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
export const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export class Store {
  constructor(options = {}) {
    this.url = options.url ?? process.env.DATABASE_URL;
    this.file =
      options.file ??
      process.env.SQLITE_PATH ??
      path.join(root, ".data", "elozia.sqlite");
    this.queue = Promise.resolve();
  }
  async open() {
    if (this.url) {
      const { Client } = await import("pg");
      const connection = new URL(this.url);
      for (const parameter of ["sslmode", "sslcert", "sslkey", "sslrootcert"])
        connection.searchParams.delete(parameter);
      this.db = new Client({
        connectionString: connection.toString(),
        ssl: {
          rejectUnauthorized: true,
          ...(process.env.SUPABASE_DB_CA
            ? { ca: process.env.SUPABASE_DB_CA.replace(/\\n/g, "\n") }
            : {}),
        },
        connectionTimeoutMillis: 10000,
        query_timeout: 20000,
        keepAlive: true,
      });
      this.db.on("error", (error) => {
        this.connectionError = error;
      });
      await this.db.connect();
      await this.db.query("SET search_path TO elozia");
    } else {
      await mkdir(path.dirname(this.file), { recursive: true });
      this.db = new DatabaseSync(this.file);
      this.db.exec(
        "PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;",
      );
    }
    return this;
  }
  async prepare() {
    const sql = await readFile(path.join(root, "server/schema.sql"), "utf8");
    if (this.url)
      throw new Error(
        "Use npm run db:prepare para preparar explicitamente o projeto remoto.",
      );
    this.db.exec(sql);
    this.db.exec(
      await readFile(path.join(root, "server/sqlite-guards.sql"), "utf8"),
    );
  }
  async query(sql, args = []) {
    if (this.url) {
      let i = 0;
      return (
        await this.db.query(
          sql.replace(/\?/g, () => `$${++i}`),
          args,
        )
      ).rows;
    }
    return this.db.prepare(sql).all(...args);
  }
  async execute(sql, args = []) {
    if (this.url) {
      let i = 0;
      return this.db.query(
        sql.replace(/\?/g, () => `$${++i}`),
        args,
      );
    }
    return this.db.prepare(sql).run(...args);
  }
  exclusive(fn) {
    const next = this.queue.then(fn, fn);
    this.queue = next.catch(() => {});
    return next;
  }
  async transaction(fn) {
    await this.execute(this.url ? "BEGIN" : "BEGIN IMMEDIATE");
    try {
      const result = await fn();
      await this.execute("COMMIT");
      return result;
    } catch (e) {
      await this.execute("ROLLBACK");
      throw e;
    }
  }
  async close() {
    await this.queue;
    if (this.url) await this.db.end();
    else this.db.close();
  }
}
