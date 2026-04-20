import express from 'express';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

import { nip19, verifyEvent } from 'nostr-tools';
import { unpackEventFromToken, validateEvent as validateNip98Event } from 'nostr-tools/nip98';

const PORT = Number.parseInt(process.env.PORT ?? '3000', 10);
const ADMIN_NPUBS = new Set(
  (process.env.ADMIN_NPUBS ??
    'npub1zkse38pvfqlkcmcc7tw6zqecj7sqxe5lgj0u9ldylghmdjfppyqqtsa4du')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const browserDistDir = path.join(__dirname, 'dist', 'nostr-tools-ng-app', 'browser');
const dataDir = path.join(__dirname, '.runtime');
const databasePath = path.join(dataDir, 'pack-requests.sqlite');

mkdirSync(dataDir, { recursive: true });

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

const app = express();

app.set('trust proxy', true);
app.disable('x-powered-by');
app.use(express.json({ limit: '50kb' }));
app.use(withCors);

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

app.get('/api/pack-requests/me', async (request, response) => {
  try {
    const auth = await requireNostrAuth(request);
    const record = findRequestByPubkey(auth.pubkey);

    response.json({
      status: record ? mapRecordStatus(record.status) : 'idle'
    });
  } catch (error) {
    handleApiError(response, error);
  }
});

app.post('/api/pack-requests', async (request, response) => {
  try {
    const auth = await requireNostrAuth(request, request.body);
    const questionId = readRequiredString(request.body?.questionId, 'questionId');
    const choiceId = readRequiredString(request.body?.choiceId, 'choiceId');
    const displayName = readRequiredString(request.body?.displayName, 'displayName');
    const imageUrl = readOptionalString(request.body?.imageUrl);
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
      status: 'pending'
    });

    response.status(204).end();
  } catch (error) {
    handleApiError(response, error);
  }
});

app.get('/api/admin/pack-requests', async (request, response) => {
  try {
    await requireNostrAuth(request, undefined, true);

    const records = listPackRequests()
      .filter((record) => record.status === 'pending')
      .reverse()
      .map(mapAdminRecord);

    response.json(records);
  } catch (error) {
    handleApiError(response, error);
  }
});

app.post('/api/admin/pack-requests/:pubkey/approve', async (request, response) => {
  try {
    await requireNostrAuth(request, request.body, true);
    deletePackRequest(request.params.pubkey);

    response.status(204).end();
  } catch (error) {
    handleApiError(response, error);
  }
});

app.post('/api/admin/pack-requests/:pubkey/reject', async (request, response) => {
  try {
    await requireNostrAuth(request, request.body, true);
    deletePackRequest(request.params.pubkey);

    response.status(204).end();
  } catch (error) {
    handleApiError(response, error);
  }
});

app.use(express.static(browserDistDir, { index: false }));
app.get(/.*/, (_request, response) => {
  response.sendFile(path.join(browserDistDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://127.0.0.1:${PORT}`);
});

function findRequestByPubkey(pubkey) {
  return (
    withDatabase((db) =>
      db
        .prepare(
          `SELECT requester_pubkey AS requesterPubkey, requester_npub AS requesterNpub,
                  display_name AS displayName, image_url AS imageUrl, question_id AS questionId,
                  choice_id AS choiceId, created, updated, status
           FROM pack_requests
           WHERE requester_pubkey = ?`
        )
        .get(pubkey)
    ) ?? null
  );
}

function listPackRequests() {
  return withDatabase((db) =>
    db
      .prepare(
        `SELECT requester_pubkey AS requesterPubkey, requester_npub AS requesterNpub,
                display_name AS displayName, image_url AS imageUrl, question_id AS questionId,
                choice_id AS choiceId, created, updated, status
         FROM pack_requests
         ORDER BY created ASC`
      )
      .all()
  );
}

function upsertPackRequest(record) {
  withDatabase((db) =>
    db
      .prepare(
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
      )
      .run(record)
  );
}

function deletePackRequest(pubkey) {
  const result = withDatabase((db) =>
    db
      .prepare(
        `DELETE FROM pack_requests
         WHERE requester_pubkey = ?`
      )
      .run(pubkey)
  );

  if (result.changes === 0) {
    throw createHttpError(404, 'Request not found.');
  }
}

async function requireNostrAuth(request, body, requireAdmin = false) {
  const authorization = request.header('authorization');
  if (!authorization) {
    throw createHttpError(401, 'Missing Nostr authorization header.');
  }

  let event;
  try {
    event = await unpackEventFromToken(authorization);
  } catch {
    throw createHttpError(401, 'Invalid Nostr authorization token.');
  }

  const requestUrls = buildCandidateAuthUrls(request);
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
    npub
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

function buildCandidateAuthUrls(request) {
  const requestUrl = `${request.protocol}://${request.get('host')}${request.originalUrl}`;

  try {
    const url = new URL(requestUrl);
    if (!isLoopbackHost(url.hostname)) {
      return [requestUrl];
    }

    const alternateHost = url.hostname === 'localhost' ? '127.0.0.1' : 'localhost';
    const alternateUrl = new URL(requestUrl);
    alternateUrl.hostname = alternateHost;

    return [requestUrl, alternateUrl.toString()];
  } catch {
    return [requestUrl];
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
    status: record.status
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

function withCors(request, response, next) {
  const origin = request.header('origin');
  if (origin === 'http://localhost:4200' || origin === 'http://127.0.0.1:4200') {
    response.header('Access-Control-Allow-Origin', origin);
    response.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    response.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  next();
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function handleApiError(response, error) {
  const status = typeof error?.status === 'number' ? error.status : 500;
  const message = error instanceof Error ? error.message : 'Unexpected server error.';

  if (status >= 500) {
    console.error(error);
  }

  response.status(status).json({ message });
}
