import { getDigitalProduct, getDigitalProducts } from "./_store-catalog.js";
import { createStripeCheckoutSession, retrieveStripeCheckoutSession, stripeConfigured } from "./_stripe.js";
import { r2GetJson, r2PutJson } from "./_r2.js";
import { presignStoreDownload } from "./_store-r2.js";

function json(res, status, value) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(value));
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; if (raw.length > 100000) reject(new Error("Request too large")); });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error", reject);
  });
}

function orderKey(sessionId) {
  return `store-orders/${String(sessionId).replace(/[^a-zA-Z0-9_\-]/g, "")}.json`;
}

async function persistPaidOrder(session) {
  if (session?.payment_status !== "paid") return null;
  const product = getDigitalProduct(session?.metadata?.product_id);
  if (!product?.published || !product.zipKey) return null;
  const order = {
    sessionId: session.id,
    productId: product.id,
    amountTotal: session.amount_total,
    currency: session.currency,
    customerEmail: session.customer_details?.email || session.customer_email || "",
    paidAt: new Date().toISOString(),
  };
  await r2PutJson(orderKey(session.id), order);
  return order;
}

export default async function handler(req, res) {
  try {
    const action = String(req.query?.action || "status");

    if (req.method === "GET" && action === "status") {
      const products = getDigitalProducts();
      return json(res, 200, {
        ok: true,
        paymentProvider: "stripe",
        paymentConfigured: stripeConfigured(),
        priceYen: 500,
        productCount: products.length,
        publishedCount: products.filter((product) => product.published).length,
      });
    }

    if (req.method === "POST" && action === "checkout") {
      const body = await readBody(req);
      const product = getDigitalProduct(body.productId);
      if (!product) return json(res, 404, { ok: false, error: "商品が見つかりません。" });
      if (!product.published || !product.zipKey) return json(res, 409, { ok: false, error: "この商品はまだ販売準備中です。" });
      if (!stripeConfigured()) return json(res, 503, { ok: false, error: "決済はまだ有効化されていません。" });
      const origin = String(process.env.STORE_ORIGIN || "https://stamp-moke.jp").replace(/\/$/, "");
      const session = await createStripeCheckoutSession({ product, origin });
      return json(res, 200, { ok: true, checkoutUrl: session.url });
    }

    if (req.method === "GET" && action === "download") {
      const sessionId = String(req.query?.session_id || "");
      if (!sessionId.startsWith("cs_")) return json(res, 400, { ok: false, error: "購入情報が確認できません。" });
      let order = await r2GetJson(orderKey(sessionId), null);
      if (!order && stripeConfigured()) {
        const session = await retrieveStripeCheckoutSession(sessionId);
        order = await persistPaidOrder(session);
      }
      if (!order) return json(res, 409, { ok: false, pending: true, error: "決済確認中です。少ししてから再度お試しください。" });
      const product = getDigitalProduct(order.productId);
      if (!product?.published || !product.zipKey) return json(res, 410, { ok: false, error: "ダウンロード商品を確認できません。" });
      return json(res, 200, { ok: true, productId: product.id, title: product.title, downloadUrl: presignStoreDownload(product.zipKey, 600), expiresIn: 600 });
    }

    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { ok: false, error: "Method not allowed" });
  } catch (error) {
    console.error("store api error", error);
    return json(res, 500, { ok: false, error: "販売システムでエラーが発生しました。" });
  }
}
