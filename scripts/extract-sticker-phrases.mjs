import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import sharp from "sharp";

const DATA_FILE = path.resolve("src/data/stickers.json");
const PHRASE_FILE = path.resolve("src/data/sticker-phrases.json");
const SHEET_DIR = path.resolve("public/images/sticker-sheets");
const MAX_PHRASES = 40;
const MIN_CONFIDENCE = 68;

// Only index phrases that closely match known useful expressions.  Stylized
// sticker lettering is difficult OCR, so substring matches are intentionally
// avoided: a near miss must never become searchable page copy.
const SAFE_PATTERNS = [
  /^(?:おはよう|おはよ|おはよー)$/u,
  /^(?:こんにちは|こんにちわ)$/u,
  /^(?:おやすみ|おやすみなさい)$/u,
  /^(?:またね|またあとで|じゃあね|ばいばい|バイバイ)$/u,
  /^(?:いってきます|行ってきます)$/u,
  /^(?:ただいま|帰ったよ|帰宅しました)$/u,
  /^(?:ありがとう|ありがとうございます|いつもありがとう|ありがと|ありがとー|感謝|サンキュー)$/u,
  /^(?:たすかった|助かった|助かりました)$/u,
  /^(?:うれしい|嬉しい|やった|やったー|最高)$/u,
  /^(?:さすが|すごい|すげー|えらい|天才)$/u,
  /^(?:がんばれ|がんばって|頑張れ|頑張って|ファイト|応援してる)$/u,
  /^(?:了解|りょうかい|OK|ok|オッケー|オッケ|おっけー|おっけ|承知しました)$/u,
  /^(?:ごめん|ごめんなさい|すみません|すいません|申し訳ない|申し訳ありません)$/u,
];

function normalize(text = "") {
  return text
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/[|¦]/g, "")
    .replace(/\s+/g, "")
    .replace(/^[\s・･,，.。!！?？:：;；~〜～ー_\-()（）\[\]{}「」『』【】<>＜＞'\"“”]+|[\s・･,，.。!！?？:：;；~〜～ー_\-()（）\[\]{}「」『』【】<>＜＞'\"“”]+$/g, "")
    .trim();
}

function isSafePhrase(text) {
  if (!text || text.length < 2 || text.length > 16) return false;
  if (!/[ぁ-んァ-ヶ一-龯A-Za-z]/u.test(text)) return false;
  if (/[0-9０-９]/u.test(text)) return false;
  return SAFE_PATTERNS.some((pattern) => pattern.test(text));
}

function parseTsv(tsv) {
  const lines = tsv.trim().split(/\r?\n/).slice(1);
  const grouped = new Map();
  for (const row of lines) {
    const cols = row.split("\t");
    if (cols.length < 12) continue;
    const conf = Number(cols[10]);
    const text = cols.slice(11).join("\t").trim();
    if (!text || !Number.isFinite(conf) || conf < 0) continue;
    const key = `${cols[1]}:${cols[2]}:${cols[3]}:${cols[4]}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push({ text, conf });
  }
  const found = [];
  for (const words of grouped.values()) {
    const text = normalize(words.map((word) => word.text).join(""));
    const conf = words.reduce((sum, word) => sum + word.conf, 0) / words.length;
    if (conf >= MIN_CONFIDENCE && isSafePhrase(text)) found.push(text);
  }
  return [...new Set(found)].slice(0, MAX_PHRASES);
}

async function ocrSheet(sheetPath) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "stamp-ocr-"));
  const prepared = path.join(tmpDir, "prepared.png");
  try {
    await sharp(sheetPath)
      .resize({ width: 1280, withoutEnlargement: false })
      .grayscale()
      .normalize()
      .sharpen()
      .png()
      .toFile(prepared);
    const tsv = execFileSync("tesseract", [prepared, "stdout", "-l", "jpn+eng", "--psm", "11", "tsv"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 8 * 1024 * 1024,
    });
    return parseTsv(tsv);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

async function main() {
  const stickers = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const current = fs.existsSync(PHRASE_FILE) ? JSON.parse(fs.readFileSync(PHRASE_FILE, "utf8")) : {};
  let changed = 0;
  let scanned = 0;
  for (const sticker of stickers) {
    const id = String(sticker.id);
    const sheetPath = path.join(SHEET_DIR, `${id}.webp`);
    if (!fs.existsSync(sheetPath)) continue;
    const existing = current[id];
    if (existing?.reviewed === true) continue;
    try {
      const phrases = await ocrSheet(sheetPath);
      scanned++;
      const old = Array.isArray(existing?.phrases) ? existing.phrases : [];
      if (JSON.stringify(old) !== JSON.stringify(phrases)) changed++;
      current[id] = { phrases, source: "ocr-curated", updatedAt: new Date().toISOString().slice(0, 10) };
      console.log(`${id}: ${phrases.length ? phrases.join(" / ") : "no safe phrases"}`);
    } catch (error) {
      console.warn(`${id}: OCR skipped (${error.message})`);
    }
  }
  fs.writeFileSync(PHRASE_FILE, `${JSON.stringify(current, null, 2)}\n`);
  console.log(`Phrase OCR: scanned ${scanned}, changed ${changed}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
