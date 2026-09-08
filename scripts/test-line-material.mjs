import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { buildLineMaterialZip, unzipEntries } from "../server/api/_line-materials.js";

const productId = String(process.argv[2] || process.env.LINE_PRODUCT_ID || "36313683").replace(/[^0-9]/g, "");
if (!productId) throw new Error("LINE product id is required");

const outDir = path.resolve("tmp/line-material-test", productId);
await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

console.log(`Building production-format material ZIP for LINE product ${productId}`);
const built = await buildLineMaterialZip({ id: productId, title: `LINE product ${productId}` });
await fs.writeFile(path.join(outDir, "sale-package.zip"), built.zip);

const entries = unzipEntries(built.zip);
const pngEntries = entries.filter((entry) => /^png\/\d+\.png$/i.test(entry.name));
const required = ["README.txt", "LICENSE.txt", "manifest.json"];
for (const name of required) {
  if (!entries.some((entry) => entry.name === name)) throw new Error(`missing sale package entry: ${name}`);
}
if (pngEntries.length !== built.assetCount) throw new Error(`sale ZIP PNG count mismatch: ${pngEntries.length} != ${built.assetCount}`);

const files = pngEntries.map((entry, index) => ({
  index: index + 1,
  filename: entry.name,
  bytes: entry.data.length,
  sha256: crypto.createHash("sha256").update(entry.data).digest("hex"),
}));

const report = {
  productId,
  ok: true,
  assetCount: built.assetCount,
  sourcePackage: built.sourcePackage,
  zipKey: built.zipKey,
  contentHash: built.contentHash,
  saleZipBytes: built.zip.length,
  requiredEntries: required,
  files,
  testedAt: new Date().toISOString(),
  note: "Dry-run only: no R2 upload, no catalog write, no publish, no Stripe call.",
};
await fs.writeFile(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
console.log(`Production packager dry-run passed: ${built.assetCount} PNGs, ${built.zip.length} bytes`);
console.log(`Would upload to: ${built.zipKey}`);
