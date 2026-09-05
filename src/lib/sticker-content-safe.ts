import type { Locale } from "./i18n";
import { localizedStickerDescription, localizedStickerPrice, localizedStickerTitle } from "./sticker-content";

type Sticker = { id: string; title?: string; description?: string };

export function safeStickerTitle(sticker: Sticker, locale: Locale) {
  if (locale === "zh-cn") return `原创LINE贴图 ${sticker.id}`;
  if (locale === "ko") return `오리지널 LINE 스티커 ${sticker.id}`;
  return localizedStickerTitle(sticker, locale);
}

export function safeStickerDescription(sticker: Sticker, locale: Locale) {
  if (locale === "zh-cn") return `stamp moke原创LINE贴图。适合日常聊天、工作、家人和朋友之间轻松使用。商品编号：${sticker.id}`;
  if (locale === "ko") return `stamp moke의 오리지널 LINE 스티커입니다. 일상 대화, 업무, 가족과 친구와의 채팅에 편하게 사용할 수 있습니다. 상품 번호: ${sticker.id}`;
  return localizedStickerDescription(sticker, locale);
}

export function safeStickerPrice(price: string | undefined, locale: Locale) {
  if (!price) return "";
  if (locale === "zh-cn") return "请在LINE STORE确认当前价格";
  if (locale === "ko") return "현재 가격은 LINE STORE에서 확인하세요";
  return localizedStickerPrice(price, locale);
}
