import type { Locale } from "./i18n";

type StickerTranslation = { en: string; "zh-tw": string; th: string };

// Product names are creator-authored Japanese on LINE STORE.  These curated
// display names keep the original character/idea while making the catalogue
// understandable in every supported language.
const titles: Record<string, StickerTranslation> = {
  "36149581": { en:"Ultra-Simple Bold Stickers for Grown Women", "zh-tw":"超簡約！成熟女子的率真貼圖", th:"สติกเกอร์สาววัยทำงาน เรียบง่ายและตรงไปตรงมา" },
  "36143733": { en:"40 Polite Replies for Work", "zh-tw":"工作場合適用的40款禮貌回覆貼圖", th:"40 สติกเกอร์ตอบกลับสุภาพสำหรับที่ทำงาน" },
  "36142235": { en:"40 Straight-Talking Messages for Family", "zh-tw":"給家人的40款直率暖心話語", th:"40 ข้อความตรง ๆ แต่อบอุ่นสำหรับครอบครัว" },
  "36137158": { en:"Simple Straight-Talking Showa Dad", "zh-tw":"昭和老爸的直率簡約貼圖", th:"คุณพ่อยุคโชวะ พูดตรง ๆ แบบเรียบง่าย" },
  "36136531": { en:"40 Inspiring Words from a Grown Man", "zh-tw":"成熟男人的40句暖心名言", th:"40 คำคมกินใจจากผู้ชายวัยผู้ใหญ่" },
  "36136296": { en:"Ultra-Simple Stickers for Capable Men", "zh-tw":"俐落男人的超簡約商務貼圖", th:"สติกเกอร์ธุรกิจสุดเรียบง่ายสำหรับหนุ่มมืออาชีพ" },
  "36135034": { en:"Blunt but Caring Messages for Guy Friends", "zh-tw":"給男性好友的直率友情貼圖", th:"ข้อความเพื่อนผู้ชาย พูดตรงแต่จริงใจ" },
  "36130275": { en:"40 Bold Text Stickers for Showa Men", "zh-tw":"昭和男子的40款豪氣文字貼圖", th:"40 สติกเกอร์ข้อความลูกผู้ชายสไตล์โชวะ" },
  "36129011": { en:"40 Sweet Messages Only for My Girlfriend", "zh-tw":"只對女友溫柔的男友・40款戀愛貼圖", th:"40 ข้อความหวานที่มีให้แฟนสาวคนเดียว" },
  "36125569": { en:"40 Awkward but Loving Messages from Him", "zh-tw":"男友給女友的40句笨拙聯絡", th:"40 ข้อความจากแฟนหนุ่มที่พูดไม่เก่งแต่รักนะ" },
  "36119361": { en:"40 Possessive Boyfriend Messages", "zh-tw":"佔有慾強烈的男友・40款貼圖", th:"40 ข้อความแฟนหนุ่มขี้หวง" },
  "36106671": { en:"Lazy Tamagomaruko: 40 Relatable Phrases", "zh-tw":"怕麻煩的卵丸子・40句共鳴語錄", th:"ทามาโกะมารุโกะจอมขี้เกียจ 40 คำโดนใจ" },
  "36098831": { en:"Black Cat Replies Only: 40 Stickers", "zh-tw":"黑貓只回一句・40款回覆貼圖", th:"เจ้าแมวดำตอบสั้น ๆ 40 สติกเกอร์" },
  "36094677": { en:"Black Cat Says What You Are Thinking", "zh-tw":"黑貓說出你的心裡話・40款", th:"เจ้าแมวดำพูดแทนใจ 40 สติกเกอร์" },
  "36093971": { en:"Gentle Hearts: Soft Pastel Stickers", "zh-tw":"溫柔愛心♡柔和粉彩貼圖", th:"หัวใจอ่อนโยน♡ สติกเกอร์สีพาสเทล" },
  "36089520": { en:"Tamagomaruko: 40 Middle School Girl Stickers", "zh-tw":"卵丸子女孩的40款國中生活貼圖", th:"ทามาโกะมารุโกะ 40 สติกเกอร์สาวมัธยมต้น" },
  "36086508": { en:"Dramatic Fukuoka, Hakata & Kurume Uncle", "zh-tw":"福岡・博多・久留米大叔劇畫貼圖", th:"คุณลุงฟุกุโอกะ ฮากาตะ และคุรุเมะแนวดราม่า" },
  "36086327": { en:"Cute Tsundere Penguin: Daily Chats", "zh-tw":"傲嬌企鵝的可愛日常對話", th:"เพนกวินซึนเดเระน่ารัก บทสนทนาประจำวัน" },
  "36082506": { en:"That Is Me: Black Cat Daily Chats", "zh-tw":"那就是我！黑貓的40款日常對話", th:"นั่นแหละฉัน! ชีวิตประจำวันของเจ้าแมวดำ" },
  "36081992": { en:"40 Little Requests from Parents", "zh-tw":"父母的小請託・40款小雞貼圖", th:"40 คำขอเล็ก ๆ จากพ่อแม่ สติกเกอร์ลูกเจี๊ยบ" },
  "36081734": { en:"Clueless Office Worker Tamagomaru's True Feelings", "zh-tw":"不太會工作的上班族卵丸真心話", th:"ความในใจของทามาโกะมารุ พนักงานที่ทำงานไม่เก่ง" },
  "36081623": { en:"That Is Me: Daily Chats of a Woman in Her 20s", "zh-tw":"那就是我！20代女子的日常對話", th:"นั่นแหละฉัน! บทสนทนาประจำวันของสาววัย 20" },
  "36081595": { en:"40 Pickup & Lesson Messages for Busy Moms", "zh-tw":"接送媽媽兔・40款才藝班聯絡貼圖", th:"40 ข้อความรับส่งลูกและเรียนพิเศษของคุณแม่กระต่าย" },
  "36080025": { en:"24 Cute Speech Bubbles with Brutally Honest Thoughts", "zh-tw":"毒舌真心話！24款可愛對話框貼圖", th:"24 บอลลูนคำพูดน่ารักแต่ตรงสุด ๆ" },
  "36079686": { en:"Fluffy Bunny Girl: 40 Reactions", "zh-tw":"毛茸茸兔兔女孩・40款反應貼圖", th:"สาวกระต่ายขนฟู 40 รีแอ็กชัน" },
  "36079210": { en:"Cute Grandpa & Grandchild: Happy Everyday Life", "zh-tw":"可愛爺爺與孫子【親密日常篇】", th:"คุณตาน่ารักกับหลาน ชีวิตประจำวันแสนสนิท" },
  "36078573": { en:"Soft Black Cat: 40 Everyday Stickers", "zh-tw":"療癒黑貓・40款天天都好用的貼圖", th:"แมวดำนุ่มนิ่ม 40 สติกเกอร์ใช้ได้ทุกวัน" },
  "36077622": { en:"40 Replies That Cover 90% of Middle School Chats", "zh-tw":"國中生九成對話都能用的40款回覆", th:"40 คำตอบที่ใช้ได้กับ 90% ของแชตวัยมัธยม" },
  "36068290": { en:"Hokamaru: 40 Warm Steamed-Bun Stickers", "zh-tw":"暖呼呼的Hokamaru・40款肉包貼圖", th:"โฮกะมารุ ซาลาเปาอุ่น ๆ 40 สติกเกอร์" },
  "36064596": { en:"Egg Sumo Tamagomaru: Apologies & Support", "zh-tw":"蛋相撲卵丸！道歉與打氣貼圖", th:"นักซูโม่ไข่ทามาโกะมารุ ขอโทษและให้กำลังใจ" },
  "36063245": { en:"Fluffy Pomeranian: 40 Healing Stickers", "zh-tw":"毛茸茸博美犬・40款療癒貼圖", th:"ปอมเมอเรเนียนขนฟู 40 สติกเกอร์ฮีลใจ" },
  "36063111": { en:"Egg Sumo Tamagomaru: Everyday Sumo Stickers", "zh-tw":"蛋相撲卵丸！天天好用的相撲貼圖", th:"นักซูโม่ไข่ทามาโกะมารุ ใช้ได้ทุกวัน" },
  "36062692": { en:"Sushi Vehicles: Surreal & Funny", "zh-tw":"壽司×交通工具！超現實搞笑貼圖", th:"ซูชิพาหนะ ฮาเหนือจริง" },
  "36059387": { en:"Strong but Timid Animals", "zh-tw":"外表強大、內心膽小的動物貼圖", th:"สัตว์ดูแข็งแกร่งแต่ใจบาง" },
  "36058653": { en:"Practical & Cute Stickers for Grown Women", "zh-tw":"實用優先！成熟可愛主婦貼圖", th:"ใช้ง่ายเป็นหลัก สติกเกอร์แม่บ้านน่ารักสไตล์ผู้ใหญ่" },
  "36056177": { en:"The Simple & Cute LINE Sticker Set", "zh-tw":"想要簡約就選這款！可愛LINE貼圖", th:"ถ้าชอบเรียบง่าย ต้องชุดนี้! สติกเกอร์ LINE น่ารัก" },
  "36054209": { en:"Potepiyo: Gentle Honest Thoughts & Polite Words", "zh-tw":"Potepiyo的療癒真心話與客套話・40款", th:"โปเตะปิโยะ ความในใจและคำพูดสุภาพ 40 สติกเกอร์" },
  "36052990": { en:"Antenna Chick: 40 Polite Business Stickers", "zh-tw":"天線小雞・40款敬語商務貼圖", th:"ลูกเจี๊ยบเสาอากาศ 40 สติกเกอร์สุภาพสำหรับงาน" },
  "36052650": { en:"Nursery & Kindergarten Messages for Moms", "zh-tw":"媽媽的托兒所・幼兒園聯絡貼圖", th:"ข้อความติดต่อเนอสเซอรี่และอนุบาลสำหรับคุณแม่" },
  "36051910": { en:"40 Essential Everyday Family Messages", "zh-tw":"家人專用！精選40款日常聯絡貼圖", th:"40 ข้อความติดต่อประจำวันสำหรับครอบครัว" },
  "36050825": { en:"Cheers! 40 Drinks Stickers for Grown Women", "zh-tw":"乾杯！成熟女子的40款喝酒貼圖", th:"ชนแก้ว! 40 สติกเกอร์สายดื่มสำหรับสาววัยผู้ใหญ่" },
  "36050697": { en:"Tamagokun's Laid-Back, Low-Energy Days", "zh-tw":"蛋君的慵懶無力日常", th:"ชีวิตประจำวันชิล ๆ ไร้เรี่ยวแรงของทามาโกะคุง" },
  "36050370": { en:"Crayon Greetings with a Housewife & Dog", "zh-tw":"用便條裝飾問候♪主婦與小狗蠟筆貼圖", th:"คำทักทายสีเทียนของคุณแม่บ้านกับน้องหมา" },
  "36046487": { en:"Large-Text Antenna Chick for Checking on Parents", "zh-tw":"關心父母的天線小雞・大字版", th:"ลูกเจี๊ยบเสาอากาศตัวอักษรใหญ่ สำหรับถามไถ่พ่อแม่" },
  "36046443": { en:"Round-Face Antenna Speech Bubbles for Every Day", "zh-tw":"圓臉天線對話框・天天好用貼圖", th:"หน้ากลมเสาอากาศในบอลลูนคำพูด ใช้ได้ทุกวัน" },
  "36037821": { en:"Egg Sumo Tamagomaru: Dosukoi Cheer Stickers", "zh-tw":"蛋相撲卵丸！加油打氣貼圖", th:"นักซูโม่ไข่ทามาโกะมารุ สติกเกอร์เชียร์" },
  "36035945": { en:"Dog-Hood Girl: Time & Meeting Stickers", "zh-tw":"狗狗頭套女孩♡時間與約會貼圖", th:"สาวหมวกน้องหมา สติกเกอร์เวลาและนัดพบ" },
  "36033035": { en:"Laid-Back Traffic Light: Simple Greetings", "zh-tw":"悠哉紅綠燈君・簡約問候貼圖", th:"เจ้าสัญญาณไฟชิล ๆ คำทักทายเรียบง่าย" },
  "36031741": { en:"Peekaboo... Then a Powerful BOO!", "zh-tw":"躲貓貓～然後猛烈「哇！」", th:"จ๊ะเอ๋... แล้วก็ “แบร่!” แบบจัดเต็ม" },
  "36031221": { en:"Wild Hamster: Full-Power Reactions", "zh-tw":"激動倉鼠！全力反應貼圖", th:"แฮมสเตอร์สุดเดือด รีแอ็กชันเต็มพลัง" },
  "36029615": { en:"The Science Teacher Is Terrifying!", "zh-tw":"理科老師太可怕了！國中生貼圖", th:"ครูวิทย์น่ากลัวเกินไป! สำหรับนักเรียนมัธยม" },
  "36021937": { en:"Potepiyo's Laid-Back Everyday Life: 40 Stickers", "zh-tw":"Potepiyo的悠哉日常・40款", th:"ชีวิตประจำวันชิล ๆ ของโปเตะปิโยะ 40 สติกเกอร์" },
  "36015374": { en:"Gentle Grandma & Grandchild: Happy Everyday Life", "zh-tw":"溫柔奶奶與孫子【親密日常篇】", th:"คุณยายใจดีกับหลาน ชีวิตประจำวันแสนสนิท" },
  "36010363": { en:"Quirky Kitty's Daily Life: 40 Stickers", "zh-tw":"個性小貓的日常・40款LINE貼圖", th:"ชีวิตประจำวันของเจ้าเหมียวสุดมีเอกลักษณ์ 40 สติกเกอร์" },
  "36010241": { en:"Baby's Daily Diaper Disaster: 40 Stickers", "zh-tw":"寶寶日常：便便漏出來了・40款", th:"ชีวิตประจำวันของเบบี๋ อึล้นผ้าอ้อม 40 สติกเกอร์" },
  "36005311": { en:"Beagle Detective: Everyday Mystery Stickers", "zh-tw":"米格魯偵探君｜天天好用的推理貼圖", th:"นักสืบบีเกิล สติกเกอร์สืบสวนใช้ได้ทุกวัน" },
  "36005258": { en:"Timid Lion: Gentle Everyday Stickers", "zh-tw":"膽小獅子君｜溫柔日常貼圖", th:"เจ้าสิงโตขี้กลัว สติกเกอร์ประจำวันแสนอ่อนโยน" },
  "35994383": { en:"Gentle Meerkat: 40 Daily Chat Stickers", "zh-tw":"溫柔狐獴！40款日常對話", th:"เมียร์แคตแสนอ่อนโยน 40 บทสนทนาประจำวัน" },
  "35992171": { en:"Cute Tsundere Panda: 40 Everyday Stickers", "zh-tw":"可愛傲嬌熊貓・40款日常貼圖", th:"แพนด้าซึนเดเระน่ารัก 40 สติกเกอร์ประจำวัน" },
  "35990307": { en:"A Man's Rear-Solve! Fundoshi Pun Stickers", "zh-tw":"男子漢的臀力！兜襠布諧音貼圖", th:"พลังบั้นท้ายลูกผู้ชาย! สติกเกอร์มุกฟุนโดชิ" },
  "35989858": { en:"Moped Girl: Full-Throttle Daily Life", "zh-tw":"機車辣妹・爆走情緒MAX日常篇", th:"สาวมอเตอร์ไซค์ซิ่ง อารมณ์เต็มแม็กซ์ในชีวิตประจำวัน" },
  "35986013": { en:"Lonely Koala Wants Your Attention: 40 Stickers", "zh-tw":"怕寂寞、想被關注的無尾熊・40款", th:"โคอาล่าขี้เหงาอยากให้อ้อน 40 สติกเกอร์" },
  "35985127": { en:"Tsundere Hedgehog: Daily Chats", "zh-tw":"傲嬌刺蝟的日常對話貼圖", th:"เม่นซึนเดเระ บทสนทนาประจำวัน" },
  "35973975": { en:"Fluffy Sticker-Style Schoolgirl Kitty: 16 Stickers", "zh-tw":"毛茸茸貼紙風小學生貓咪・16款", th:"ลูกแมวนักเรียนประถมสไตล์สติกเกอร์ฟู ๆ 16 แบบ" },
  "35972158": { en:"Friends from Hell: 40 Daily Greetings", "zh-tw":"地獄好友的40款日常問候貼圖", th:"เพื่อนจากนรก 40 คำทักทายประจำวัน" },
  "35971208": { en:"Girl with a Giant Wine Glass: 40 Daily Chats", "zh-tw":"巨型紅酒杯系女子・40款日常對話", th:"สาวแก้วไวน์ยักษ์ 40 บทสนทนาประจำวัน" },
  "35969956": { en:"Soft Orange Tabby Greetings: 40 Stickers", "zh-tw":"柔和筆觸橘貓問候・40款", th:"คำทักทายจากแมวส้มลายเส้นนุ่ม 40 สติกเกอร์" },
  "35969181": { en:"Fluffy Sticker-Style Ordinary Girl: 40 Stickers", "zh-tw":"毛茸茸貼紙風普通女孩・40款", th:"สาวธรรมดาสไตล์สติกเกอร์ฟู ๆ 40 แบบ" },
  "35965581": { en:"School Pup's Reassuring Daily Messages", "zh-tw":"小學生狗狗的安心日常對話與聯絡", th:"บทสนทนาอุ่นใจและข้อความประจำวันของน้องหมานักเรียน" },
  "35949279": { en:"Mom & Dad Can Relax: School Kitty Stickers", "zh-tw":"爸媽安心！小學生貓咪貼圖", th:"พ่อแม่สบายใจ! สติกเกอร์เจ้าเหมียวนักเรียนประถม" },
  "35948420": { en:"Hamster Reporter on Assignment: 40 Stickers", "zh-tw":"倉鼠記者採訪中！40款貼圖", th:"นักข่าวแฮมสเตอร์กำลังทำข่าว 40 สติกเกอร์" },
  "35948037": { en:"Gentle, Easy-to-Read Everyday Stickers", "zh-tw":"天天好用・清楚易讀的溫柔貼圖", th:"สติกเกอร์อ่อนโยน อ่านง่าย ใช้ได้ทุกวัน" },
  "35942219": { en:"40 Cute Girls' Night & Best-Friend Chats", "zh-tw":"女友間的日常LINE・40款可愛女子會貼圖", th:"40 แชตน่ารักกับเพื่อนสาวและปาร์ตี้สาว ๆ" },
  "35917093": { en:"To My Boyfriend: Heart-Fluttering Messages from Her", "zh-tw":"給男友…讓人心動的女友LINE貼圖", th:"ถึงแฟนหนุ่ม... ข้อความชวนใจเต้นจากแฟนสาว" },
  "35915360": { en:"Goggle Girl: The Tanned Gal Incident Files", "zh-tw":"護目鏡女孩！小麥肌辣妹曬黑事件簿", th:"สาวแว่นโกเกิล คดีผิวแทนของสาวแกล" },
  "35912888": { en:"The Informant's Polite Business Replies", "zh-tw":"密告者的商務回覆集・禮貌認真篇", th:"ชุดคำตอบธุรกิจสุภาพของสายลับผู้แจ้งข่าว" },
  "35911207": { en:"Cinematic Prison-Uniform Informant: 40 Stickers", "zh-tw":"電影感囚服密告者・40款搞笑貼圖", th:"สายลับชุดนักโทษสไตล์ภาพยนตร์ 40 สติกเกอร์" },
  "35910876": { en:"Bear Girl's Fluffy, Healing Daily Life", "zh-tw":"熊熊女孩的療癒毛茸茸日常・40款", th:"ชีวิตประจำวันฟู ๆ ฮีลใจของสาวหมี 40 สติกเกอร์" },
  "35910600": { en:"Sparrow Girl's Busy Fluffy Days: 40 Stickers", "zh-tw":"麻雀女孩忙碌又毛茸茸的日常・40款", th:"วันวุ่น ๆ ฟู ๆ ของสาวนกกระจอก 40 สติกเกอร์" },
  "35909858": { en:"Seal Girl's Lazy Fluffy Days: 40 Stickers", "zh-tw":"海豹女孩懶洋洋的毛茸茸日常・40款", th:"วันขี้เกียจฟู ๆ ของสาวแมวน้ำ 40 สติกเกอร์" },
  "35909603": { en:"Fluffy Bunny Girl's Heart-Pounding Days", "zh-tw":"毛茸茸兔兔女孩的心動日常・40款", th:"วันชวนใจเต้นของสาวกระต่ายขนฟู 40 สติกเกอร์" },
  "35908718": { en:"Fluffy Puppy Girl's Honest Daily Life", "zh-tw":"毛茸茸狗狗女孩的率真日常・40款", th:"ชีวิตประจำวันแสนจริงใจของสาวน้องหมาขนฟู" },
  "35908469": { en:"Cat-Hood Girl's Moody Daily Life", "zh-tw":"貓咪頭套女孩的隨性日常・40款", th:"ชีวิตประจำวันตามอารมณ์ของสาวหมวกแมว" },
  "35907869": { en:"Fluffy Daily Life of a Panda-Hood Girl", "zh-tw":"熊貓頭套女孩的毛茸茸日常", th:"ชีวิตประจำวันฟู ๆ ของสาวหมวกแพนด้า" },
  "35907512": { en:"Trash Bags for Words You Want to Delete: 40 Stickers", "zh-tw":"想丟掉的話語垃圾袋・40款貼圖", th:"ถุงขยะสำหรับคำที่อยากลบ 40 สติกเกอร์" },
  "35905563": { en:"Huge Beer Mug! After-Work Drinks for Women", "zh-tw":"超大啤酒杯！職場女子下班小酌貼圖", th:"แก้วเบียร์ยักษ์! สติกเกอร์สาวทำงานดื่มหลังเลิกงาน" },
  "35904975": { en:"Maracas Grandma: 40 LINE Stickers", "zh-tw":"沙鈴奶奶・40款LINE貼圖", th:"คุณยายมาราคัส 40 สติกเกอร์ LINE" },
  "35900046": { en:"Smiling but Savage Grandpa & Grandma", "zh-tw":"笑著說真話的毒舌爺爺奶奶", th:"คุณตาคุณยายยิ้มหวานแต่พูดตรงสุด ๆ" },
  "35898720": { en:"Annoying Commentator Igaguri's 40 Opinions", "zh-tw":"煩人解說少年小刺頭的40種見解", th:"40 ความเห็นของอิกะกุริ เด็กนักวิเคราะห์จอมกวน" },
  "35897590": { en:"40 Stickers: I'm Not a Tsundere Cat, Meow", "zh-tw":"40款：我才不是傲嬌貓喵", th:"40 สติกเกอร์: ฉันไม่ใช่แมวซึนเดเระนะเหมียว" },
  "35896604": { en:"The Crooked-Wig Uncle Speaks with His Face", "zh-tw":"用臉說話：假髮歪掉的大叔", th:"คุณลุงวิกเบี้ยว สื่อสารทุกอย่างด้วยสีหน้า" },
  "35896119": { en:"Part-Time Hero Squad Baiters: 40 Messages", "zh-tw":"打工戰隊 Baiters・40款聯絡貼圖", th:"ขบวนการฮีโร่พาร์ตไทม์ Baiters 40 ข้อความ" },
  "35896078": { en:"Everyday Hero Squad Arunjers: 40 Relatable Moments", "zh-tw":"日常戰隊 Arunjers・40款生活共鳴", th:"ขบวนการฮีโร่ชีวิตประจำวัน Arunjers 40 เรื่องโดนใจ" },
  "35896047": { en:"The Futon God Who Puts You to Sleep with Proverbs", "zh-tw":"用諺語哄你睡的棉被之神・40款", th:"เทพแห่งฟูกผู้กล่อมให้นอนด้วยสุภาษิต 40 สติกเกอร์" },
  "35896029": { en:"40 Imaginary Medicines for Troubled Times", "zh-tw":"遇到困難時的40款架空藥物貼圖", th:"40 ยาสมมติสำหรับเวลามีปัญหา" },
  "35895960": { en:"E-Commerce Hero Squad Marketers", "zh-tw":"EC戰隊 Marketers｜行銷人日常", th:"ขบวนการฮีโร่อีคอมเมิร์ซ Marketers เรื่องจริงของนักการตลาด" },
  "35868815": { en:"Reverse-Panda Boy Tells the Truth", "zh-tw":"逆熊貓少年的正論", th:"เด็กชายแพนด้ากลับสีพูดความจริง" },
  "35866552": { en:"40 Everyday Orange Tabby Cat Stickers", "zh-tw":"橘貓的40款天天貼圖喵", th:"40 สติกเกอร์แมวส้มใช้ได้ทุกวันเหมียว" },
  "35853766": { en:"Tools for Erasing Memories: 40 Stickers", "zh-tw":"想刪除的記憶用品・40款貼圖", th:"อุปกรณ์ลบความทรงจำ 40 สติกเกอร์" },
  "35852933": { en:"Sprays & Appliances for Erasing Words", "zh-tw":"消除話語的噴霧與家電貼圖", th:"สเปรย์และเครื่องใช้ไฟฟ้าสำหรับลบคำพูด" },
  "35851847": { en:"Chubby Monkey: Brazen & Surreal Daily Life", "zh-tw":"圓滾滾猴子！厚臉皮的超現實日常", th:"ลิงอ้วนจอมหน้าหนา ชีวิตประจำวันเหนือจริง" },
  "35827556": { en:"Cute Tsundere Shiba: 40 Daily Chats", "zh-tw":"可愛傲嬌柴犬・40款日常對話", th:"ชิบะซึนเดเระน่ารัก 40 บทสนทนาประจำวัน" },
  "35824996": { en:"40 Cute Corgi Butt Stickers", "zh-tw":"40款可愛柯基屁屁貼圖", th:"40 สติกเกอร์ก้นคอร์กี้สุดน่ารัก" },
  "35824678": { en:"Chubby Raccoon Dog: Brazen & Surreal", "zh-tw":"圓滾滾狸貓！厚臉皮超現實日常", th:"ทานูกิอ้วนจอมหน้าหนา ชีวิตเหนือจริง" },
  "35824014": { en:"Chubby Dog: Brazen & Surreal Daily Life", "zh-tw":"圓滾滾狗狗！厚臉皮超現實日常", th:"น้องหมาอ้วนจอมหน้าหนา ชีวิตเหนือจริง" },
  "35819929": { en:"Chubby Mouse: Brazen & Surreal Daily Life", "zh-tw":"圓滾滾老鼠！厚臉皮超現實日常", th:"หนูอ้วนจอมหน้าหนา ชีวิตเหนือจริง" },
  "35819099": { en:"Chubby Cat: Brazen & Surreal Daily Life", "zh-tw":"圓滾滾貓咪！厚臉皮超現實日常", th:"แมวอ้วนจอมหน้าหนา ชีวิตเหนือจริง" },
  "35818703": { en:"Fukuoka Uncle: Hakata & Chikugo Dialects", "zh-tw":"福岡方言大叔：博多腔・筑後腔", th:"คุณลุงภาษาถิ่นฟุกุโอกะ ฮากาตะและชิคุโกะ" },
  "35817849": { en:"Red-Ink Seals: Polite Business Stickers", "zh-tw":"朱肉印章：工作敬語與商務貼圖", th:"ตราประทับหมึกแดง คำสุภาพสำหรับงานและธุรกิจ" },
  "35776429": { en:"Mokee Mini Stickers: Everyday Edition", "zh-tw":"Mokee迷你貼圖【日常篇】", th:"สติกเกอร์โมเคะมินิ ตอนชีวิตประจำวัน" },
  "35770799": { en:"Mokee Stickers: Everyday Edition", "zh-tw":"Mokee貼圖【日常篇】", th:"สติกเกอร์โมเคะ ตอนชีวิตประจำวัน" },
  "35770498": { en:"My Cute Baby: Everyday Edition", "zh-tw":"我的可愛寶寶【日常篇】", th:"เบบี๋น่ารักของฉัน ตอนชีวิตประจำวัน" },
  "35770137": { en:"High-Waist Bunny: Everyday Edition", "zh-tw":"高腰兔兔【日常篇】", th:"กระต่ายเอวสูง ตอนชีวิตประจำวัน" },
};

const genericTitles = {
  en: (id: string) => `Original LINE Sticker Set ${id}`,
  "zh-tw": (id: string) => `原創LINE貼圖系列 ${id}`,
  th: (id: string) => `ชุดสติกเกอร์ LINE ต้นฉบับ ${id}`,
};

export function cleanStickerTitle(title = "") {
  return title.replace(/\s*-\s*LINE\s*スタンプ\s*\|\s*LINE\s*STORE\s*$/i, "").trim();
}

export function localizedStickerTitle(sticker: { id: string; title?: string }, locale: Locale) {
  if (locale === "ja") return cleanStickerTitle(sticker.title || "");
  return titles[String(sticker.id)]?.[locale] || genericTitles[locale](String(sticker.id));
}

export function localizedStickerDescription(sticker: { id: string; title?: string; description?: string }, locale: Locale) {
  if (locale === "ja") return sticker.description || "";
  const title = localizedStickerTitle(sticker, locale);
  if (locale === "en") return `Discover “${title},” an original LINE sticker set by stamp moke for everyday chats.`;
  if (locale === "zh-tw") return `探索stamp moke原創作品「${title}」，讓日常LINE對話更可愛、更有趣。`;
  return `พบกับ “${title}” สติกเกอร์ LINE ต้นฉบับจาก stamp moke สำหรับแชตประจำวัน`;
}

export function localizedStickerPrice(price: string | undefined, locale: Locale) {
  if (!price) return "";
  if (locale === "ja") return price;
  return locale === "en" ? "Check price on LINE STORE" : locale === "zh-tw" ? "請至LINE STORE確認目前價格" : "ตรวจสอบราคาปัจจุบันบน LINE STORE";
}
