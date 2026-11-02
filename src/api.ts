export async function api<T = unknown>(
  path: string,
  method = "GET",
  data?: unknown,
): Promise<T> {
  const r = await fetch("/api" + path, {
    method,
    credentials: "same-origin",
    headers: data !== undefined ? { "Content-Type": "application/json" } : {},
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const result = await r.json();
  if (!r.ok) throw new Error(result.error ?? "Não foi possível concluir.");
  return result as T;
}
export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("");
export const formatDate = (
  v: string | null,
  options?: Intl.DateTimeFormatOptions,
) =>
  v
    ? new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        ...options,
      }).format(new Date(v.length === 10 ? v + "T12:00:00-03:00" : v))
    : "—";
export const formatTime = (v: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(v));
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function requestText(value: string) {
  try {
    return JSON.parse(value).text ?? value;
  } catch {
    return value;
  }
}
