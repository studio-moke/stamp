import crypto from "node:crypto";

const REGION = "auto";
const SERVICE = "s3";

function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}
function hmac(key, value, encoding) { return crypto.createHmac("sha256", key).update(value).digest(encoding); }
function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function signingKey(secret, dateStamp) {
  const kDate = hmac(`AWS4${secret}`, dateStamp);
  const kRegion = hmac(kDate, REGION);
  const kService = hmac(kRegion, SERVICE);
  return hmac(kService, "aws4_request");
}
function amzDate(date = new Date()) { return date.toISOString().replace(/[:-]|\.\d{3}/g, ""); }
function encodePath(path) { return String(path).split("/").map((part) => encodeURIComponent(part)).join("/"); }
function canonicalQuery(params) {
  return [...params.entries()].sort(([ak,av],[bk,bv]) => ak === bk ? av.localeCompare(bv) : ak.localeCompare(bk))
    .map(([key,value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value).replace(/%7E/g,"~")}`).join("&");
}

export function presignStoreDownload(key, expiresSeconds = 600) {
  const safeKey = String(key || "");
  if (!safeKey.startsWith("digital-products/")) throw new Error("Refusing to sign outside digital-products/");
  const accessKey = env("R2_ACCESS_KEY_ID");
  const secret = env("R2_SECRET_ACCESS_KEY");
  const bucket = env("R2_BUCKET_NAME");
  const host = `${env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`;
  const date = amzDate();
  const dateStamp = date.slice(0, 8);
  const scope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const uri = `/${encodeURIComponent(bucket)}/${encodePath(safeKey)}`;
  const params = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${accessKey}/${scope}`,
    "X-Amz-Date": date,
    "X-Amz-Expires": String(Math.min(Math.max(expiresSeconds, 60), 3600)),
    "X-Amz-SignedHeaders": "host",
  });
  const query = canonicalQuery(params);
  const canonicalRequest = ["GET", uri, query, `host:${host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", date, scope, sha256(canonicalRequest)].join("\n");
  const signature = hmac(signingKey(secret, dateStamp), stringToSign, "hex");
  return `https://${host}${uri}?${query}&X-Amz-Signature=${signature}`;
}
