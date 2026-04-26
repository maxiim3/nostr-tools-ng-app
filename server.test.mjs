import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { mkdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { finalizeEvent, generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';
import { getToken } from 'nostr-tools/nip98';

const TEST_DIR = path.join(os.tmpdir(), `nostr-test-${Date.now()}`);
const USER_SECRET_KEY = generateSecretKey();
const ADMIN_SECRET_KEY = generateSecretKey();
const USER_PUBKEY = getPublicKey(USER_SECRET_KEY);
const USER_NPUB = nip19.npubEncode(USER_PUBKEY);
const ADMIN_NPUB = nip19.npubEncode(getPublicKey(ADMIN_SECRET_KEY));

process.env.ADMIN_NPUBS = ADMIN_NPUB;
process.env.DATA_DIR = TEST_DIR;
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

let baseUrl;

let supabaseServer;
let appServer;
const memberRows = [];

async function createAuthHeader({ secretKey, url, method, body }) {
  return getToken(
    url,
    method,
    async (template) =>
      finalizeEvent(
        {
          kind: template.kind,
          tags: template.tags,
          content: template.content,
          created_at: template.created_at,
        },
        secretKey
      ),
    true,
    body
  );
}

describe('server.mjs integration', () => {
  beforeAll(async () => {
    mkdirSync(TEST_DIR, { recursive: true });
    supabaseServer = startSupabaseMockServer();
    const appPort = supabaseServer.port + 100;
    process.env.PORT = String(appPort);
    process.env.SUPABASE_URL = `http://127.0.0.1:${supabaseServer.port}`;
    appServer = (await import('./server.mjs')).server;
    baseUrl = `http://127.0.0.1:${appServer.port}`;
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  afterAll(() => {
    appServer?.stop(true);
    supabaseServer?.stop(true);
    try {
      rmSync(TEST_DIR, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  describe('GET /api/health', () => {
    it('returns ok', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
    });
  });

  describe('CORS', () => {
    it('returns CORS headers for allowed origins on OPTIONS', async () => {
      const res = await fetch(`${baseUrl}/api/health`, {
        method: 'OPTIONS',
        headers: { Origin: 'http://localhost:4200' },
      });
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:4200');
      expect(res.headers.get('Access-Control-Allow-Headers')).toBeTruthy();
    });

    it('returns CORS headers for 127.0.0.1 origin', async () => {
      const res = await fetch(`${baseUrl}/api/health`, {
        method: 'OPTIONS',
        headers: { Origin: 'http://127.0.0.1:4200' },
      });
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://127.0.0.1:4200');
    });

    it('does not return CORS headers for unknown origin', async () => {
      const res = await fetch(`${baseUrl}/api/health`, {
        method: 'OPTIONS',
        headers: { Origin: 'https://evil.example.com' },
      });
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });

    it('sets CORS headers on GET responses for allowed origin', async () => {
      const res = await fetch(`${baseUrl}/api/health`, {
        headers: { Origin: 'http://localhost:4200' },
      });
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:4200');
    });
  });

  describe('Auth enforcement', () => {
    it('GET /api/pack-members/me returns 401 without auth', async () => {
      const res = await fetch(`${baseUrl}/api/pack-members/me`);
      expect(res.status).toBe(401);
    });

    it('POST /api/pack-members returns 401 without auth', async () => {
      const res = await fetch(`${baseUrl}/api/pack-members`, { method: 'POST' });
      expect(res.status).toBe(401);
    });

    it('GET /api/admin/pack-members returns 401 without auth', async () => {
      const res = await fetch(`${baseUrl}/api/admin/pack-members`);
      expect(res.status).toBe(401);
    });

    it('POST /api/admin/pack-members/:pubkey/remove returns 401 without auth', async () => {
      const res = await fetch(`${baseUrl}/api/admin/pack-members/somekey/remove`, {
        method: 'POST',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('Pack member lifecycle', () => {
    it('auto-admits a user and persists the member in Supabase', async () => {
      const url = `${baseUrl}/api/pack-members`;
      const body = {
        username: 'Alice',
        description: 'Nostr builder',
        avatarUrl: 'https://example.com/alice.png',
        followerCount: 12,
        followingCount: 34,
        accountCreatedAt: '2024-01-01T00:00:00.000Z',
        postCount: 56,
        zapCount: 78,
      };
      const authorization = await createAuthHeader({
        secretKey: USER_SECRET_KEY,
        url,
        method: 'POST',
        body,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: authorization,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      expect(response.status).toBe(201);
      const responseBody = await response.json();
      expect(responseBody.pubkey).toBe(USER_PUBKEY);
      expect(responseBody.username).toBe('Alice');
      expect(responseBody.requestedFromApp).toBe(true);
      expect(responseBody.removedAt).toBeNull();

      const record = memberRows.find((row) => row.pubkey === USER_PUBKEY);
      expect(record).toBeTruthy();
      expect(record.username).toBe('Alice');
      expect(record.description).toBe('Nostr builder');
      expect(record.avatar_url).toBe('https://example.com/alice.png');
      expect(record.follower_count).toBe(12);
      expect(record.following_count).toBe(34);
      expect(record.account_created_at).toBe('2024-01-01T00:00:00.000Z');
      expect(record.post_count).toBe(56);
      expect(record.zap_count).toBe(78);
      expect(record.requested_from_app).toBe(true);
      expect(record.requested_at).toBeTruthy();
      expect(record.joined_at).toBeTruthy();
      expect(record.removed_at).toBeNull();
    });

    it('is idempotent when joining again', async () => {
      const previousRecord = memberRows.find((row) => row.pubkey === USER_PUBKEY);
      const url = `${baseUrl}/api/pack-members`;
      const body = {
        username: 'Alice updated',
        avatarUrl: 'https://example.com/alice-updated.png',
      };
      const authorization = await createAuthHeader({
        secretKey: USER_SECRET_KEY,
        url,
        method: 'POST',
        body,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: authorization,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      expect(response.status).toBe(201);
      const matchingRows = memberRows.filter((row) => row.pubkey === USER_PUBKEY);
      expect(matchingRows).toHaveLength(1);
      expect(matchingRows[0].username).toBe('Alice updated');
      expect(matchingRows[0].joined_at).toBe(previousRecord.joined_at);
      expect(matchingRows[0].requested_at).toBe(previousRecord.requested_at);
    });

    it('returns joined status for authenticated member', async () => {
      const url = `${baseUrl}/api/pack-members/me`;
      const authorization = await createAuthHeader({
        secretKey: USER_SECRET_KEY,
        url,
        method: 'GET',
      });

      const response = await fetch(url, {
        headers: { Authorization: authorization },
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.status).toBe('joined');
      expect(body.member.pubkey).toBe(USER_PUBKEY);
    });

    it('lists current members for authenticated admin', async () => {
      const url = `${baseUrl}/api/admin/pack-members`;
      const authorization = await createAuthHeader({
        secretKey: ADMIN_SECRET_KEY,
        url,
        method: 'GET',
      });

      const response = await fetch(url, {
        headers: { Authorization: authorization },
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(1);
      expect(body.some((entry) => entry.pubkey === USER_PUBKEY)).toBe(true);
    });

    it('rejects admin member listing for a non-admin user', async () => {
      const url = `${baseUrl}/api/admin/pack-members`;
      const authorization = await createAuthHeader({
        secretKey: USER_SECRET_KEY,
        url,
        method: 'GET',
      });

      const response = await fetch(url, {
        headers: { Authorization: authorization },
      });

      expect(response.status).toBe(403);
    });

    it('removes a member for authenticated admin and preserves the Supabase row', async () => {
      const url = `${baseUrl}/api/admin/pack-members/${USER_PUBKEY}/remove`;
      const body = {};
      const authorization = await createAuthHeader({
        secretKey: ADMIN_SECRET_KEY,
        url,
        method: 'POST',
        body,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: authorization,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      expect(response.status).toBe(204);
      const record = memberRows.find((row) => row.pubkey === USER_PUBKEY);
      expect(record).toBeTruthy();
      expect(record.removed_at).toBeTruthy();
    });
  });

  describe('LNURL proxy', () => {
    it('returns 400 for missing address', async () => {
      const res = await fetch(`${baseUrl}/api/lnurl?amount=1000`);
      expect(res.status).toBe(400);
    });

    it('returns 400 for missing amount', async () => {
      const res = await fetch(`${baseUrl}/api/lnurl?address=test@example.com`);
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid amount', async () => {
      const res = await fetch(`${baseUrl}/api/lnurl?address=test@example.com&amount=abc`);
      expect(res.status).toBe(400);
    });
  });

  describe('API catch-all', () => {
    it('returns 404 for unknown API routes', async () => {
      const res = await fetch(`${baseUrl}/api/nonexistent`);
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.message).toBe('Not found.');
    });
  });
});

function startSupabaseMockServer() {
  const firstPort = 41000 + (Date.now() % 1000);

  for (let offset = 0; offset < 50; offset++) {
    try {
      return Bun.serve({
        port: firstPort + offset,
        fetch: handleSupabaseMockRequest,
      });
    } catch (error) {
      if (error?.code !== 'EADDRINUSE') {
        throw error;
      }
    }
  }

  throw new Error('Unable to start Supabase mock server.');
}

async function handleSupabaseMockRequest(request) {
  if (request.headers.get('apikey') !== 'test-service-role-key') {
    return Response.json({ message: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  if (url.pathname !== '/rest/v1/francophone_pack_members') {
    return Response.json({ message: 'not found' }, { status: 404 });
  }

  if (request.method === 'GET') {
    const pubkeyFilter = url.searchParams.get('pubkey');
    let rows = [...memberRows];

    if (pubkeyFilter?.startsWith('eq.')) {
      rows = rows.filter((row) => row.pubkey === pubkeyFilter.slice(3));
    }

    if (url.searchParams.get('removed_at') === 'is.null') {
      rows = rows.filter((row) => row.removed_at === null);
    }

    if (url.searchParams.get('order') === 'joined_at.desc') {
      rows.sort((left, right) => right.joined_at.localeCompare(left.joined_at));
    }

    if (url.searchParams.get('limit') === '1') {
      rows = rows.slice(0, 1);
    }

    return Response.json(rows);
  }

  if (request.method === 'POST') {
    const row = await request.json();
    const existingIndex = memberRows.findIndex((entry) => entry.pubkey === row.pubkey);

    if (existingIndex >= 0) {
      memberRows[existingIndex] = { ...memberRows[existingIndex], ...row };
      return Response.json([memberRows[existingIndex]]);
    }

    memberRows.push(row);
    return Response.json([row], { status: 201 });
  }

  if (request.method === 'PATCH') {
    const pubkeyFilter = url.searchParams.get('pubkey');
    const pubkey = pubkeyFilter?.startsWith('eq.') ? pubkeyFilter.slice(3) : '';
    const existingIndex = memberRows.findIndex((entry) => entry.pubkey === pubkey);

    if (existingIndex < 0) {
      return Response.json([], { status: 404 });
    }

    const patch = await request.json();
    memberRows[existingIndex] = { ...memberRows[existingIndex], ...patch };
    return Response.json([memberRows[existingIndex]]);
  }

  return Response.json({ message: 'method not allowed' }, { status: 405 });
}
