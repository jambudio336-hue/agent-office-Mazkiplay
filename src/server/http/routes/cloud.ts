import type { Route } from '../router.js';
import { sameOrigin, send } from '../util.js';
import { cloudRequest, cloudStatus, isUuid, readJson, safeDescription, safeText } from '../../cloud.js';

const accountId = (session: { account?: { id: string } }) => session.account?.id;
const ownerQuery = (owner: string) => new URLSearchParams({ owner_account_id: 'eq.' + owner });

function cloudError(res: Parameters<typeof send>[0], result: { status: number; error: string }) {
  return send(res, result.status, { error: result.error });
}

export const cloudRoutes = {
  status: {
    method: 'GET', path: '/api/cloud/status', auth: 'session',
    handle(_ctx, { res, session }) {
      return send(res, 200, { ...cloudStatus(), accountEligible: !!accountId(session) });
    },
  },
  workspaces: {
    path: '/api/cloud/workspaces', auth: 'session',
    async handle(ctx, { req, res, session }) {
      const owner = accountId(session);
      if (!owner) return send(res, 403, { error: 'Cloud sync requires a named account; shared-password sessions are local-only' });
      if (req.method === 'GET') {
        const q = ownerQuery(owner);
        q.set('select', 'id,name,description,created_at,updated_at');
        q.set('order', 'created_at.desc');
        const result = await cloudRequest<unknown[]>('office_cloud_workspaces', 'GET', q);
        return result.ok ? send(res, 200, { workspaces: result.data }) : cloudError(res, result);
      }
      if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
      if (!sameOrigin(req, ctx.cfg)) return send(res, 403, { error: 'Cross-origin request denied' });
      const body = await readJson(req);
      if (!body) return send(res, 400, { error: 'Invalid JSON body' });
      const name = safeText(body.name, 120);
      const description = safeDescription(body.description, 2000);
      if (!name || description === undefined) return send(res, 400, { error: 'Workspace name or description is invalid' });
      const result = await cloudRequest<unknown[]>('office_cloud_workspaces', 'POST', new URLSearchParams({
        select: 'id,name,description,created_at,updated_at',
      }), { owner_account_id: owner, name, description });
      return result.ok ? send(res, 201, { workspace: result.data[0] }) : cloudError(res, result);
    },
  },
  tasks: {
    path: '/api/cloud/tasks', auth: 'session',
    async handle(ctx, { req, res, session }) {
      const owner = accountId(session);
      if (!owner) return send(res, 403, { error: 'Cloud sync requires a named account; shared-password sessions are local-only' });
      if (req.method === 'GET') {
        const q = ownerQuery(owner);
        q.set('select', 'id,workspace_id,title,prompt,status,priority,result_summary,error_summary,created_at,updated_at,started_at,finished_at');
        q.set('order', 'created_at.desc');
        q.set('limit', '100');
        if (ctx && false) q.set('unused', ''); // no-op removed by compiler
        const workspace = new URLSearchParams(new URL(req.url ?? '/', 'http://office.local').search).get('workspace_id');
        if (workspace) {
          if (!isUuid(workspace)) return send(res, 400, { error: 'Invalid workspace ID' });
          q.set('workspace_id', 'eq.' + workspace);
        }
        const result = await cloudRequest<unknown[]>('office_cloud_tasks', 'GET', q);
        return result.ok ? send(res, 200, { tasks: result.data }) : cloudError(res, result);
      }
      if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
      if (!sameOrigin(req, ctx.cfg)) return send(res, 403, { error: 'Cross-origin request denied' });
      const body = await readJson(req);
      if (!body) return send(res, 400, { error: 'Invalid JSON body' });
      const title = safeText(body.title, 200);
      const prompt = safeDescription(body.prompt, 20000);
      const priority = body.priority === undefined ? 3 : body.priority;
      const workspaceId = body.workspace_id === undefined || body.workspace_id === null || body.workspace_id === '' ? null : body.workspace_id;
      if (!title || prompt === undefined || !Number.isInteger(priority) || (priority as number) < 1 || (priority as number) > 5
        || (workspaceId !== null && !isUuid(workspaceId))) {
        return send(res, 400, { error: 'Task title, prompt, priority, or workspace ID is invalid' });
      }
      if (workspaceId) {
        const check = ownerQuery(owner);
        check.set('id', 'eq.' + workspaceId);
        check.set('select', 'id');
        check.set('limit', '1');
        const exists = await cloudRequest<unknown[]>('office_cloud_workspaces', 'GET', check);
        if (!exists.ok) return cloudError(res, exists);
        if (!exists.data.length) return send(res, 404, { error: 'Workspace not found' });
      }
      const result = await cloudRequest<unknown[]>('office_cloud_tasks', 'POST', new URLSearchParams({
        select: 'id,workspace_id,title,prompt,status,priority,result_summary,error_summary,created_at,updated_at,started_at,finished_at',
      }), { owner_account_id: owner, workspace_id: workspaceId, title, prompt, priority });
      return result.ok ? send(res, 201, { task: result.data[0], execution: 'queued-metadata-only' }) : cloudError(res, result);
    },
  },
  taskById: {
    prefix: '/api/cloud/tasks/', auth: 'session',
    async handle(ctx, { req, res, path, session }) {
      const owner = accountId(session);
      if (!owner) return send(res, 403, { error: 'Cloud sync requires a named account; shared-password sessions are local-only' });
      if (req.method !== 'PATCH') return send(res, 405, { error: 'Method not allowed' });
      if (!sameOrigin(req, ctx.cfg)) return send(res, 403, { error: 'Cross-origin request denied' });
      const id = path.slice('/api/cloud/tasks/'.length);
      if (!isUuid(id)) return send(res, 400, { error: 'Invalid task ID' });
      const body = await readJson(req);
      if (!body) return send(res, 400, { error: 'Invalid JSON body' });
      const patch: Record<string, unknown> = {};
      if (body.title !== undefined) {
        const title = safeText(body.title, 200);
        if (!title) return send(res, 400, { error: 'Invalid task title' });
        patch.title = title;
      }
      if (body.prompt !== undefined) {
        const prompt = safeDescription(body.prompt, 20000);
        if (prompt === undefined) return send(res, 400, { error: 'Invalid task prompt' });
        patch.prompt = prompt;
      }
      if (body.status !== undefined) {
        if (body.status !== 'cancelled') return send(res, 400, { error: 'Clients may only cancel queued cloud tasks' });
        patch.status = 'cancelled';
      }
      if (!Object.keys(patch).length) return send(res, 400, { error: 'No supported changes supplied' });
      patch.updated_at = new Date().toISOString();
      const q = ownerQuery(owner);
      q.set('id', 'eq.' + id);
      q.set('status', 'eq.queued');
      q.set('select', 'id,workspace_id,title,prompt,status,priority,result_summary,error_summary,created_at,updated_at,started_at,finished_at');
      const result = await cloudRequest<unknown[]>('office_cloud_tasks', 'PATCH', q, patch);
      if (!result.ok) return cloudError(res, result);
      if (!result.data.length) return send(res, 404, { error: 'Queued task not found or no longer editable' });
      return send(res, 200, { task: result.data[0] });
    },
  },
} satisfies Record<string, Route>;
