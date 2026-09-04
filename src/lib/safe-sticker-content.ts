import type { Locale } from "./i18n";
import { localizedStickerTitle } from "./sticker-content";

/**
 * The legacy curated sticker title catalogue currently has entries for
 * en / zh-tw / th / id. Keep those translations, while giving the two
 * newer locales a non-Japanese fallback instead of calling an undefined
 * legacy title generator.
 */
export function safeLocalizedStickerTitle(
  sticker: { id: string; title?: string },
  locale: Locale,
) {
  if (locale === "zh-cn") return `原创 LINE 贴图系列 ${sticker.id}`;
  if (locale === "ko") return `오리지널 LINE 스티커 세트 ${sticker.id}`;
  return localizedStickerTitle(sticker, locale);
}
