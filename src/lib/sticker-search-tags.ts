import type { Locale } from "./i18n";
import {
  getStickerPhrases,
  getTagIdsForPhrases,
  getTagPath,
  localizedPhraseSummary,
  tagDefinitions as phraseTagDefinitions,
  type TagDefinition,
} from "./sticker-tags";

export type StickerSearchSource = {
  id: string | number;
  title?: string;
  description?: string;
};

type Labels = Record<Locale, string>;

type SemanticTagDefinition = TagDefinition & {
  metadataPatterns: RegExp[];
};

function semanticTag(
  id: string,
  labels: Labels,
  slugs: Labels,
  metadataPatterns: RegExp[],
): SemanticTagDefinition {
  return {
    id,
    labels,
    slugs,
    patterns: [],
    metadataPatterns,
    description: {
      ja: `${labels.ja}に関連するLINEスタンプをまとめています。`,
      en: `Browse LINE stickers related to ${labels.en.toLowerCase()}.`,
      "zh-tw": `瀏覽與「${labels["zh-tw"]}」相關的LINE貼圖。`,
      th: `รวมสติกเกอร์ LINE ที่เกี่ยวกับ ${labels.th}`,
      id: `Jelajahi stiker LINE terkait ${labels.id.toLowerCase()}.`,
    },
  };
}

const semanticTagDefinitions: SemanticTagDefinition[] = [
  semanticTag("business", {ja:"仕事・ビジネス",en:"Work & Business","zh-tw":"工作・商務",th:"งาน・ธุรกิจ",id:"Kerja & Bisnis"}, {ja:"仕事",en:"work-business","zh-tw":"工作",th:"งาน",id:"kerja-bisnis"}, [/仕事|ビジネス|会社|職場|上司|同僚|部下|社会人|会社員|業務|お仕事|バイト|マーケ/u]),
  semanticTag("polite", {ja:"敬語・丁寧",en:"Polite Replies","zh-tw":"敬語・禮貌",th:"สุภาพ",id:"Balasan Sopan"}, {ja:"敬語",en:"polite-replies","zh-tw":"敬語",th:"สุภาพ",id:"balasan-sopan"}, [/敬語|丁寧|丁寧語|承知|返信スタンプ|ビジネス返信/u]),
  semanticTag("family", {ja:"家族",en:"Family","zh-tw":"家人",th:"ครอบครัว",id:"Keluarga"}, {ja:"家族",en:"family","zh-tw":"家人",th:"ครอบครัว",id:"keluarga"}, [/家族|父親|母親|パパ|ママ|夫婦|旦那|妻|子ども|子供|じいじ|ばあば|祖父|祖母/u]),
  semanticTag("couple", {ja:"夫婦・カップル",en:"Couples","zh-tw":"夫妻・情侶",th:"คู่รัก",id:"Pasangan"}, {ja:"夫婦-カップル",en:"couples","zh-tw":"夫妻-情侶",th:"คู่รัก",id:"pasangan"}, [/夫婦|カップル|彼氏|彼女|恋人|恋愛|旦那|妻|独占欲|嫉妬/u]),
  semanticTag("friends", {ja:"友達・友情",en:"Friends","zh-tw":"朋友・友情",th:"เพื่อน",id:"Teman"}, {ja:"友達",en:"friends","zh-tw":"朋友",th:"เพื่อน",id:"teman"}, [/友達|友人|友情|男友達|女友達|友だち/u]),
  semanticTag("women", {ja:"女性・女子",en:"Women","zh-tw":"女性・女子",th:"ผู้หญิง",id:"Wanita"}, {ja:"女性-女子",en:"women","zh-tw":"女性-女子",th:"ผู้หญิง",id:"wanita"}, [/女性|女子|女の子|大人女子|中学生女子|ママ|彼女|妻/u]),
  semanticTag("men", {ja:"男性・男子",en:"Men","zh-tw":"男性・男子",th:"ผู้ชาย",id:"Pria"}, {ja:"男性-男子",en:"men","zh-tw":"男性-男子",th:"ผู้ชาย",id:"pria"}, [/男性|男子|男の|男友達|親父|おやじ|父親|彼氏|旦那|昭和男子|おっちゃん/u]),
  semanticTag("senior", {ja:"シニア・高齢者",en:"Senior","zh-tw":"銀髮族",th:"ผู้สูงอายุ",id:"Lansia"}, {ja:"シニア",en:"senior","zh-tw":"銀髮族",th:"ผู้สูงอายุ",id:"lansia"}, [/シニア|高齢|老人|じいじ|ばあば|おじい|おばあ|祖父|祖母/u]),
  semanticTag("kids-students", {ja:"子ども・学生",en:"Kids & Students","zh-tw":"兒童・學生",th:"เด็ก・นักเรียน",id:"Anak & Pelajar"}, {ja:"子ども-学生",en:"kids-students","zh-tw":"兒童-學生",th:"เด็ก-นักเรียน",id:"anak-pelajar"}, [/子ども|子供|キッズ|学生|中学生|高校生|学校|部活/u]),
  semanticTag("simple", {ja:"シンプル",en:"Simple","zh-tw":"簡約",th:"เรียบง่าย",id:"Simpel"}, {ja:"シンプル",en:"simple","zh-tw":"簡約",th:"เรียบง่าย",id:"simpel"}, [/シンプル|超シンプル|大きな文字|見やすい|でか文字/u]),
  semanticTag("text-only", {ja:"文字だけ",en:"Text Only","zh-tw":"純文字",th:"ข้อความล้วน",id:"Teks Saja"}, {ja:"文字だけ",en:"text-only","zh-tw":"純文字",th:"ข้อความล้วน",id:"teks-saja"}, [/文字のみ|文字だけ|でか文字|大きな文字|筆文字|手書き文字|無骨な文字/u]),
  semanticTag("funny", {ja:"おもしろ・ネタ",en:"Funny","zh-tw":"搞笑・梗",th:"ตลก",id:"Lucu"}, {ja:"おもしろ",en:"funny","zh-tw":"搞笑",th:"ตลก",id:"lucu"}, [/おもしろ|面白|ネタ|コミカル|シュール|笑|ギャグ|ツッコミ|あるある|本音/u]),
  semanticTag("cute", {ja:"かわいい",en:"Cute","zh-tw":"可愛",th:"น่ารัก",id:"Imut"}, {ja:"かわいい",en:"cute","zh-tw":"可愛",th:"น่ารัก",id:"imut"}, [/かわいい|可愛い|ゆるい|ゆるかわ|癒し|もふもふ|ふわふわ|ほんわか/u]),
  semanticTag("daily", {ja:"日常・普段使い",en:"Everyday","zh-tw":"日常",th:"ใช้ทุกวัน",id:"Sehari-hari"}, {ja:"日常",en:"everyday","zh-tw":"日常",th:"ใช้ทุกวัน",id:"sehari-hari"}, [/日常|普段使い|毎日|日常連絡|普段|会話/u]),
  semanticTag("reply", {ja:"返事・返信",en:"Replies","zh-tw":"回覆",th:"ตอบกลับ",id:"Balasan"}, {ja:"返事-返信",en:"replies","zh-tw":"回覆",th:"ตอบกลับ",id:"balasan"}, [/返事|返信|リアクション|相づち|相槌|了解|OK|承知/u]),
  semanticTag("encouragement", {ja:"応援・励まし",en:"Encouragement","zh-tw":"鼓勵",th:"ให้กำลังใจ",id:"Dukungan"}, {ja:"応援-励まし",en:"encouragement","zh-tw":"鼓勵",th:"ให้กำลังใจ",id:"dukungan"}, [/応援|励まし|励ます|元気|がんば|頑張|気にすんな|無理すんな|ファイト/u]),
  semanticTag("dialect", {ja:"方言",en:"Japanese Dialects","zh-tw":"日本方言",th:"ภาษาถิ่นญี่ปุ่น",id:"Dialek Jepang"}, {ja:"方言",en:"japanese-dialects","zh-tw":"日本方言",th:"ภาษาถิ่นญี่ปุ่น",id:"dialek-jepang"}, [/方言|関西弁|大阪弁|博多弁|九州弁|沖縄|北海道|東北|津軽|秋田|仙台|名古屋|久留米/u]),
  semanticTag("kansai", {ja:"関西弁・大阪弁",en:"Kansai / Osaka Dialect","zh-tw":"關西腔・大阪腔",th:"ภาษาคันไซ・โอซาก้า",id:"Dialek Kansai / Osaka"}, {ja:"関西弁",en:"kansai-osaka-dialect","zh-tw":"關西腔",th:"ภาษาคันไซ",id:"dialek-kansai-osaka"}, [/関西弁|大阪弁|関西|大阪/u]),
  semanticTag("hakata", {ja:"博多弁・福岡",en:"Hakata / Fukuoka Dialect","zh-tw":"博多腔・福岡",th:"ภาษาฮากาตะ・ฟุกุโอกะ",id:"Dialek Hakata / Fukuoka"}, {ja:"博多弁",en:"hakata-fukuoka-dialect","zh-tw":"博多腔",th:"ภาษาฮากาตะ",id:"dialek-hakata-fukuoka"}, [/博多弁|博多|福岡|九州弁|久留米/u]),
  semanticTag("tohoku", {ja:"東北弁",en:"Tohoku Dialect","zh-tw":"東北方言",th:"ภาษาโทโฮคุ",id:"Dialek Tohoku"}, {ja:"東北弁",en:"tohoku-dialect","zh-tw":"東北方言",th:"ภาษาโทโฮคุ",id:"dialek-tohoku"}, [/東北弁|東北|津軽弁|秋田弁|仙台弁/u]),
  semanticTag("okinawa", {ja:"沖縄方言",en:"Okinawa Dialect","zh-tw":"沖繩方言",th:"ภาษาโอกินาวะ",id:"Dialek Okinawa"}, {ja:"沖縄方言",en:"okinawa-dialect","zh-tw":"沖繩方言",th:"ภาษาโอกินาวะ",id:"dialek-okinawa"}, [/沖縄|沖縄方言|うちなー|ウチナー/u]),
  semanticTag("hokkaido", {ja:"北海道弁",en:"Hokkaido Dialect","zh-tw":"北海道方言",th:"ภาษาฮอกไกโด",id:"Dialek Hokkaido"}, {ja:"北海道弁",en:"hokkaido-dialect","zh-tw":"北海道方言",th:"ภาษาฮอกไกโด",id:"dialek-hokkaido"}, [/北海道|北海道弁|道産子/u]),
  semanticTag("nagoya", {ja:"名古屋弁・愛知",en:"Nagoya / Aichi Dialect","zh-tw":"名古屋腔・愛知",th:"ภาษานาโกย่า・ไอจิ",id:"Dialek Nagoya / Aichi"}, {ja:"名古屋弁",en:"nagoya-aichi-dialect","zh-tw":"名古屋腔",th:"ภาษานาโกย่า",id:"dialek-nagoya-aichi"}, [/名古屋|名古屋弁|愛知/u]),
  semanticTag("cat", {ja:"猫・ねこ",en:"Cats","zh-tw":"貓咪",th:"แมว",id:"Kucing"}, {ja:"猫",en:"cats","zh-tw":"貓咪",th:"แมว",id:"kucing"}, [/猫|ねこ|ネコ|くろねこ|黒猫/u]),
  semanticTag("dog", {ja:"犬・いぬ",en:"Dogs","zh-tw":"狗狗",th:"สุนัข",id:"Anjing"}, {ja:"犬",en:"dogs","zh-tw":"狗狗",th:"สุนัข",id:"anjing"}, [/犬|いぬ|イヌ|ポメラニアン|柴犬|コーギー|わんこ/u]),
  semanticTag("rabbit", {ja:"うさぎ",en:"Rabbits","zh-tw":"兔子",th:"กระต่าย",id:"Kelinci"}, {ja:"うさぎ",en:"rabbits","zh-tw":"兔子",th:"กระต่าย",id:"kelinci"}, [/うさぎ|ウサギ|兎/u]),
  semanticTag("birds", {ja:"鳥・ひよこ・ペンギン",en:"Birds","zh-tw":"鳥・小雞・企鵝",th:"นก・ลูกเจี๊ยบ・เพนกวิน",id:"Burung"}, {ja:"鳥",en:"birds","zh-tw":"鳥",th:"นก",id:"burung"}, [/ひよこ|ヒヨコ|鳥|ぴよ|ペンギン|すずめ/u]),
  semanticTag("food", {ja:"食べ物",en:"Food","zh-tw":"食物",th:"อาหาร",id:"Makanan"}, {ja:"食べ物",en:"food","zh-tw":"食物",th:"อาหาร",id:"makanan"}, [/食べ物|料理|ごはん|ご飯|牛丼|肉まん|寿司|おにぎり|ラーメン|パン|卵|たまご|ケーキ|お菓子/u]),
  semanticTag("showa", {ja:"昭和・レトロ",en:"Showa / Retro","zh-tw":"昭和・復古",th:"โชวะ・เรโทร",id:"Showa / Retro"}, {ja:"昭和",en:"showa-retro","zh-tw":"昭和",th:"โชวะ",id:"showa-retro"}, [/昭和|レトロ|親父|おやじ/u]),
];

export const tagDefinitions: TagDefinition[] = [
  ...phraseTagDefinitions,
  ...semanticTagDefinitions,
];

export function getTagIdsForSticker(sticker: StickerSearchSource): string[] {
  const phraseIds = getTagIdsForPhrases(getStickerPhrases(sticker.id));
  const metadata = `${sticker.title || ""} ${sticker.description || ""}`;
  const semanticIds = semanticTagDefinitions
    .filter((tag) => tag.metadataPatterns.some((pattern) => pattern.test(metadata)))
    .map((tag) => tag.id);
  return [...new Set([...phraseIds, ...semanticIds])];
}

export function getTagById(id: string) {
  return tagDefinitions.find((tag) => tag.id === id);
}

export function getTagBySlug(locale: Locale, slug: string) {
  return tagDefinitions.find((tag) => tag.slugs[locale] === slug);
}

export { getStickerPhrases, getTagPath, localizedPhraseSummary };
export type { TagDefinition };
