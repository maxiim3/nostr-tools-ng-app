import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { nip19, verifyEvent } from 'nostr-tools';
import { unpackEventFromToken, validateEvent as validateNip98Event } from 'nostr-tools/nip98';

if (typeof Bun === 'undefined') {
  throw new Error('server.mjs must run with Bun.');
}

const PORT = Number.parseInt(process.env.PORT ?? '3000', 10);
const MAX_JSON_BODY_BYTES = 50 * 1024;
const MEMBERS_TABLE =
  process.env.SUPABASE_FRANCOPHONE_PACK_MEMBERS_TABLE ?? 'francophone_pack_members';
const ADMIN_NPUBS = new Set(
  (process.env.ADMIN_NPUBS ?? 'npub1zkse38pvfqlkcmcc7tw6zqecj7sqxe5lgj0u9ldylghmdjfppyqqtsa4du')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const browserDistDir = path.join(__dirname, 'dist', 'nostr-tools-ng-app', 'browser');
const browserDistRoot = path.resolve(browserDistDir);
const indexFilePath = path.join(browserDistDir, 'index.html');

const memberStorage = createFrancophonePackMemberStorage();

const server = Bun.serve({
  port: PORT,
  fetch: handleRequest,
});

console.log(`Server listening on http://127.0.0.1:${server.port}`);

export { server };

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

  if (request.method === 'GET' && requestUrl.pathname === '/api/pack-members/me') {
    try {
      const auth = await requireNostrAuth(request, undefined, false, requestUrl);
      const member = await memberStorage.findByPubkey(auth.pubkey);

      return jsonResponse(
        {
          status: member && !member.removedAt ? 'joined' : 'idle',
          member: member && !member.removedAt ? mapMemberRecord(member) : null,
        },
        { headers: corsHeaders }
      );
    } catch (error) {
      return handleApiError(error, corsHeaders);
    }
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/pack-members') {
    try {
      const body = await readJsonBody(request);
      const auth = await requireNostrAuth(request, body, false, requestUrl);
      const now = new Date().toISOString();
      const existingMember = await memberStorage.findByPubkey(auth.pubkey);

      const member = await memberStorage.upsert({
        pubkey: auth.pubkey,
        username: readProfileName(body, auth.npub),
        description: readOptionalString(body?.description),
        avatarUrl: readOptionalString(body?.avatarUrl) ?? readOptionalString(body?.imageUrl),
        joinedAt: existingMember && !existingMember.removedAt ? existingMember.joinedAt : now,
        followerCount: readOptionalNumber(body?.followerCount, 'followerCount'),
        followingCount: readOptionalNumber(body?.followingCount, 'followingCount'),
        accountCreatedAt: readOptionalIsoString(body?.accountCreatedAt, 'accountCreatedAt'),
        postCount: readOptionalNumber(body?.postCount, 'postCount'),
        zapCount: readOptionalNumber(body?.zapCount, 'zapCount'),
        requestedFromApp: true,
        requestedAt: existingMember && !existingMember.removedAt ? existingMember.requestedAt : now,
        removedAt: null,
      });

      return jsonResponse(mapMemberRecord(member), { status: 201, headers: corsHeaders });
    } catch (error) {
      return handleApiError(error, corsHeaders);
    }
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/admin/pack-members') {
    try {
      await requireNostrAuth(request, undefined, true, requestUrl);

      const records = await memberStorage.listActive();

      return jsonResponse(records.map(mapMemberRecord), { headers: corsHeaders });
    } catch (error) {
      return handleApiError(error, corsHeaders);
    }
  }

  const removeMatch = matchAdminMemberRemoveRoute(requestUrl.pathname);
  if (request.method === 'POST' && removeMatch) {
    try {
      const body = await readJsonBody(request);
      await requireNostrAuth(request, body, true, requestUrl);
      await memberStorage.remove(removeMatch.pubkey, new Date().toISOString());

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

function mapMemberRecord(record) {
  return {
    pubkey: record.pubkey,
    username: record.username,
    description: record.description,
    avatarUrl: record.avatarUrl,
    joinedAt: record.joinedAt,
    followerCount: record.followerCount,
    followingCount: record.followingCount,
    accountCreatedAt: record.accountCreatedAt,
    postCount: record.postCount,
    zapCount: record.zapCount,
    requestedFromApp: record.requestedFromApp,
    requestedAt: record.requestedAt,
    removedAt: record.removedAt,
  };
}

function readProfileName(body, fallbackNpub) {
  const username = readOptionalString(body?.username) ?? readOptionalString(body?.displayName);
  return username ?? `${fallbackNpub.slice(0, 12)}...`;
}

function readOptionalString(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  return value.trim();
}

function readOptionalNumber(value, fieldName) {
  if (value === null || typeof value === 'undefined') {
    return null;
  }

  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw createHttpError(400, `Invalid ${fieldName}.`);
  }

  return Math.trunc(value);
}

function readOptionalIsoString(value, fieldName) {
  const isoString = readOptionalString(value);
  if (!isoString) {
    return null;
  }

  if (Number.isNaN(new Date(isoString).getTime())) {
    throw createHttpError(400, `Invalid ${fieldName}.`);
  }

  return isoString;
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

function matchAdminMemberRemoveRoute(pathname) {
  const pattern = /^\/api\/admin\/pack-members\/([^/]+)\/remove$/;
  const match = pathname.match(pattern);

  if (!match) {
    return null;
  }

  return {
    pubkey: decodeURIComponent(match[1]),
  };
}

function createFrancophonePackMemberStorage() {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  }

  const tableUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent(MEMBERS_TABLE)}`;
  const baseHeaders = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  };

  return {
    async findByPubkey(pubkey) {
      const url = new URL(tableUrl);
      url.searchParams.set('pubkey', `eq.${pubkey}`);
      url.searchParams.set('select', '*');
      url.searchParams.set('limit', '1');

      const rows = await supabaseRequest(url, { headers: baseHeaders });
      return rows[0] ? mapSupabaseRow(rows[0]) : null;
    },

    async listActive() {
      const url = new URL(tableUrl);
      url.searchParams.set('removed_at', 'is.null');
      url.searchParams.set('select', '*');
      url.searchParams.set('order', 'joined_at.desc');

      const rows = await supabaseRequest(url, { headers: baseHeaders });
      return rows.map(mapSupabaseRow);
    },

    async upsert(member) {
      const url = new URL(tableUrl);
      url.searchParams.set('on_conflict', 'pubkey');

      const rows = await supabaseRequest(url, {
        method: 'POST',
        headers: {
          ...baseHeaders,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(mapMemberToSupabaseRow(member)),
      });

      return rows[0] ? mapSupabaseRow(rows[0]) : member;
    },

    async remove(pubkey, removedAt) {
      const existingMember = await this.findByPubkey(pubkey);
      if (!existingMember || existingMember.removedAt) {
        throw createHttpError(404, 'Member not found.');
      }

      const url = new URL(tableUrl);
      url.searchParams.set('pubkey', `eq.${pubkey}`);

      await supabaseRequest(url, {
        method: 'PATCH',
        headers: {
          ...baseHeaders,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ removed_at: removedAt }),
      });
    },
  };
}

async function supabaseRequest(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw createHttpError(502, message || 'Supabase request failed.');
  }

  if (response.status === 204) {
    return [];
  }

  return response.json();
}

function mapSupabaseRow(row) {
  return {
    pubkey: row.pubkey,
    username: row.username,
    description: row.description ?? null,
    avatarUrl: row.avatar_url ?? null,
    joinedAt: row.joined_at,
    followerCount: row.follower_count ?? null,
    followingCount: row.following_count ?? null,
    accountCreatedAt: row.account_created_at ?? null,
    postCount: row.post_count ?? null,
    zapCount: row.zap_count ?? null,
    requestedFromApp: Boolean(row.requested_from_app),
    requestedAt: row.requested_at ?? null,
    removedAt: row.removed_at ?? null,
  };
}

function mapMemberToSupabaseRow(member) {
  return {
    pubkey: member.pubkey,
    username: member.username,
    description: member.description,
    avatar_url: member.avatarUrl,
    joined_at: member.joinedAt,
    follower_count: member.followerCount,
    following_count: member.followingCount,
    account_created_at: member.accountCreatedAt,
    post_count: member.postCount,
    zap_count: member.zapCount,
    requested_from_app: member.requestedFromApp,
    requested_at: member.requestedAt,
    removed_at: member.removedAt,
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
