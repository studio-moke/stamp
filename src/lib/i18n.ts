export const LOCALES = ["ja", "en", "zh-tw", "th"] as const;
export type Locale = (typeof LOCALES)[number];

export const localeInfo: Record<Locale, { label: string; htmlLang: string; ogLocale: string; lineLocale: string }> = {
  ja: { label: "日本語", htmlLang: "ja", ogLocale: "ja_JP", lineLocale: "ja" },
  en: { label: "English", htmlLang: "en", ogLocale: "en_US", lineLocale: "en" },
  "zh-tw": { label: "繁體中文", htmlLang: "zh-Hant-TW", ogLocale: "zh_TW", lineLocale: "zh-Hant" },
  th: { label: "ไทย", htmlLang: "th", ogLocale: "th_TH", lineLocale: "th" },
};

export const messages = {
  ja: {
    siteTitle: "stamp moke｜LINEスタンプ専門メディア",
    siteDescription: "stamp moke（スタンプもけ・スタンプモケ）は、かわいい、おもしろい、毎日使えるLINEスタンプを紹介するstudio mokeの公式サイトです。",
    brandSub: "LINEスタンプ専門メディア",
    shop: "キャラグッズ店 ↗",
    viewStickers: "スタンプを見る ↓",
    heroLead: "かわいい、おもしろい、毎日使える。いろいろなシリーズから、あなたにぴったりのLINEスタンプを見つけてください。",
    heroCta: "スタンプを探す →",
    heroTitles: ["新しいスタンプ、\n続々登場。", "かわいい仲間が、\nいっぱい。", "クスッと笑える、\nひとことを。", "毎日の会話を、\nもっと便利に。"],
    all: "すべて",
    stickers: "スタンプ一覧",
    details: "詳しく見る →",
    noStickers: "該当するスタンプがありません。",
    goodsTitle: "グッズショップ",
    goodsLead: "LINEスタンプから生まれたキャラクターたちを、Tシャツやステッカーなどのグッズにしました。",
    goodsLink: "キャラとグッズを見る →",
    allGoods: "SUZURIショップをすべて見る ↗",
    aboutTitle: "毎日のひとことを、\nちょっと楽しく。",
    aboutText: "stamp moke（スタンプもけ／スタンプモケ）は、studio moke（スタジオモケ）が運営する、LINEで使いやすいスタンプを見つけるためのメディアです。スタンプが増えても探しやすいように整理して紹介します。",
    footerCopy: "LINEスタンプ専門メディア\nお気に入りのスタンプを見つけよう。",
    categories: "カテゴリー",
    categoryDescription: "動物、かわいい、面白い、仕事、方言など、stamp mokeのLINEスタンプをカテゴリー別に探せます。",
    buy: "LINE STOREで購入する",
    gift: "友だちにプレゼント",
    back: "一覧へ戻る",
    productAbout: "このスタンプについて",
    goodsProducts: "販売中のグッズ",
    suzuriOpen: "SUZURIで見る ↗",
    taxIncluded: "税込",
  },
  en: {
    siteTitle: "stamp moke | Cute & Funny LINE Stickers",
    siteDescription: "Discover cute, funny and practical LINE stickers by studio moke. Browse original sticker characters for daily chats, work, couples and friends.",
    brandSub: "ORIGINAL LINE STICKERS",
    shop: "Character goods ↗",
    viewStickers: "Browse stickers ↓",
    heroLead: "Cute, funny and useful every day. Find the perfect LINE stickers for chats with friends, family, coworkers and someone special.",
    heroCta: "Find stickers →",
    heroTitles: ["New LINE stickers,\narriving often.", "Meet our cute\ncharacters.", "A little laugh\nfor every chat.", "Make daily chats\neasier."],
    all: "All",
    stickers: "LINE STICKERS",
    details: "View details →",
    noStickers: "No stickers found.",
    goodsTitle: "GOODS SHOP",
    goodsLead: "Original characters born from our LINE stickers are now available on T-shirts, stickers and more.",
    goodsLink: "View character goods →",
    allGoods: "View all items on SUZURI ↗",
    aboutTitle: "Make every message\na little more fun.",
    aboutText: "stamp moke is the official LINE sticker media by studio moke. Explore original Japanese stickers for everyday greetings, work chats, couples, families and friends.",
    footerCopy: "Original LINE sticker media\nFind a new favorite for your chats.",
    categories: "Categories",
    categoryDescription: "Browse stamp moke LINE stickers by animals, cute, funny, work, greetings and more.",
    buy: "Buy on LINE STORE",
    gift: "Send as a gift",
    back: "Back to collection",
    productAbout: "About this sticker set",
    goodsProducts: "Available goods",
    suzuriOpen: "View on SUZURI ↗",
    taxIncluded: "tax included",
  },
  "zh-tw": {
    siteTitle: "stamp moke｜可愛又實用的LINE貼圖",
    siteDescription: "探索studio moke創作的可愛、幽默又實用的LINE貼圖。收錄日常問候、工作、情侶、家人與朋友聊天適用的原創角色貼圖。",
    brandSub: "原創LINE貼圖專門網站",
    shop: "角色周邊 ↗",
    viewStickers: "瀏覽貼圖 ↓",
    heroLead: "可愛、有趣、每天都好用。從各種系列中，找到最適合你聊天方式的LINE貼圖。",
    heroCta: "尋找貼圖 →",
    heroTitles: ["最新LINE貼圖，\n持續登場。", "可愛角色，\n等你來發現。", "讓每次聊天，\n多一點笑容。", "日常對話，\n更方便好用。"],
    all: "全部",
    stickers: "LINE貼圖",
    details: "查看詳情 →",
    noStickers: "找不到符合條件的貼圖。",
    goodsTitle: "角色周邊商店",
    goodsLead: "從LINE貼圖誕生的原創角色，化身為T恤、貼紙與各式周邊商品。",
    goodsLink: "查看角色與周邊 →",
    allGoods: "前往SUZURI查看全部商品 ↗",
    aboutTitle: "讓每天的一句話，\n更有趣一點。",
    aboutText: "stamp moke是studio moke經營的原創LINE貼圖網站。依照用途與類別整理貼圖，讓你更容易找到日常聊天、工作、情侶、家人與朋友適用的貼圖。",
    footerCopy: "原創LINE貼圖專門網站\n找到最適合你的貼圖。",
    categories: "貼圖分類",
    categoryDescription: "依動物、可愛、幽默、工作、問候等分類瀏覽stamp moke的LINE貼圖。",
    buy: "前往LINE STORE購買",
    gift: "贈送給朋友",
    back: "返回貼圖列表",
    productAbout: "貼圖介紹",
    goodsProducts: "販售中的周邊",
    suzuriOpen: "前往SUZURI查看 ↗",
    taxIncluded: "含稅",
  },
  th: {
    siteTitle: "stamp moke | สติกเกอร์ LINE น่ารักและใช้ได้ทุกวัน",
    siteDescription: "พบกับสติกเกอร์ LINE ต้นฉบับจาก studio moke ทั้งน่ารัก ตลก และใช้งานง่าย เหมาะกับแชตประจำวัน ที่ทำงาน คู่รัก ครอบครัว และเพื่อน",
    brandSub: "เว็บไซต์สติกเกอร์ LINE ต้นฉบับ",
    shop: "สินค้าคาแรกเตอร์ ↗",
    viewStickers: "ดูสติกเกอร์ ↓",
    heroLead: "น่ารัก สนุก และใช้ได้ทุกวัน เลือกสติกเกอร์ LINE ที่เหมาะกับการคุยของคุณจากหลากหลายซีรีส์",
    heroCta: "ค้นหาสติกเกอร์ →",
    heroTitles: ["สติกเกอร์ใหม่\nมาเรื่อย ๆ", "พบกับคาแรกเตอร์\nแสนน่ารัก", "เติมรอยยิ้ม\nให้ทุกแชต", "คุยทุกวัน\nได้ง่ายขึ้น"],
    all: "ทั้งหมด",
    stickers: "สติกเกอร์ LINE",
    details: "ดูรายละเอียด →",
    noStickers: "ไม่พบสติกเกอร์ที่ตรงกัน",
    goodsTitle: "ร้านสินค้าคาแรกเตอร์",
    goodsLead: "คาแรกเตอร์จากสติกเกอร์ LINE ของเรา พร้อมแล้วบนเสื้อยืด สติกเกอร์ และสินค้าอื่น ๆ",
    goodsLink: "ดูคาแรกเตอร์และสินค้า →",
    allGoods: "ดูสินค้าทั้งหมดบน SUZURI ↗",
    aboutTitle: "ทำให้ทุกข้อความ\nสนุกขึ้นอีกนิด",
    aboutText: "stamp moke คือเว็บไซต์สติกเกอร์ LINE ต้นฉบับจาก studio moke เราจัดหมวดหมู่ให้ค้นหาสติกเกอร์สำหรับแชตประจำวัน ที่ทำงาน คู่รัก ครอบครัว และเพื่อนได้ง่าย",
    footerCopy: "เว็บไซต์สติกเกอร์ LINE ต้นฉบับ\nค้นหาสติกเกอร์ที่คุณชอบ",
    categories: "หมวดหมู่",
    categoryDescription: "เลือกดูสติกเกอร์ LINE ของ stamp moke ตามหมวดสัตว์ น่ารัก ตลก ที่ทำงาน คำทักทาย และอื่น ๆ",
    buy: "ซื้อบน LINE STORE",
    gift: "ส่งเป็นของขวัญ",
    back: "กลับไปหน้ารวม",
    productAbout: "เกี่ยวกับชุดสติกเกอร์",
    goodsProducts: "สินค้าที่จำหน่าย",
    suzuriOpen: "ดูบน SUZURI ↗",
    taxIncluded: "รวมภาษี",
  },
} as const;

export const categoryLabels: Record<Locale, Record<string, string>> = {
  ja: { "すべて":"すべて","仕事":"仕事","日常":"日常","その他":"その他","恋愛":"恋愛","かわいい":"かわいい","動物":"動物","方言":"方言","おもしろ":"おもしろ","食べ物":"食べ物","あいさつ":"あいさつ" },
  en: { "すべて":"All","仕事":"Work","日常":"Daily","その他":"Other","恋愛":"Love","かわいい":"Cute","動物":"Animals","方言":"Dialects","おもしろ":"Funny","食べ物":"Food","あいさつ":"Greetings" },
  "zh-tw": { "すべて":"全部","仕事":"工作","日常":"日常","その他":"其他","恋愛":"戀愛","かわいい":"可愛","動物":"動物","方言":"方言","おもしろ":"幽默","食べ物":"美食","あいさつ":"問候" },
  th: { "すべて":"ทั้งหมด","仕事":"ที่ทำงาน","日常":"ประจำวัน","その他":"อื่น ๆ","恋愛":"ความรัก","かわいい":"น่ารัก","動物":"สัตว์","方言":"ภาษาถิ่น","おもしろ":"ตลก","食べ物":"อาหาร","あいさつ":"คำทักทาย" },
};

export function normalizeLocale(value?: string): Locale {
  return LOCALES.includes(value as Locale) ? value as Locale : "ja";
}

export function localizedPath(locale: Locale, path = "/") {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return locale === "ja" ? clean : `/${locale}${clean === "/" ? "/" : clean}`;
}

export function alternateLinks(path = "/") {
  return LOCALES.map((locale) => ({ locale, href: `https://stamp-moke.jp${localizedPath(locale, path)}` }));
}

export function localizeLineUrl(url: string, locale: Locale) {
  if (!url) return url;
  const code = localeInfo[locale].lineLocale;
  return url.replace(/\/(ja|en|zh-Hant|th)(?:\?|$)/, `/${code}$2`);
}
