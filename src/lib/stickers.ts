export const SITE_URL = "https://stamp-moke.jp";

export const CATEGORY_DEFINITIONS = [
  { name: "方言", slug: "hougen" },
  { name: "動物", slug: "doubutsu" },
  { name: "恋愛", slug: "renai" },
  { name: "仕事", slug: "shigoto" },
  { name: "食べ物", slug: "tabemono" },
  { name: "おもしろ", slug: "omoshiro" },
  { name: "あいさつ", slug: "aisatsu" },
  { name: "かわいい", slug: "kawaii" },
  { name: "日常", slug: "nichijo" },
  { name: "その他", slug: "sonota" },
] as const;

export type CategoryName = (typeof CATEGORY_DEFINITIONS)[number]["name"];

export function getCategory(sticker: { title?: string; description?: string }): CategoryName {
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

export function getCategoryBySlug(slug: string) {
  return CATEGORY_DEFINITIONS.find((category) => category.slug === slug);
}

export function getCategorySlug(name: string) {
  return CATEGORY_DEFINITIONS.find((category) => category.name === name)?.slug;
}
