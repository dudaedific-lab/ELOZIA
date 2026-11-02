import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
  randomUUID,
} from "node:crypto";
export const id = () => randomUUID();
export const now = () => new Date().toISOString();
export const hash = (value) => createHash("sha256").update(value).digest("hex");
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password, stored) {
  try {
    const [salt, digest] = stored.split(":");
    return timingSafeEqual(
      Buffer.from(digest, "hex"),
      scryptSync(password, salt, 64),
    );
  } catch {
    return false;
  }
}
export const dayOf = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
export const punchOrder = ["entry", "break_start", "break_end", "exit"];
export function workedMinutes(punches) {
  let total = 0;
  let start = null;
  for (const p of [...punches].sort((a, b) =>
    a.occurred_at.localeCompare(b.occurred_at),
  )) {
    if (p.kind === "entry" || p.kind === "break_end") {
      if (start === null) start = new Date(p.occurred_at).getTime();
    } else if (start !== null) {
      total += Math.max(0, new Date(p.occurred_at).getTime() - start);
      start = null;
    }
  }
  return Math.floor(total / 60000);
}
export function assert(condition, message, status = 400) {
  if (!condition) {
    const e = new Error(message);
    e.status = status;
    throw e;
  }
}
export function field(value, name, max = 200) {
  assert(
    typeof value === "string" && value.trim().length > 0,
    `Informe ${name}.`,
  );
  assert(value.trim().length <= max, `${name}: máximo de ${max} caracteres.`);
  return value.trim();
}
export function validEmail(value) {
  const v = field(value, "o e-mail", 254).toLowerCase();
  assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Informe um e-mail válido.");
  return v;
}
export function dateField(value, optional = false) {
  if (!value && optional) return null;
  assert(
    typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value,
    "Informe uma data válida.",
  );
  return value;
}
export async function audit(
  db,
  user,
  action,
  entityType,
  entityId,
  detail = "",
) {
  await db.execute(
    "INSERT INTO audit_events(id,company_id,user_id,actor_name,action,entity_type,entity_id,detail,created_at) VALUES(?,?,?,?,?,?,?,?,?)",
    [
      id(),
      user.company_id,
      user.id,
      user.name,
      action,
      entityType,
      entityId,
      detail,
      now(),
    ],
  );
}
