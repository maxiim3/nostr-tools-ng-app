import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { nip19, verifyEvent } from 'nostr-tools';
import { unpackEventFromToken, validateEvent as validateNip98Event } from 'nostr-tools/nip98';

if (typeof Bun === 'undefined') {
  throw new Error('server.mjs must run with Bun.');
}

const { Database } = await import('bun:sqlite');

const PORT = Number.parseInt(process.env.PORT ?? '3000', 10);
const MAX_JSON_BODY_BYTES = 50 * 1024;
const ADMIN_NPUBS = new Set(
  (process.env.ADMIN_NPUBS ?? 'npub1zkse38pvfqlkcmcc7tw6zqecj7sqxe5lgj0u9ldylghmdjfppyqqtsa4du')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const browserDistDir = path.join(__dirname, 'dist', 'nostr-tools-ng-app', 'browser');
const databasePath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(
      process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, '.runtime'),
      'pack-requests.sqlite'
    );
const browserDistRoot = path.resolve(browserDistDir);
const indexFilePath = path.join(browserDistDir, 'index.html');

mkdirSync(path.dirname(databasePath), { recursive: true });

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS pack_requests (
    requester_pubkey TEXT PRIMARY KEY,
    requester_npub TEXT NOT NULL,
    display_name TEXT NOT NULL,
    image_url TEXT,
    question_id TEXT NOT NULL,
    choice_id TEXT NOT NULL,
    created TEXT NOT NULL,
    updated TEXT NOT NULL,
    status TEXT NOT NULL
  )
`;

let database = openDatabase();

const server = Bun.serve({
  port: PORT,
  fetch: handleRequest,
});

console.log(`Server listening on http://127.0.0.1:${server.port}`);

function openDatabase() {
  const db = new Database(databasePath);
  db.exec(CREATE_TABLE_SQL);
  return db;
}

function reopenDatabase() {
  try {
    database.close();
  } catch {
    // already closed or not openable
  }

  database = openDatabase();
}

function withDatabase(operation) {
  try {
    return operation(database);
  } catch (error) {
    if (error.message?.includes('readonly database')) {
      reopenDatabase();
      return operation(database);
    }

    throw error;
  }
}

async function handleRequest(request) {
  const requestUrl = buildRequestUrl(request);
  const corsHeaders = createCorsHeaders(request);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/health') {
    return jsonResponse({ ok: true }, { headers: corsHeaders });
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/lnurl') {
    try {
      const address = requestUrl.searchParams.get('address');
      const amount = Number.parseInt(requestUrl.searchParams.get('amount') ?? '', 10);

      if (!address || !amount || Number.isNaN(amount)) {
        return jsonResponse({ error: 'Invalid parameters' }, { status: 400, headers: corsHeaders });
      }

      const { name, domain } = parseLightningAddress(address);
      const metadataResponse = await fetch(
        `https://${domain}/.well-known/lnurlp/${encodeURIComponent(name)}`
      );

      if (!metadataResponse.ok) {
        throw new Error('Lightning address lookup failed');
      }

      const metadata = await metadataResponse.json();
      if (typeof metadata.callback !== 'string' || !metadata.callback) {
        throw new Error('Missing LNURL callback');
      }

      if (typeof metadata.minSendable === 'number' && amount < metadata.minSendable) {
        throw new Error('Amount below minimum');
      }

      if (typeof metadata.maxSendable === 'number' && amount > metadata.maxSendable) {
        throw new Error('Amount above maximum');
      }

      const url = new URL(metadata.callback);
      url.searchParams.set('amount', amount.toString());

      const lnurlResponse = await fetch(url.toString());
      if (!lnurlResponse.ok) {
        throw new Error('LNURL request failed');
      }

      const data = await lnurlResponse.json();
      if (typeof data.pr !== 'string' || !data.pr) {
        throw new Error('Invalid invoice response');
      }

      return jsonResponse({ pr: data.pr }, { headers: corsHeaders });
    } catch (error) {
      console.error('LNURL error:', error);
      return jsonResponse(
        { error: 'Failed to generate invoice' },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/pack-requests/me') {
    try {
      const auth = await requireNostrAuth(request, undefined, false, requestUrl);
      const record = findRequestByPubkey(auth.pubkey);

      return jsonResponse(
        {
          status: record ? mapRecordStatus(record.status) : 'idle',
        },
        { headers: corsHeaders }
      );
    } catch (error) {
      return handleApiError(error, corsHeaders);
    }
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/pack-requests') {
    try {
      const body = await readJsonBody(request);
      const auth = await requireNostrAuth(request, body, false, requestUrl);
      const questionId = readRequiredString(body?.questionId, 'questionId');
      const choiceId = readRequiredString(body?.choiceId, 'choiceId');
      const displayName = readRequiredString(body?.displayName, 'displayName');
      const imageUrl = readOptionalString(body?.imageUrl);
      const existingRecord = findRequestByPubkey(auth.pubkey);
      const now = new Date().toISOString();

      upsertPackRequest({
        requesterPubkey: auth.pubkey,
        requesterNpub: auth.npub,
        displayName,
        imageUrl,
        questionId,
        choiceId,
        created: existingRecord?.created ?? now,
        updated: now,
        status: 'pending',
      });

      return new Response(null, { status: 204, headers: corsHeaders });
    } catch (error) {
      return handleApiError(error, corsHeaders);
    }
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/admin/pack-requests') {
    try {
      await requireNostrAuth(request, undefined, true, requestUrl);

      const records = listPackRequests()
        .filter((record) => record.status === 'pending')
        .reverse()
        .map(mapAdminRecord);

      return jsonResponse(records, { headers: corsHeaders });
    } catch (error) {
      return handleApiError(error, corsHeaders);
    }
  }

  const approveMatch = matchAdminActionRoute(requestUrl.pathname, 'approve');
  if (request.method === 'POST' && approveMatch) {
    try {
      const body = await readJsonBody(request);
      await requireNostrAuth(request, body, true, requestUrl);
      deletePackRequest(approveMatch.pubkey);

      return new Response(null, { status: 204, headers: corsHeaders });
    } catch (error) {
      return handleApiError(error, corsHeaders);
    }
  }

  const rejectMatch = matchAdminActionRoute(requestUrl.pathname, 'reject');
  if (request.method === 'POST' && rejectMatch) {
    try {
      const body = await readJsonBody(request);
      await requireNostrAuth(request, body, true, requestUrl);
      deletePackRequest(rejectMatch.pubkey);

      return new Response(null, { status: 204, headers: corsHeaders });
    } catch (error) {
      return handleApiError(error, corsHeaders);
    }
  }

  if (requestUrl.pathname.startsWith('/api/')) {
    return jsonResponse({ message: 'Not found.' }, { status: 404, headers: corsHeaders });
  }

  return serveClientApp(requestUrl.pathname);
}

function findRequestByPubkey(pubkey) {
  return (
    withDatabase((db) =>
      createStatement(
        db,

        `SELECT requester_pubkey AS requesterPubkey, requester_npub AS requesterNpub,
                  display_name AS displayName, image_url AS imageUrl, question_id AS questionId,
                  choice_id AS choiceId, created, updated, status
            FROM pack_requests
            WHERE requester_pubkey = ?`
      ).get(pubkey)
    ) ?? null
  );
}

function listPackRequests() {
  return withDatabase((db) =>
    createStatement(
      db,
      `SELECT requester_pubkey AS requesterPubkey, requester_npub AS requesterNpub,
                display_name AS displayName, image_url AS imageUrl, question_id AS questionId,
                choice_id AS choiceId, created, updated, status
          FROM pack_requests
          ORDER BY created ASC`
    ).all()
  );
}

function upsertPackRequest(record) {
  withDatabase((db) =>
    createStatement(
      db,
      `INSERT INTO pack_requests (
          requester_pubkey,
          requester_npub,
          display_name,
          image_url,
          question_id,
          choice_id,
          created,
          updated,
          status
        ) VALUES (
          @requesterPubkey,
          @requesterNpub,
          @displayName,
          @imageUrl,
          @questionId,
          @choiceId,
          @created,
          @updated,
          @status
        )
        ON CONFLICT(requester_pubkey) DO UPDATE SET
          requester_npub = excluded.requester_npub,
          display_name = excluded.display_name,
          image_url = excluded.image_url,
          question_id = excluded.question_id,
          choice_id = excluded.choice_id,
          created = excluded.created,
          updated = excluded.updated,
          status = excluded.status`
    ).run(record)
  );
}

function deletePackRequest(pubkey) {
  if (!findRequestByPubkey(pubkey)) {
    throw createHttpError(404, 'Request not found.');
  }

  withDatabase((db) =>
    createStatement(
      db,
      `DELETE FROM pack_requests
        WHERE requester_pubkey = ?`
    ).run(pubkey)
  );
}

async function requireNostrAuth(
  request,
  body,
  requireAdmin = false,
  requestUrl = buildRequestUrl(request)
) {
  const authorization = request.headers.get('authorization');
  if (!authorization) {
    throw createHttpError(401, 'Missing Nostr authorization header.');
  }

  let event;
  try {
    event = await unpackEventFromToken(authorization);
  } catch {
    throw createHttpError(401, 'Invalid Nostr authorization token.');
  }

  const requestUrls = buildCandidateAuthUrls(requestUrl);
  const isValid = await validateNostrRequest(event, requestUrls, request.method, body);

  if (!isValid) {
    throw createHttpError(401, 'Invalid Nostr authorization token.');
  }

  const npub = nip19.npubEncode(event.pubkey);
  if (requireAdmin && !ADMIN_NPUBS.has(npub)) {
    throw createHttpError(403, 'Admin permissions are required.');
  }

  return {
    pubkey: event.pubkey,
    npub,
  };
}

async function validateNostrRequest(event, requestUrls, method, body) {
  if (!verifyEvent(event)) {
    return false;
  }

  for (const requestUrl of requestUrls) {
    try {
      await validateNip98Event(event, requestUrl, method, body);
      return true;
    } catch {
      continue;
    }
  }

  return false;
}

function buildRequestUrl(request) {
  const url = new URL(request.url);
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host');

  if (forwardedProto) {
    url.protocol = `${forwardedProto}:`;
  }

  if (host) {
    url.host = host;
  }

  return url;
}

function buildCandidateAuthUrls(requestUrl) {
  const primaryUrl = requestUrl.toString();

  try {
    if (!isLoopbackHost(requestUrl.hostname)) {
      return [primaryUrl];
    }

    const alternateUrl = new URL(primaryUrl);
    alternateUrl.hostname = requestUrl.hostname === 'localhost' ? '127.0.0.1' : 'localhost';

    return [primaryUrl, alternateUrl.toString()];
  } catch {
    return [primaryUrl];
  }
}

function isLoopbackHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function mapRecordStatus(status) {
  if (status === 'pending') {
    return 'pending';
  }

  return 'idle';
}

function mapAdminRecord(record) {
  return {
    requesterPubkey: record.requesterPubkey,
    requesterNpub: record.requesterNpub,
    displayName: record.displayName,
    imageUrl: record.imageUrl ?? null,
    created: record.created,
    status: record.status,
  };
}

function readRequiredString(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw createHttpError(400, `Invalid ${fieldName}.`);
  }

  return value.trim();
}

function readOptionalString(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  return value.trim();
}

async function readJsonBody(request) {
  const contentLength = request.headers.get('content-length');
  if (contentLength && Number.parseInt(contentLength, 10) > MAX_JSON_BODY_BYTES) {
    throw createHttpError(413, 'Request body too large.');
  }

  const rawBody = await request.text();
  if (!rawBody) {
    return {};
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_JSON_BODY_BYTES) {
    throw createHttpError(413, 'Request body too large.');
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw createHttpError(400, 'Invalid JSON body.');
  }
}

function createCorsHeaders(request) {
  const headers = new Headers();
  const origin = request.headers.get('origin');

  if (origin === 'http://localhost:4200' || origin === 'http://127.0.0.1:4200') {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Vary', 'Origin');
  }

  return headers;
}

function parseLightningAddress(address) {
  if (typeof address !== 'string') {
    throw new Error('Invalid lightning address');
  }

  const [name, domain] = address.trim().split('@');
  if (!name || !domain) {
    throw new Error('Invalid lightning address');
  }

  return { name, domain };
}

function createStatement(database, sql) {
  return typeof database.prepare === 'function' ? database.prepare(sql) : database.query(sql);
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function handleApiError(error, corsHeaders) {
  const status = typeof error?.status === 'number' ? error.status : 500;
  const message = error instanceof Error ? error.message : 'Unexpected server error.';

  if (status >= 500) {
    console.error(error);
  }

  return jsonResponse({ message }, { status, headers: corsHeaders });
}

function jsonResponse(body, init = {}) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

function matchAdminActionRoute(pathname, action) {
  const pattern = new RegExp(`^/api/admin/pack-requests/([^/]+)/${action}$`);
  const match = pathname.match(pattern);

  if (!match) {
    return null;
  }

  return {
    pubkey: decodeURIComponent(match[1]),
  };
}

async function serveClientApp(pathname) {
  const assetPath = resolveAssetPath(pathname);

  if (assetPath) {
    const assetFile = Bun.file(assetPath);
    if (await assetFile.exists()) {
      return fileResponse(assetFile);
    }
  }

  if (path.extname(pathname)) {
    return new Response('Not found.', { status: 404 });
  }

  return fileResponse(Bun.file(indexFilePath));
}

function resolveAssetPath(pathname) {
  const relativePath = pathname === '/' ? 'index.html' : normalizePathname(pathname);
  if (!relativePath) {
    return null;
  }

  const assetPath = path.resolve(browserDistRoot, relativePath);
  if (assetPath !== browserDistRoot && !assetPath.startsWith(`${browserDistRoot}${path.sep}`)) {
    return null;
  }

  return assetPath;
}

function normalizePathname(pathname) {
  try {
    return decodeURIComponent(pathname).replace(/^\/+/, '');
  } catch {
    return null;
  }
}

function fileResponse(file) {
  const headers = new Headers();
  if (file.type) {
    headers.set('Content-Type', file.type);
  }

  return new Response(file, { headers });
}
