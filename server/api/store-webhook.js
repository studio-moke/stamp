import { getDigitalProduct } from "./_store-catalog.js";
import { verifyStripeWebhookSignature } from "./_stripe.js";
import { r2PutJson } from "./_r2.js";

function orderKey(sessionId) {
  return `store-orders/${String(sessionId).replace(/[^a-zA-Z0-9_\-]/g, "")}.json`;
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 1000000) return reject(new Error("Request too large"));
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end("Method not allowed");
  }
  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers["stripe-signature"];
    if (!verifyStripeWebhookSignature(rawBody, signature)) {
      res.statusCode = 400;
      return res.end("Invalid signature");
    }
    const event = JSON.parse(rawBody);
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data?.object;
      if (session?.payment_status === "paid") {
        const product = getDigitalProduct(session.metadata?.product_id);
        if (product?.published && product.zipKey) {
          await r2PutJson(orderKey(session.id), {
            sessionId: session.id,
            productId: product.id,
            amountTotal: session.amount_total,
            currency: session.currency,
            customerEmail: session.customer_details?.email || session.customer_email || "",
            paidAt: new Date().toISOString(),
            eventId: event.id,
          });
        }
      }
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({ received: true }));
  } catch (error) {
    console.error("store webhook error", error);
    res.statusCode = 400;
    return res.end("Webhook error");
  }
}
