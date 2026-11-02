import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { assert } from "./domain.mjs";
const project = "skgdyvjhbxotiqgflzke";
const safeKey = (key) =>
  assert(
    typeof key === "string" && /^[a-f0-9-]{36}$/.test(key),
    "Identificador de arquivo inválido.",
  );
export class LocalStorage {
  constructor(directory) {
    this.directory = directory;
  }
  async put(key, bytes) {
    safeKey(key);
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    await writeFile(path.join(this.directory, key), bytes, {
      mode: 0o600,
      flag: "wx",
    });
  }
  async get(key) {
    safeKey(key);
    return readFile(path.join(this.directory, key));
  }
}
export class SupabaseStorage {
  constructor({
    url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY,
    bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "elozia-documents",
    fetcher = fetch,
  } = {}) {
    assert(
      url === `https://${project}.supabase.co`,
      "Configure SUPABASE_URL com o projeto exclusivo da Elozia.",
      503,
    );
    assert(
      typeof key === "string" && key.length > 0,
      "Configure a chave de serviço do Storage no servidor.",
      503,
    );
    assert(/^[a-z0-9-]+$/.test(bucket), "Nome de bucket inválido.");
    this.url = url;
    this.key = key;
    this.bucket = bucket;
    this.fetcher = fetcher;
  }
  async call(suffix, options = {}) {
    return this.fetcher(this.url + "/storage/v1/" + suffix, {
      ...options,
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        ...options.headers,
      },
      signal: AbortSignal.timeout(20000),
    });
  }
  async prepare() {
    let response = await this.call("bucket/" + this.bucket);
    if (response.status === 404) {
      response = await this.call("bucket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: this.bucket,
          name: this.bucket,
          public: false,
          file_size_limit: 2 * 1024 * 1024,
          allowed_mime_types: [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "text/plain",
            "text/csv",
          ],
        }),
      });
      assert(
        response.ok,
        "Não foi possível criar o bucket privado da Elozia.",
        503,
      );
      return;
    }
    assert(
      response.ok,
      "Não foi possível verificar o bucket privado da Elozia.",
      503,
    );
    const config = await response.json();
    assert(
      config.public === false,
      "O bucket da Elozia precisa ser privado. Corrija no Supabase antes de continuar.",
      503,
    );
  }
  async put(key, bytes, mime) {
    safeKey(key);
    const response = await this.call(`object/${this.bucket}/${key}`, {
      method: "POST",
      headers: { "Content-Type": mime, "x-upsert": "false" },
      body: bytes,
    });
    assert(
      response.ok,
      "Não foi possível guardar o arquivo no Storage. Tente novamente.",
      503,
    );
  }
  async get(key) {
    safeKey(key);
    const response = await this.call(
      `object/authenticated/${this.bucket}/${key}`,
    );
    assert(response.ok, "Não foi possível recuperar o arquivo privado.", 503);
    return Buffer.from(await response.arrayBuffer());
  }
}
export function createStorage(directory) {
  return process.env.STORAGE_DRIVER === "supabase"
    ? new SupabaseStorage()
    : new LocalStorage(directory);
}
