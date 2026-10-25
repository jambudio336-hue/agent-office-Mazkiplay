import type http from 'node:http';

const DEFAULT_URL = 'https://fscqhvqzecqjkllwiuga.supabase.co';
const TABLES = new Set([
  'office_cloud_workspaces',
  'office_cloud_tasks',
  'office_cloud_task_events',
  'office_cloud_audit_logs',
]);

export type CloudMethod = 'GET' | 'POST' | 'PATCH';

function config() {
  const rawUrl = process.env.AGENT_OFFICE_SUPABASE_URL || DEFAULT_URL;
  const secret = process.env.AGENT_OFFICE_SUPABASE_SECRET_KEY
    || process.env.SUPABASE_SECRET_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co')
      || url.username || url.password || url.search || url.hash || url.pathname !== '/') return undefined;
    if (!secret || secret.length < 20) return undefined;
    return { base: url, secret };
  } catch {
    return undefined;
  }
}

export function cloudStatus() {
  const c = config();
  return { configured: !!c, provider: 'supabase', mode: c ? 'server-only' : 'not-configured' };
}

/** Calls a fixed allowlist of Supabase REST tables; never accepts a caller-supplied URL or table. */
export async function cloudRequest<T>(
  table: string,
  method: CloudMethod,
  query: URLSearchParams,
  body?: unknown,
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const c = config();
  if (!c) return { ok: false, status: 503, error: 'Cloud sync is not configured on this server' };
  if (!TABLES.has(table)) return { ok: false, status: 400, error: 'Unsupported cloud resource' };

  const url = new URL('/rest/v1/' + table, c.base);
  url.search = query.toString();
  try {
    const response = await fetch(url, {
      method,
      headers: {
        apikey: c.secret,
        authorization: 'Bearer ' + c.secret,
        'content-type': 'application/json',
        accept: 'application/json',
        prefer: 'return=representation',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(8_000),
    });
    const text = await response.text();
    if (!response.ok) {
      // Never relay PostgREST response bodies: they may disclose schema or internal details.
      return { ok: false, status: response.status === 404 ? 404 : response.status === 409 ? 409 : 502,
        error: response.status === 404 ? 'Cloud record not found' : response.status === 409 ? 'Cloud record conflicts with an existing record' : 'Cloud database request failed' };
    }
    if (!text) return { ok: true, data: [] as T };
    try {
      return { ok: true, data: JSON.parse(text) as T };
    } catch {
      return { ok: false, status: 502, error: 'Cloud database returned an invalid response' };
    }
  } catch {
    return { ok: false, status: 502, error: 'Cloud database is unavailable or timed out' };
  }
}

export async function readJson(req: http.IncomingMessage, limit = 24_000): Promise<Record<string, unknown> | undefined> {
  let size = 0;
  const chunks: Buffer[] = [];
  try {
    for await (const chunk of req) {
      const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += data.length;
      if (size > limit) return undefined;
      chunks.push(data);
    }
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined;
    return parsed as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

export function safeText(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text.length > 0 && text.length <= max ? text : undefined;
}

export function safeDescription(value: unknown, max: number): string | undefined {
  if (value === undefined) return '';
  if (typeof value !== 'string' || value.length > max) return undefined;
  return value;
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
