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
  semanticTag("polite", {ja:"敬語・丁寧",en:"Polite Replies","zh-tw":"敬語・禮貌",th:"สุภาพ",id:"Balasan Sopan"}, {ja:"敬語",en:"polite-replies","zh-tw":"敬語",th:"สุภาพ",id:"balasan-sopan"}, [/敬語|丁寧|丁寧語|承知|返信スタンプ|ビジネス返信|かしこまり|お疲れ様|おつかれさま/u]),
  semanticTag("family", {ja:"家族",en:"Family","zh-tw":"家人",th:"ครอบครัว",id:"Keluarga"}, {ja:"家族",en:"family","zh-tw":"家人",th:"ครอบครัว",id:"keluarga"}, [/家族|父親|母親|パパ|ママ|夫婦|旦那|妻|子ども|子供|じいじ|ばあば|祖父|祖母|送迎/u]),
  semanticTag("couple", {ja:"夫婦・カップル",en:"Couples","zh-tw":"夫妻・情侶",th:"คู่รัก",id:"Pasangan"}, {ja:"夫婦-カップル",en:"couples","zh-tw":"夫妻-情侶",th:"คู่รัก",id:"pasangan"}, [/夫婦|カップル|彼氏|彼女|恋人|恋愛|旦那|妻|独占欲|嫉妬/u]),
  semanticTag("friends", {ja:"友達・友情",en:"Friends","zh-tw":"朋友・友情",th:"เพื่อน",id:"Teman"}, {ja:"友達",en:"friends","zh-tw":"朋友",th:"เพื่อน",id:"teman"}, [/友達|友人|友情|男友達|女友達|友だち/u]),
  semanticTag("women", {ja:"女性・女子",en:"Women","zh-tw":"女性・女子",th:"ผู้หญิง",id:"Wanita"}, {ja:"女性-女子",en:"women","zh-tw":"女性-女子",th:"ผู้หญิง",id:"wanita"}, [/女性|女子|女の子|大人女子|中学生女子|ママ|彼女|妻/u]),
  semanticTag("men", {ja:"男性・男子",en:"Men","zh-tw":"男性・男子",th:"ผู้ชาย",id:"Pria"}, {ja:"男性-男子",en:"men","zh-tw":"男性-男子",th:"ผู้ชาย",id:"pria"}, [/男性|男子|男の|男友達|親父|おやじ|父親|彼氏|旦那|昭和男子|おっちゃん/u]),
  semanticTag("senior", {ja:"シニア・高齢者",en:"Senior","zh-tw":"銀髮族",th:"ผู้สูงอายุ",id:"Lansia"}, {ja:"シニア",en:"senior","zh-tw":"銀髮族",th:"ผู้สูงอายุ",id:"lansia"}, [/シニア|高齢|老人|じいじ|ばあば|おじい|おばあ|祖父|祖母/u]),
  semanticTag("kids-students", {ja:"子ども・学生",en:"Kids & Students","zh-tw":"兒童・學生",th:"เด็ก・นักเรียน",id:"Anak & Pelajar"}, {ja:"子ども-学生",en:"kids-students","zh-tw":"兒童-學生",th:"เด็ก-นักเรียน",id:"anak-pelajar"}, [/子ども|子供|キッズ|学生|中学生|高校生|学校|部活/u]),
  semanticTag("simple", {ja:"シンプル",en:"Simple","zh-tw":"簡約",th:"เรียบง่าย",id:"Simpel"}, {ja:"シンプル",en:"simple","zh-tw":"簡約",th:"เรียบง่าย",id:"simpel"}, [/シンプル|超シンプル|大きな文字|見やすい|でか文字/u]),
  semanticTag("text-only", {ja:"文字だけ",en:"Text Only","zh-tw":"純文字",th:"ข้อความล้วน",id:"Teks Saja"}, {ja:"文字だけ",en:"text-only","zh-tw":"純文字",th:"ข้อความล้วน",id:"teks-saja"}, [/文字のみ|文字だけ|でか文字|大きな文字|筆文字|手書き文字|無骨な文字/u]),
  semanticTag("funny", {ja:"おもしろ・ネタ",en:"Funny","zh-tw":"搞笑・梗",th:"ตลก",id:"Lucu"}, {ja:"おもしろ",en:"funny","zh-tw":"搞笑",th:"ตลก",id:"lucu"}, [/おもしろ|面白|ネタ|コミカル|シュール|笑|ギャグ|ツッコミ|あるある|本音/u]),
  semanticTag("cute", {ja:"かわいい",en:"Cute","zh-tw":"可愛",th:"น่ารัก",id:"Imut"}, {ja:"かわいい",en:"cute","zh-tw":"可愛",th:"น่ารัก",id:"imut"}, [/かわいい|可愛い|ゆるい|ゆるかわ|癒し|もふもふ|ふわふわ|ほんわか|ふんわり/u]),
  semanticTag("daily", {ja:"日常・普段使い",en:"Everyday","zh-tw":"日常",th:"ใช้ทุกวัน",id:"Sehari-hari"}, {ja:"日常",en:"everyday","zh-tw":"日常",th:"ใช้ทุกวัน",id:"sehari-hari"}, [/日常|普段使い|毎日|日常連絡|普段|会話/u]),
  semanticTag("reply", {ja:"返事・返信",en:"Replies","zh-tw":"回覆",th:"ตอบกลับ",id:"Balasan"}, {ja:"返事-返信",en:"replies","zh-tw":"回覆",th:"ตอบกลับ",id:"balasan"}, [/返事|返信|リアクション|相づち|相槌|了解|OK|承知|わかった|わかりました/u]),
  semanticTag("encouragement", {ja:"応援・励まし",en:"Encouragement","zh-tw":"鼓勵",th:"ให้กำลังใจ",id:"Dukungan"}, {ja:"応援-励まし",en:"encouragement","zh-tw":"鼓勵",th:"ให้กำลังใจ",id:"dukungan"}, [/応援|励まし|励ます|元気|がんば|頑張|気にすんな|無理すんな|ファイト/u]),
  semanticTag("dialect", {ja:"方言",en:"Japanese Dialects","zh-tw":"日本方言",th:"ภาษาถิ่นญี่ปุ่น",id:"Dialek Jepang"}, {ja:"方言",en:"japanese-dialects","zh-tw":"日本方言",th:"ภาษาถิ่นญี่ปุ่น",id:"dialek-jepang"}, [/方言|関西弁|大阪弁|博多弁|九州弁|沖縄|北海道|東北|津軽|秋田|仙台|名古屋|久留米|筑後/u]),
  semanticTag("kansai", {ja:"関西弁・大阪弁",en:"Kansai / Osaka Dialect","zh-tw":"關西腔・大阪腔",th:"ภาษาคันไซ・โอซาก้า",id:"Dialek Kansai / Osaka"}, {ja:"関西弁",en:"kansai-osaka-dialect","zh-tw":"關西腔",th:"ภาษาคันไซ",id:"dialek-kansai-osaka"}, [/関西弁|大阪弁|関西|大阪/u]),
  semanticTag("hakata", {ja:"博多弁・福岡",en:"Hakata / Fukuoka Dialect","zh-tw":"博多腔・福岡",th:"ภาษาฮากาตะ・ฟุกุโอกะ",id:"Dialek Hakata / Fukuoka"}, {ja:"博多弁",en:"hakata-fukuoka-dialect","zh-tw":"博多腔",th:"ภาษาฮากาตะ",id:"dialek-hakata-fukuoka"}, [/博多弁|博多|福岡|九州弁|久留米|筑後弁|中洲/u]),
  semanticTag("tohoku", {ja:"東北弁",en:"Tohoku Dialect","zh-tw":"東北方言",th:"ภาษาโทโฮคุ",id:"Dialek Tohoku"}, {ja:"東北弁",en:"tohoku-dialect","zh-tw":"東北方言",th:"ภาษาโทโฮคุ",id:"dialek-tohoku"}, [/東北弁|東北|津軽弁|秋田弁|仙台弁/u]),
  semanticTag("okinawa", {ja:"沖縄方言",en:"Okinawa Dialect","zh-tw":"沖繩方言",th:"ภาษาโอกินาวะ",id:"Dialek Okinawa"}, {ja:"沖縄方言",en:"okinawa-dialect","zh-tw":"沖繩方言",th:"ภาษาโอกินาวะ",id:"dialek-okinawa"}, [/沖縄|沖縄方言|うちなー|ウチナー/u]),
  semanticTag("hokkaido", {ja:"北海道弁",en:"Hokkaido Dialect","zh-tw":"北海道方言",th:"ภาษาฮอกไกโด",id:"Dialek Hokkaido"}, {ja:"北海道弁",en:"hokkaido-dialect","zh-tw":"北海道方言",th:"ภาษาฮอกไกโด",id:"dialek-hokkaido"}, [/北海道|北海道弁|道産子/u]),
  semanticTag("nagoya", {ja:"名古屋弁・愛知",en:"Nagoya / Aichi Dialect","zh-tw":"名古屋腔・愛知",th:"ภาษานาโกย่า・ไอจิ",id:"Dialek Nagoya / Aichi"}, {ja:"名古屋弁",en:"nagoya-aichi-dialect","zh-tw":"名古屋腔",th:"ภาษานาโกย่า",id:"dialek-nagoya-aichi"}, [/名古屋|名古屋弁|愛知/u]),
  semanticTag("cat", {ja:"猫・ねこ",en:"Cats","zh-tw":"貓咪",th:"แมว",id:"Kucing"}, {ja:"猫",en:"cats","zh-tw":"貓咪",th:"แมว",id:"kucing"}, [/猫|ねこ|ネコ|くろねこ|黒猫|茶トラ/u]),
  semanticTag("dog", {ja:"犬・いぬ",en:"Dogs","zh-tw":"狗狗",th:"สุนัข",id:"Anjing"}, {ja:"犬",en:"dogs","zh-tw":"狗狗",th:"สุนัข",id:"anjing"}, [/犬|いぬ|イヌ|ポメラニアン|柴犬|コーギー|わんこ/u]),
  semanticTag("rabbit", {ja:"うさぎ",en:"Rabbits","zh-tw":"兔子",th:"กระต่าย",id:"Kelinci"}, {ja:"うさぎ",en:"rabbits","zh-tw":"兔子",th:"กระต่าย",id:"kelinci"}, [/うさぎ|ウサギ|兎/u]),
  semanticTag("birds", {ja:"鳥・ひよこ・ペンギン",en:"Birds","zh-tw":"鳥・小雞・企鵝",th:"นก・ลูกเจี๊ยบ・เพนกวิน",id:"Burung"}, {ja:"鳥",en:"birds","zh-tw":"鳥",th:"นก",id:"burung"}, [/ひよこ|ヒヨコ|鳥|ぴよ|ペンギン|すずめ/u]),
  semanticTag("food", {ja:"食べ物",en:"Food","zh-tw":"食物",th:"อาหาร",id:"Makanan"}, {ja:"食べ物",en:"food","zh-tw":"食物",th:"อาหาร",id:"makanan"}, [/食べ物|料理|ごはん|ご飯|牛丼|肉まん|寿司|おにぎり|ラーメン|パン|卵|たまご|ケーキ|お菓子/u]),
  semanticTag("showa", {ja:"昭和・レトロ",en:"Showa / Retro","zh-tw":"昭和・復古",th:"โชวะ・เรโทร",id:"Showa / Retro"}, {ja:"昭和",en:"showa-retro","zh-tw":"昭和",th:"โชวะ",id:"showa-retro"}, [/昭和|レトロ|親父|おやじ/u]),

  // Character / motif inference
  semanticTag("bear", {ja:"くま",en:"Bears","zh-tw":"熊",th:"หมี",id:"Beruang"}, {ja:"くま",en:"bears","zh-tw":"熊",th:"หมี",id:"beruang"}, [/くま|クマ|熊/u]),
  semanticTag("penguin", {ja:"ペンギン",en:"Penguins","zh-tw":"企鵝",th:"เพนกวิน",id:"Penguin"}, {ja:"ペンギン",en:"penguins","zh-tw":"企鵝",th:"เพนกวิน",id:"penguin"}, [/ペンギン/u]),
  semanticTag("chick", {ja:"ひよこ",en:"Chicks","zh-tw":"小雞",th:"ลูกเจี๊ยบ",id:"Anak Ayam"}, {ja:"ひよこ",en:"chicks","zh-tw":"小雞",th:"ลูกเจี๊ยบ",id:"anak-ayam"}, [/ひよこ|ヒヨコ|ぴよ/u]),
  semanticTag("seal", {ja:"アザラシ",en:"Seals","zh-tw":"海豹",th:"แมวน้ำ",id:"Anjing Laut"}, {ja:"アザラシ",en:"seals","zh-tw":"海豹",th:"แมวน้ำ",id:"anjing-laut"}, [/アザラシ|あざらし/u]),
  semanticTag("panda", {ja:"パンダ",en:"Pandas","zh-tw":"熊貓",th:"แพนด้า",id:"Panda"}, {ja:"パンダ",en:"pandas","zh-tw":"熊貓",th:"แพนด้า",id:"panda"}, [/パンダ/u]),
  semanticTag("monkey", {ja:"猿・さる",en:"Monkeys","zh-tw":"猴子",th:"ลิง",id:"Monyet"}, {ja:"猿",en:"monkeys","zh-tw":"猴子",th:"ลิง",id:"monyet"}, [/猿|サル|さる/u]),
  semanticTag("tanuki", {ja:"たぬき",en:"Tanuki","zh-tw":"狸貓",th:"ทานูกิ",id:"Tanuki"}, {ja:"たぬき",en:"tanuki","zh-tw":"狸貓",th:"ทานูกิ",id:"tanuki"}, [/たぬき|タヌキ|狸/u]),
  semanticTag("mouse", {ja:"ねずみ",en:"Mice","zh-tw":"老鼠",th:"หนู",id:"Tikus"}, {ja:"ねずみ",en:"mice","zh-tw":"老鼠",th:"หนู",id:"tikus"}, [/ねずみ|ネズミ|鼠/u]),
  semanticTag("human-character", {ja:"人物キャラ",en:"Human Characters","zh-tw":"人物角色",th:"ตัวละครคน",id:"Karakter Manusia"}, {ja:"人物",en:"human-characters","zh-tw":"人物",th:"ตัวละครคน",id:"karakter-manusia"}, [/女子|男子|少年|少女|おっちゃん|親父|老人|会社員|密告者|武士|シンガー/u]),

  // Use / communication intent
  semanticTag("greeting", {ja:"あいさつ",en:"Greetings","zh-tw":"問候",th:"ทักทาย",id:"Sapaan"}, {ja:"あいさつ",en:"greetings","zh-tw":"問候",th:"ทักทาย",id:"sapaan"}, [/おはよう|こんにちは|こんばんは|おやすみ|またね|じゃあね|おつかれ|お疲れ/u]),
  semanticTag("thanks", {ja:"ありがとう・感謝",en:"Thanks","zh-tw":"感謝",th:"ขอบคุณ",id:"Terima Kasih"}, {ja:"ありがとう",en:"thanks","zh-tw":"感謝",th:"ขอบคุณ",id:"terima-kasih"}, [/ありがとう|ありがと|感謝|助かる|助かりました/u]),
  semanticTag("apology", {ja:"ごめん・謝罪",en:"Apologies","zh-tw":"道歉",th:"ขอโทษ",id:"Permintaan Maaf"}, {ja:"ごめん",en:"apologies","zh-tw":"道歉",th:"ขอโทษ",id:"permintaan-maaf"}, [/ごめん|ごめんなさい|すみません|すいません|申し訳/u]),
  semanticTag("contact", {ja:"連絡・報告",en:"Contact & Updates","zh-tw":"聯絡・報告",th:"ติดต่อ・แจ้งข่าว",id:"Kontak & Kabar"}, {ja:"連絡",en:"contact-updates","zh-tw":"聯絡",th:"ติดต่อ",id:"kontak-kabar"}, [/連絡|報告|返信|返事|到着|着いた|帰る|帰宅|いってきます|ただいま|送迎/u]),
  semanticTag("care", {ja:"気づかい・心配",en:"Care & Concern","zh-tw":"關心・擔心",th:"ห่วงใย",id:"Perhatian"}, {ja:"気づかい",en:"care-concern","zh-tw":"關心",th:"ห่วงใย",id:"perhatian"}, [/気遣い|気づかい|心配|大丈夫|無理しない|無理すんな|休んで|気をつけて|お大事/u]),
  semanticTag("celebration", {ja:"お祝い・喜び",en:"Celebration","zh-tw":"祝賀",th:"ฉลอง",id:"Perayaan"}, {ja:"お祝い",en:"celebration","zh-tw":"祝賀",th:"ฉลอง",id:"perayaan"}, [/おめでとう|やった|最高|うれしい|嬉しい|祝|乾杯/u]),

  // Emotion inference from title, descriptions and OCR phrases
  semanticTag("happy", {ja:"うれしい・楽しい",en:"Happy","zh-tw":"開心",th:"ดีใจ",id:"Senang"}, {ja:"うれしい",en:"happy","zh-tw":"開心",th:"ดีใจ",id:"senang"}, [/うれしい|嬉しい|楽しい|やった|最高|わーい|喜|笑顔|にこ/u]),
  semanticTag("love", {ja:"好き・愛情",en:"Love","zh-tw":"喜歡・愛",th:"รัก",id:"Cinta"}, {ja:"好き",en:"love","zh-tw":"喜歡",th:"รัก",id:"cinta"}, [/好き|大好き|愛|ハート|ラブ|恋愛|彼氏|彼女|独占欲/u]),
  semanticTag("anger", {ja:"怒り・イライラ",en:"Angry","zh-tw":"生氣",th:"โกรธ",id:"Marah"}, {ja:"怒り",en:"angry","zh-tw":"生氣",th:"โกรธ",id:"marah"}, [/怒|イライラ|ムカ|ぷんぷん|キレ|許さん|ふざけ/u]),
  semanticTag("sad", {ja:"悲しい・泣く",en:"Sad","zh-tw":"難過",th:"เศร้า",id:"Sedih"}, {ja:"悲しい",en:"sad","zh-tw":"難過",th:"เศร้า",id:"sedih"}, [/悲しい|かなしい|泣|涙|しょんぼり|つらい|辛い/u]),
  semanticTag("tired", {ja:"疲れた・休憩",en:"Tired","zh-tw":"疲累",th:"เหนื่อย",id:"Lelah"}, {ja:"疲れた",en:"tired","zh-tw":"疲累",th:"เหนื่อย",id:"lelah"}, [/疲れ|つかれ|しんど|だるい|眠い|寝る|休む|ぐでぐで/u]),
  semanticTag("worried", {ja:"不安・心配",en:"Worried","zh-tw":"擔心",th:"กังวล",id:"Khawatir"}, {ja:"心配",en:"worried","zh-tw":"擔心",th:"กังวล",id:"khawatir"}, [/不安|心配|どうしよう|大丈夫|気になる|気を遣|気をつか/u]),
  semanticTag("surprised", {ja:"びっくり・驚き",en:"Surprised","zh-tw":"驚訝",th:"ตกใจ",id:"Terkejut"}, {ja:"びっくり",en:"surprised","zh-tw":"驚訝",th:"ตกใจ",id:"terkejut"}, [/びっくり|驚|えっ|ええっ|まじ|マジ|なんと/u]),
  semanticTag("shy", {ja:"照れ・ツンデレ",en:"Shy & Tsundere","zh-tw":"害羞・傲嬌",th:"เขิน・ซึนเดเระ",id:"Malu & Tsundere"}, {ja:"ツンデレ",en:"shy-tsundere","zh-tw":"傲嬌",th:"ซึนเดเระ",id:"malu-tsundere"}, [/照れ|恥ずか|ツンデレ|べつに|別に/u]),

  // Scene / lifestyle inference
  semanticTag("morning", {ja:"朝・おはよう",en:"Morning","zh-tw":"早晨",th:"ตอนเช้า",id:"Pagi"}, {ja:"朝",en:"morning","zh-tw":"早晨",th:"ตอนเช้า",id:"pagi"}, [/朝|おはよう|起きた|起床/u]),
  semanticTag("night", {ja:"夜・おやすみ",en:"Night","zh-tw":"夜晚",th:"กลางคืน",id:"Malam"}, {ja:"夜",en:"night","zh-tw":"夜晚",th:"กลางคืน",id:"malam"}, [/夜|おやすみ|寝る|眠い|就寝/u]),
  semanticTag("meal", {ja:"ごはん・食事",en:"Meals","zh-tw":"吃飯",th:"มื้ออาหาร",id:"Makan"}, {ja:"ごはん",en:"meals","zh-tw":"吃飯",th:"มื้ออาหาร",id:"makan"}, [/ごはん|ご飯|食事|食べ|いただきます|ごちそうさま|料理|牛丼|肉まん|寿司/u]),
  semanticTag("drinking", {ja:"お酒・晩酌",en:"Drinks & Cheers","zh-tw":"喝酒・乾杯",th:"ดื่ม・ชนแก้ว",id:"Minum & Bersulang"}, {ja:"晩酌",en:"drinks-cheers","zh-tw":"喝酒",th:"ดื่ม",id:"minum-bersulang"}, [/晩酌|ビール|酒|ワイン|乾杯|飲み/u]),
  semanticTag("sleep", {ja:"睡眠・ねむい",en:"Sleep","zh-tw":"睡眠",th:"นอน",id:"Tidur"}, {ja:"睡眠",en:"sleep","zh-tw":"睡眠",th:"นอน",id:"tidur"}, [/睡眠|眠|寝る|布団|おやすみ/u]),
  semanticTag("school", {ja:"学校・中学生",en:"School","zh-tw":"學校",th:"โรงเรียน",id:"Sekolah"}, {ja:"学校",en:"school","zh-tw":"學校",th:"โรงเรียน",id:"sekolah"}, [/学校|中学生|高校生|学生|部活|先生|宿題/u]),
  semanticTag("office", {ja:"会社・職場",en:"Office","zh-tw":"公司・職場",th:"ออฟฟิศ",id:"Kantor"}, {ja:"職場",en:"office","zh-tw":"職場",th:"ออฟฟิศ",id:"kantor"}, [/会社|職場|上司|部下|同僚|業務|会議|マーケ|バイト/u]),
  semanticTag("home", {ja:"家・家庭",en:"Home","zh-tw":"家庭",th:"บ้าน",id:"Rumah"}, {ja:"家庭",en:"home","zh-tw":"家庭",th:"บ้าน",id:"rumah"}, [/家族|家庭|夫婦|ママ|パパ|旦那|妻|帰宅|ただいま|送迎/u]),
  semanticTag("pickup", {ja:"送迎・お迎え",en:"Pickup & Drop-off","zh-tw":"接送",th:"รับส่ง",id:"Antar Jemput"}, {ja:"送迎",en:"pickup-dropoff","zh-tw":"接送",th:"รับส่ง",id:"antar-jemput"}, [/送迎|迎え|お迎え|送り|保育園|幼稚園/u]),
];

export const tagDefinitions: TagDefinition[] = [
  ...phraseTagDefinitions,
  ...semanticTagDefinitions,
];

function buildInferenceText(sticker: StickerSearchSource): string {
  const phrases = getStickerPhrases(sticker.id);
  return [sticker.title || "", sticker.description || "", ...phrases]
    .filter(Boolean)
    .join(" ")
    .normalize("NFKC");
}

export function getTagIdsForSticker(sticker: StickerSearchSource): string[] {
  const phrases = getStickerPhrases(sticker.id);
  const phraseIds = getTagIdsForPhrases(phrases);
  const inferenceText = buildInferenceText(sticker);
  const semanticIds = semanticTagDefinitions
    .filter((tag) => tag.metadataPatterns.some((pattern) => pattern.test(inferenceText)))
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
