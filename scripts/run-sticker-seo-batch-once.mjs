import fs from "node:fs";

const isProductionVercel = process.env.VERCEL_ENV === "production";
const commitMessage = String(process.env.VERCEL_GIT_COMMIT_MESSAGE || "");
const marker = "[sticker-seo-batch-once]";

if (!isProductionVercel || !commitMessage.includes(marker)) {
  console.log("[sticker-seo-batch] skip: not the one-shot production deployment");
  process.exit(0);
}

const token = String(process.env.FREE_ADMIN_TOKEN || "");
if (!token) {
  console.warn("[sticker-seo-batch] FREE_ADMIN_TOKEN is unavailable in the Vercel build environment; skipping without failing deployment");
  process.exit(0);
}

const stickers = JSON.parse(fs.readFileSync("src/data/stickers.json", "utf8"));
const phraseMap = JSON.parse(fs.readFileSync("src/data/sticker-phrases.json", "utf8"));
const endpoint = "https://stamp-moke.jp/api/sticker-seo";

function categoryOf(sticker) {
  const text = `${sticker.title || ""} ${sticker.description || ""}`;
  if (/博多|福岡|筑後|方言|関西弁|九州弁/.test(text)) return "方言";
  if (/猫|ねこ|ネコ|犬|いぬ|イヌ|柴犬|コーギー|ポメラニアン|うさぎ|ウサギ|兎|くま|クマ|パンダ|鳥|すずめ|ペンギン|アザラシ|猿|サル|タヌキ|たぬき|ねずみ|動物/.test(text)) return "動物";
  if (/ハート|恋|恋愛|カップル|彼氏|彼女|好き|愛/.test(text)) return "恋愛";
  if (/仕事|ビジネス|敬語|丁寧|会社|職場|マーケター|バイト|働く/.test(text)) return "仕事";
  if (/食べ物|料理|ごはん|肉まん|ビール|お酒|ジョッキ|パン|ケーキ|お菓子/.test(text)) return "食べ物";
  if (/面白|おもしろ|ネタ|シュール|ギャグ|ツッコミ|あるある|ウザい|正論|本音/.test(text)) return "おもしろ";
  if (/挨拶|ありがとう|おはよう|こんにちは|こんばんは|おやすみ|よろしく|おつかれ/.test(text)) return "あいさつ";
  if (/かわいい|可愛い|キュート|癒し|ほんわか|ゆるかわ|もふもふ/.test(text)) return "かわいい";
  if (/日常|毎日|返信|返事|会話|リアクション|気持ち/.test(text)) return "日常";
  return "その他";
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function generateOne(sticker) {
  const phrases = phraseMap[String(sticker.id)]?.phrases || [];
  const body = {
    id: String(sticker.id),
    title: sticker.title || "",
    description: sticker.description || "",
    category: categoryOf(sticker),
    phrases,
    force: false
  };

  const response = await fetch(`${endpoint}?id=${encodeURIComponent(sticker.id)}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-token": token
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}
  if (!response.ok) throw new Error(`${response.status} ${data.error || text.slice(0, 180)}`);
  return data;
}

let generated = 0;
let skipped = 0;
let failed = 0;
const failures = [];
const queue = [...stickers];

const workers = Array.from({ length: 3 }, async () => {
  while (queue.length) {
    const sticker = queue.shift();
    if (!sticker) return;

    try {
      const data = await generateOne(sticker);
      if (data.skipped) skipped += 1;
      else generated += 1;
      console.log(`[sticker-seo-batch] ${generated + skipped + failed}/${stickers.length} ${sticker.id} ${data.skipped ? "skipped" : "generated"}`);
    } catch (error) {
      failed += 1;
      failures.push({ id: sticker.id, error: String(error?.message || error) });
      console.error(`[sticker-seo-batch] ${sticker.id}: ${error?.message || error}`);
    }

    await sleep(250);
  }
});

await Promise.all(workers);

console.log("[sticker-seo-batch] summary", JSON.stringify({
  total: stickers.length,
  generated,
  skipped,
  failed,
  failures
}, null, 2));

if (failed > 0) {
  throw new Error(`Sticker SEO batch finished with ${failed} failures`);
}
