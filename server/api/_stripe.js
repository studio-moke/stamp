import crypto from "node:crypto";

export const STORE_PRICE_YEN = 150;

function secretKey() {
  const value = process.env.STRIPE_SECRET_KEY;
  if (!value) throw new Error("STRIPE_SECRET_KEY is not configured");
  return value;
}

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export async function createStripeCheckoutSession({ product, origin }) {
  if (Number(product?.priceYen) !== STORE_PRICE_YEN) throw new Error("Store price must be exactly 150 JPY");
  if (!/^[0-9]{6,20}$/.test(String(product?.id || ""))) throw new Error("Invalid store product id");
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", `${origin}/materials/success/?session_id={CHECKOUT_SESSION_ID}`);
  body.set("cancel_url", `${origin}/materials/`);
  body.set("automatic_payment_methods[enabled]", "true");
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", "jpy");
  body.set("line_items[0][price_data][unit_amount]", String(STORE_PRICE_YEN));
  body.set("line_items[0][price_data][product_data][name]", `${product.title}｜商用利用OK PNG素材`);
  body.set("metadata[product_id]", product.id);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Stripe checkout failed: ${response.status}`);
  return data;
}

export async function retrieveStripeCheckoutSession(sessionId) {
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Stripe session lookup failed: ${response.status}`);
  return data;
}

function timingSafeEqualText(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function verifyStripeWebhookSignature(rawBody, signatureHeader, toleranceSeconds = 300) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  const parts = String(signatureHeader || "").split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || !signatures.length) return false;
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSeconds) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  return signatures.some((signature) => timingSafeEqualText(expected, signature));
}
