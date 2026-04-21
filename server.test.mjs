import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const TEST_PORT = 1 + Math.floor(Math.random() * 65534);
const TEST_DIR = path.join(os.tmpdir(), `nostr-test-${Date.now()}`);
const TEST_DB = path.join(TEST_DIR, 'test.sqlite');

process.env.PORT = String(TEST_PORT);
process.env.DATABASE_PATH = TEST_DB;
process.env.ADMIN_NPUBS = 'npub1testadmin00000000000000000000000000000000000000000000000000';
process.env.DATA_DIR = TEST_DIR;

const BASE = `http://127.0.0.1:${TEST_PORT}`;

let serverImport;

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
        headers: { Origin: 'http://localhost:4200' }
      });
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:4200');
      expect(res.headers.get('Access-Control-Allow-Headers')).toBeTruthy();
    });

    it('returns CORS headers for 127.0.0.1 origin', async () => {
      const res = await fetch(`${BASE}/api/health`, {
        method: 'OPTIONS',
        headers: { Origin: 'http://127.0.0.1:4200' }
      });
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://127.0.0.1:4200');
    });

    it('does not return CORS headers for unknown origin', async () => {
      const res = await fetch(`${BASE}/api/health`, {
        method: 'OPTIONS',
        headers: { Origin: 'https://evil.example.com' }
      });
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });

    it('sets CORS headers on GET responses for allowed origin', async () => {
      const res = await fetch(`${BASE}/api/health`, {
        headers: { Origin: 'http://localhost:4200' }
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
      const res = await fetch(`${BASE}/api/admin/pack-requests/somekey/approve`, { method: 'POST' });
      expect(res.status).toBe(401);
    });

    it('POST /api/admin/pack-requests/:pubkey/reject returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/admin/pack-requests/somekey/reject`, { method: 'POST' });
      expect(res.status).toBe(401);
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