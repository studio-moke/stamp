import phraseData from "../data/sticker-phrases.json";
import type { Locale } from "./i18n";

export type StickerPhraseRecord = { phrases?: string[]; updatedAt?: string };
export type TagDefinition = {
  id: string;
  labels: Record<Locale, string>;
  slugs: Record<Locale, string>;
  description: Record<Locale, string>;
  patterns: RegExp[];
};

const records = phraseData as Record<string, StickerPhraseRecord>;

export const tagDefinitions: TagDefinition[] = [
  { id:"good-morning", labels:{ja:"おはよう",en:"Good morning","zh-tw":"早安",th:"อรุณสวัสดิ์",id:"Selamat pagi"}, slugs:{ja:"おはよう",en:"good-morning","zh-tw":"早安",th:"อรุณสวัสดิ์",id:"selamat-pagi"}, description:{ja:"朝のあいさつや「おはよう」を伝えるLINEスタンプ。",en:"LINE stickers for morning greetings and saying good morning.","zh-tw":"適合早晨問候與說「早安」的LINE貼圖。",th:"สติกเกอร์ LINE สำหรับทักทายตอนเช้าและพูดอรุณสวัสดิ์",id:"Stiker LINE untuk sapaan pagi dan mengucapkan selamat pagi."}, patterns:[/おはよ(?:う|ー|〜|～)?/u] },
  { id:"hello", labels:{ja:"こんにちは",en:"Hello","zh-tw":"你好",th:"สวัสดี",id:"Halo"}, slugs:{ja:"こんにちは",en:"hello","zh-tw":"你好",th:"สวัสดี",id:"halo"}, description:{ja:"昼のあいさつや「こんにちは」を伝えるLINEスタンプ。",en:"LINE stickers for saying hello in everyday chats.","zh-tw":"適合日常聊天中說「你好」的LINE貼圖。",th:"สติกเกอร์ LINE สำหรับกล่าวสวัสดีในแชตประจำวัน",id:"Stiker LINE untuk menyapa dalam obrolan sehari-hari."}, patterns:[/こんにちは/u,/こんにちわ/u] },
  { id:"good-night", labels:{ja:"おやすみ",en:"Good night","zh-tw":"晚安",th:"ราตรีสวัสดิ์",id:"Selamat malam"}, slugs:{ja:"おやすみ",en:"good-night","zh-tw":"晚安",th:"ราตรีสวัสดิ์",id:"selamat-malam"}, description:{ja:"寝る前の「おやすみ」を伝えるLINEスタンプ。",en:"LINE stickers for bedtime messages and saying good night.","zh-tw":"睡前用來說「晚安」的LINE貼圖。",th:"สติกเกอร์ LINE สำหรับข้อความก่อนนอนและกล่าวราตรีสวัสดิ์",id:"Stiker LINE untuk pesan sebelum tidur dan mengucapkan selamat malam."}, patterns:[/おやすみ/u,/ねるね/u,/寝る/u] },
  { id:"see-you", labels:{ja:"またね",en:"See you","zh-tw":"再見",th:"แล้วเจอกัน",id:"Sampai jumpa"}, slugs:{ja:"またね",en:"see-you","zh-tw":"再見",th:"แล้วเจอกัน",id:"sampai-jumpa"}, description:{ja:"会話の終わりに「またね」と伝えるLINEスタンプ。",en:"LINE stickers for ending a chat with see you or talk later.","zh-tw":"聊天結束時用來說「再見、下次見」的LINE貼圖。",th:"สติกเกอร์ LINE สำหรับปิดท้ายแชตด้วยคำว่าแล้วเจอกัน",id:"Stiker LINE untuk menutup obrolan dengan sampai jumpa."}, patterns:[/またね/u,/またあとで/u,/じゃあね/u,/ばいばい/u,/バイバイ/u] },
  { id:"im-off", labels:{ja:"いってきます",en:"I'm off","zh-tw":"我出門了",th:"ไปก่อนนะ",id:"Aku berangkat"}, slugs:{ja:"いってきます",en:"im-off","zh-tw":"我出門了",th:"ไปก่อนนะ",id:"aku-berangkat"}, description:{ja:"外出前の「いってきます」を伝えるLINEスタンプ。",en:"LINE stickers for saying you're heading out.","zh-tw":"出門前用來說「我出門了」的LINE貼圖。",th:"สติกเกอร์ LINE สำหรับบอกว่ากำลังออกไปข้างนอก",id:"Stiker LINE untuk memberi tahu bahwa Anda akan berangkat."}, patterns:[/いってきます/u,/行ってきます/u] },
  { id:"im-home", labels:{ja:"ただいま",en:"I'm home","zh-tw":"我回來了",th:"กลับมาแล้ว",id:"Aku pulang"}, slugs:{ja:"ただいま",en:"im-home","zh-tw":"我回來了",th:"กลับมาแล้ว",id:"aku-pulang"}, description:{ja:"帰宅時の「ただいま」を伝えるLINEスタンプ。",en:"LINE stickers for letting someone know you're home.","zh-tw":"回家時用來說「我回來了」的LINE貼圖。",th:"สติกเกอร์ LINE สำหรับบอกว่ากลับถึงบ้านแล้ว",id:"Stiker LINE untuk memberi tahu bahwa Anda sudah pulang."}, patterns:[/ただいま/u,/帰った/u,/帰宅/u] },
  { id:"thanks", labels:{ja:"ありがとう",en:"Thank you","zh-tw":"謝謝",th:"ขอบคุณ",id:"Terima kasih"}, slugs:{ja:"ありがとう",en:"thank-you","zh-tw":"謝謝",th:"ขอบคุณ",id:"terima-kasih"}, description:{ja:"感謝やお礼の「ありがとう」を伝えるLINEスタンプ。",en:"LINE stickers for saying thank you and showing appreciation.","zh-tw":"用來表達感謝與說「謝謝」的LINE貼圖。",th:"สติกเกอร์ LINE สำหรับกล่าวขอบคุณและแสดงความซาบซึ้ง",id:"Stiker LINE untuk mengucapkan terima kasih dan menunjukkan apresiasi."}, patterns:[/ありがと/u,/感謝/u,/サンキュー/u,/thank/i] },
  { id:"helped", labels:{ja:"たすかった",en:"That helped","zh-tw":"幫大忙了",th:"ช่วยได้มากเลย",id:"Sangat membantu"}, slugs:{ja:"たすかった",en:"that-helped","zh-tw":"幫大忙了",th:"ช่วยได้มากเลย",id:"sangat-membantu"}, description:{ja:"「たすかった」「助かりました」と感謝を伝えるLINEスタンプ。",en:"LINE stickers for saying that was a big help.","zh-tw":"用來表達「幫大忙了」的LINE貼圖。",th:"สติกเกอร์ LINE สำหรับบอกว่าช่วยได้มากเลย",id:"Stiker LINE untuk mengatakan bahwa bantuan itu sangat berarti."}, patterns:[/たすかった/u,/助かった/u,/助かりました/u] },
  { id:"happy", labels:{ja:"うれしい",en:"Happy","zh-tw":"好開心",th:"ดีใจ",id:"Senang"}, slugs:{ja:"うれしい",en:"happy","zh-tw":"好開心",th:"ดีใจ",id:"senang"}, description:{ja:"うれしい気持ちや喜びを伝えるLINEスタンプ。",en:"LINE stickers for sharing happiness and joy.","zh-tw":"用來表達開心與喜悅的LINE貼圖。",th:"สติกเกอร์ LINE สำหรับแสดงความดีใจและความสุข",id:"Stiker LINE untuk mengekspresikan rasa senang dan bahagia."}, patterns:[/うれし/u,/嬉し/u,/やった/u,/最高/u] },
  { id:"amazing", labels:{ja:"さすが",en:"Amazing","zh-tw":"真厲害",th:"สุดยอด",id:"Hebat"}, slugs:{ja:"さすが",en:"amazing","zh-tw":"真厲害",th:"สุดยอด",id:"hebat"}, description:{ja:"相手をほめる「さすが」「すごい」を伝えるLINEスタンプ。",en:"LINE stickers for praising someone with amazing or great job.","zh-tw":"用來稱讚對方「真厲害、做得好」的LINE貼圖。",th:"สติกเกอร์ LINE สำหรับชมว่าเก่งมากหรือสุดยอด",id:"Stiker LINE untuk memuji seseorang dengan kata hebat atau keren."}, patterns:[/さすが/u,/すごい/u,/すげ/u,/えらい/u,/天才/u] },
  { id:"good-luck", labels:{ja:"がんばれ",en:"Good luck","zh-tw":"加油",th:"สู้ ๆ",id:"Semangat"}, slugs:{ja:"がんばれ",en:"good-luck","zh-tw":"加油",th:"สู้ๆ",id:"semangat"}, description:{ja:"応援や励ましの「がんばれ」を伝えるLINEスタンプ。",en:"LINE stickers for encouragement, support and saying good luck.","zh-tw":"用來鼓勵、支持與說「加油」的LINE貼圖。",th:"สติกเกอร์ LINE สำหรับให้กำลังใจและบอกว่าสู้ ๆ",id:"Stiker LINE untuk memberi dukungan, semangat, dan mengucapkan semoga berhasil."}, patterns:[/がんば/u,/頑張/u,/ファイト/u,/応援/u] },
  { id:"okay", labels:{ja:"OK・了解",en:"OK / Got it","zh-tw":"OK・了解",th:"โอเค / รับทราบ",id:"OK / Mengerti"}, slugs:{ja:"了解",en:"ok-got-it","zh-tw":"了解",th:"รับทราบ",id:"mengerti"}, description:{ja:"返事や確認に使える「OK」「了解」のLINEスタンプ。",en:"LINE stickers for quick replies like OK and got it.","zh-tw":"適合快速回覆「OK、了解」的LINE貼圖。",th:"สติกเกอร์ LINE สำหรับตอบสั้น ๆ ว่าโอเคหรือรับทราบ",id:"Stiker LINE untuk balasan singkat seperti OK dan mengerti."}, patterns:[/了解/u,/りょうかい/u,/OK/iu,/オッケ/u,/おっけ/u,/承知/u] },
  { id:"sorry", labels:{ja:"ごめん・すみません",en:"Sorry","zh-tw":"對不起",th:"ขอโทษ",id:"Maaf"}, slugs:{ja:"ごめん",en:"sorry","zh-tw":"對不起",th:"ขอโทษ",id:"maaf"}, description:{ja:"謝罪やおわびを伝えるLINEスタンプ。",en:"LINE stickers for apologizing and saying sorry.","zh-tw":"用來道歉與說「對不起」的LINE貼圖。",th:"สติกเกอร์ LINE สำหรับขอโทษ",id:"Stiker LINE untuk meminta maaf."}, patterns:[/ごめん/u,/すみません/u,/すいません/u,/申し訳/u,/謝/u] },
];

export function getStickerPhrases(stickerId: string | number): string[] {
  return [...new Set(records[String(stickerId)]?.phrases || [])].filter(Boolean).slice(0, 40);
}

export function getTagIdsForPhrases(phrases: string[]): string[] {
  return tagDefinitions.filter((tag) => phrases.some((phrase) => tag.patterns.some((pattern) => pattern.test(phrase)))).map((tag) => tag.id);
}

export function getTagById(id: string) { return tagDefinitions.find((tag) => tag.id === id); }
export function getTagBySlug(locale: Locale, slug: string) { return tagDefinitions.find((tag) => tag.slugs[locale] === slug); }
export function getTagPath(locale: Locale, tag: TagDefinition) {
  const prefix = locale === "ja" ? "" : `/${locale}`;
  return `${prefix}/tags/${encodeURIComponent(tag.slugs[locale])}`;
}

export function localizedPhraseSummary(locale: Locale, phrases: string[]): string {
  if (!phrases.length) return "";
  const shown = phrases.slice(0, 8).join("、");
  if (locale === "ja") return `収録セリフ例：${shown}`;
  if (locale === "en") return `Japanese phrases in this set include: ${shown}`;
  if (locale === "zh-tw") return `本組貼圖包含的日文語句例：${shown}`;
  if (locale === "th") return `ตัวอย่างข้อความภาษาญี่ปุ่นในชุดนี้: ${shown}`;
  return `Contoh teks bahasa Jepang dalam set ini: ${shown}`;
}
