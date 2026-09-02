import crypto from "node:crypto";

const REGION = "auto";
const SERVICE = "s3";

function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function encodePath(path) {
  return String(path).split("/").map((part) => encodeURIComponent(part)).join("/");
}

function endpoint() {
  return `${env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`;
}

function bucket() {
  return env("R2_BUCKET_NAME");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hmac(key, value, encoding) {
  return crypto.createHmac("sha256", key).update(value).digest(encoding);
}

function signingKey(secret, dateStamp) {
  const kDate = hmac(`AWS4${secret}`, dateStamp);
  const kRegion = hmac(kDate, REGION);
  const kService = hmac(kRegion, SERVICE);
  return hmac(kService, "aws4_request");
}

function amzDate(date = new Date()) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function canonicalQuery(params) {
  return [...params.entries()]
    .sort(([aKey, aVal], [bKey, bVal]) => aKey === bKey ? aVal.localeCompare(bVal) : aKey.localeCompare(bKey))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value).replace(/%7E/g, "~")}`)
    .join("&");
}

export function r2Configured() {
  return {
    accountId: Boolean(process.env.R2_ACCOUNT_ID),
    bucketName: Boolean(process.env.R2_BUCKET_NAME),
    accessKeyId: Boolean(process.env.R2_ACCESS_KEY_ID),
    secretAccessKey: Boolean(process.env.R2_SECRET_ACCESS_KEY),
  };
}

export function r2Key(prefix, filename = "file") {
  const safe = String(filename).normalize("NFKC").replace(/[^a-zA-Z0-9._\-\u3040-\u30ff\u3400-\u9fff]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "file";
  return `${prefix}/${Date.now()}-${crypto.randomBytes(5).toString("hex")}-${safe}`;
}

export function presignR2Put(key, expiresSeconds = 900) {
  const accessKey = env("R2_ACCESS_KEY_ID");
  const secret = env("R2_SECRET_ACCESS_KEY");
  const host = endpoint();
  const now = new Date();
  const date = amzDate(now);
  const dateStamp = date.slice(0, 8);
  const scope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const uri = `/${encodeURIComponent(bucket())}/${encodePath(key)}`;
  const params = new URLSearchParams();
  params.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
  params.set("X-Amz-Credential", `${accessKey}/${scope}`);
  params.set("X-Amz-Date", date);
  params.set("X-Amz-Expires", String(Math.min(Math.max(expiresSeconds, 60), 3600)));
  params.set("X-Amz-SignedHeaders", "host");
  const query = canonicalQuery(params);
  const canonicalRequest = ["PUT", uri, query, `host:${host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", date, scope, sha256(canonicalRequest)].join("\n");
  const signature = hmac(signingKey(secret, dateStamp), stringToSign, "hex");
  return `https://${host}${uri}?${query}&X-Amz-Signature=${signature}`;
}

async function signedFetch(method, key, { body, contentType, query = {} } = {}) {
  const accessKey = env("R2_ACCESS_KEY_ID");
  const secret = env("R2_SECRET_ACCESS_KEY");
  const host = endpoint();
  const now = new Date();
  const date = amzDate(now);
  const dateStamp = date.slice(0, 8);
  const payload = body == null ? Buffer.alloc(0) : Buffer.isBuffer(body) ? body : Buffer.from(body);
  const payloadHash = sha256(payload);
  const uri = `/${encodeURIComponent(bucket())}${key ? `/${encodePath(key)}` : ""}`;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => { if (v != null) params.set(k, String(v)); });
  const canonicalQ = canonicalQuery(params);
  const headers = { host, "x-amz-content-sha256": payloadHash, "x-amz-date": date };
  if (contentType) headers["content-type"] = contentType;
  const signedNames = Object.keys(headers).sort();
  const canonicalHeaders = signedNames.map((name) => `${name}:${headers[name].trim()}\n`).join("");
  const signedHeaders = signedNames.join(";");
  const canonicalRequest = [method, uri, canonicalQ, canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const scope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", date, scope, sha256(canonicalRequest)].join("\n");
  const signature = hmac(signingKey(secret, dateStamp), stringToSign, "hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const url = `https://${host}${uri}${canonicalQ ? `?${canonicalQ}` : ""}`;
  const requestHeaders = { Authorization: authorization, "x-amz-content-sha256": payloadHash, "x-amz-date": date };
  if (contentType) requestHeaders["Content-Type"] = contentType;
  return fetch(url, { method, headers: requestHeaders, body: method === "GET" || method === "HEAD" || method === "DELETE" ? undefined : payload });
}

export async function r2Get(key) {
  const response = await signedFetch("GET", key);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`R2 GET ${response.status}: ${await response.text()}`);
  return response;
}

export async function r2GetBuffer(key) {
  const response = await r2Get(key);
  if (!response) return null;
  return { buffer: Buffer.from(await response.arrayBuffer()), contentType: response.headers.get("content-type") || "application/octet-stream" };
}

export async function r2GetJson(key, fallback = null) {
  const response = await r2Get(key);
  if (!response) return fallback;
  return response.json();
}

export async function r2Put(key, body, contentType = "application/octet-stream") {
  const response = await signedFetch("PUT", key, { body, contentType });
  if (!response.ok) throw new Error(`R2 PUT ${response.status}: ${await response.text()}`);
  return { key };
}

export async function r2PutJson(key, value) {
  return r2Put(key, JSON.stringify(value), "application/json; charset=utf-8");
}

export async function r2Head(key) {
  const response = await signedFetch("HEAD", key);
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`R2 HEAD ${response.status}: ${await response.text()}`);
  return true;
}

export async function r2Delete(key) {
  const safeKey = String(key || "");
  if (!safeKey.startsWith("free-assets/")) throw new Error("Refusing to delete outside free-assets/");
  const response = await signedFetch("DELETE", safeKey);
  if (response.status === 404) return { key: safeKey, deleted: false, missing: true };
  if (!response.ok) throw new Error(`R2 DELETE ${response.status}: ${await response.text()}`);
  return { key: safeKey, deleted: true };
}

function decodeXml(value = "") {
  return String(value).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&amp;/g, "&");
}

export async function r2ListKeys(prefix, limit = 5000) {
  const safePrefix = String(prefix || "");
  if (!safePrefix.startsWith("free-assets/")) throw new Error("Refusing to list outside free-assets/");
  const keys = [];
  let token = "";
  while (keys.length < limit) {
    const query = { "list-type": "2", prefix: safePrefix, "max-keys": Math.min(1000, limit - keys.length) };
    if (token) query["continuation-token"] = token;
    const response = await signedFetch("GET", "", { query });
    if (!response.ok) throw new Error(`R2 LIST ${response.status}: ${await response.text()}`);
    const xml = await response.text();
    for (const match of xml.matchAll(/<Key>([\s\S]*?)<\/Key>/g)) keys.push(decodeXml(match[1]));
    const truncated = /<IsTruncated>true<\/IsTruncated>/.test(xml);
    if (!truncated) break;
    token = decodeXml(xml.match(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/)?.[1] || "");
    if (!token) break;
  }
  return keys.slice(0, limit);
}
