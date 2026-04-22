import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Database } from 'bun:sqlite';
import { finalizeEvent, generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';
import { getToken } from 'nostr-tools/nip98';

const TEST_PORT = 1 + Math.floor(Math.random() * 65534);
const TEST_DIR = path.join(os.tmpdir(), `nostr-test-${Date.now()}`);
const TEST_DB = path.join(TEST_DIR, 'test.sqlite');
const USER_SECRET_KEY = generateSecretKey();
const ADMIN_SECRET_KEY = generateSecretKey();
const USER_PUBKEY = getPublicKey(USER_SECRET_KEY);
const USER_NPUB = nip19.npubEncode(USER_PUBKEY);
const ADMIN_NPUB = nip19.npubEncode(getPublicKey(ADMIN_SECRET_KEY));

process.env.PORT = String(TEST_PORT);
process.env.DATABASE_PATH = TEST_DB;
process.env.ADMIN_NPUBS = ADMIN_NPUB;
process.env.DATA_DIR = TEST_DIR;

const BASE = `http://127.0.0.1:${TEST_PORT}`;

let serverImport;

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

function findRequestRecord(pubkey) {
  const database = new Database(TEST_DB, { readonly: true });

  try {
    return database
      .query(
        `SELECT requester_pubkey AS requesterPubkey, requester_npub AS requesterNpub,
                display_name AS displayName, image_url AS imageUrl, status
           FROM pack_requests
          WHERE requester_pubkey = ?`
      )
      .get(pubkey);
  } finally {
    database.close();
  }
}

describe('server.mjs integration', () => {
  beforeAll(async () => {
    mkdirSync(TEST_DIR, { recursive: true });
    serverImport = await import('./server.mjs');
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  afterAll(() => {
    try {
      rmSync(TEST_DIR, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  describe('GET /api/health', () => {
    it('returns ok', async () => {
      const res = await fetch(`${BASE}/api/health`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
    });
  });

  describe('CORS', () => {
    it('returns CORS headers for allowed origins on OPTIONS', async () => {
      const res = await fetch(`${BASE}/api/health`, {
        method: 'OPTIONS',
        headers: { Origin: 'http://localhost:4200' },
      });
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:4200');
      expect(res.headers.get('Access-Control-Allow-Headers')).toBeTruthy();
    });

    it('returns CORS headers for 127.0.0.1 origin', async () => {
      const res = await fetch(`${BASE}/api/health`, {
        method: 'OPTIONS',
        headers: { Origin: 'http://127.0.0.1:4200' },
      });
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://127.0.0.1:4200');
    });

    it('does not return CORS headers for unknown origin', async () => {
      const res = await fetch(`${BASE}/api/health`, {
        method: 'OPTIONS',
        headers: { Origin: 'https://evil.example.com' },
      });
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });

    it('sets CORS headers on GET responses for allowed origin', async () => {
      const res = await fetch(`${BASE}/api/health`, {
        headers: { Origin: 'http://localhost:4200' },
      });
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:4200');
    });
  });

  describe('Auth enforcement', () => {
    it('GET /api/pack-requests/me returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/pack-requests/me`);
      expect(res.status).toBe(401);
    });

    it('POST /api/pack-requests returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/pack-requests`, { method: 'POST' });
      expect(res.status).toBe(401);
    });

    it('GET /api/admin/pack-requests returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/admin/pack-requests`);
      expect(res.status).toBe(401);
    });

    it('POST /api/admin/pack-requests/:pubkey/approve returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/admin/pack-requests/somekey/approve`, {
        method: 'POST',
      });
      expect(res.status).toBe(401);
    });

    it('POST /api/admin/pack-requests/:pubkey/reject returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/admin/pack-requests/somekey/reject`, { method: 'POST' });
      expect(res.status).toBe(401);
    });
  });

  describe('Pack request lifecycle', () => {
    it('creates a pack request and persists requester npub', async () => {
      const url = `${BASE}/api/pack-requests`;
      const body = {
        displayName: 'Alice',
        imageUrl: 'https://example.com/alice.png',
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

      expect(response.status).toBe(204);

      const record = findRequestRecord(USER_PUBKEY);
      expect(record).toBeTruthy();
      expect(record.requesterPubkey).toBe(USER_PUBKEY);
      expect(record.requesterNpub).toBe(USER_NPUB);
      expect(record.displayName).toBe('Alice');
      expect(record.status).toBe('pending');
    });

    it('returns pending status for authenticated requester', async () => {
      const url = `${BASE}/api/pack-requests/me`;
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
      expect(body).toEqual({ status: 'pending' });
    });

    it('lists pending requests for authenticated admin', async () => {
      const url = `${BASE}/api/admin/pack-requests`;
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
      expect(body.some((entry) => entry.requesterPubkey === USER_PUBKEY)).toBe(true);
    });
  });

  describe('LNURL proxy', () => {
    it('returns 400 for missing address', async () => {
      const res = await fetch(`${BASE}/api/lnurl?amount=1000`);
      expect(res.status).toBe(400);
    });

    it('returns 400 for missing amount', async () => {
      const res = await fetch(`${BASE}/api/lnurl?address=test@example.com`);
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid amount', async () => {
      const res = await fetch(`${BASE}/api/lnurl?address=test@example.com&amount=abc`);
      expect(res.status).toBe(400);
    });
  });

  describe('API catch-all', () => {
    it('returns 404 for unknown API routes', async () => {
      const res = await fetch(`${BASE}/api/nonexistent`);
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.message).toBe('Not found.');
    });
  });
});
