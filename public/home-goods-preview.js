(() => {
  const start = () => {
    const path = window.location.pathname || "/";
    const homeMatch = path.match(/^\/(?:((?:en|zh-tw|zh-cn|ko|th|id))\/)?$/);
    if (!homeMatch) return;

    const section = document.querySelector("#character-goods");
    if (!section) return;

    const cards = Array.from(section.querySelectorAll(".goods-grid .goods-card"));
    const total = cards.length;
    const limit = 8;
    cards.slice(limit).forEach((card) => card.remove());

    const count = section.querySelector(".section-count");
    if (count && total > limit) count.textContent = `${Math.min(limit, total)} / ${total} DESIGNS`;

    const locale = homeMatch[1] || "ja";
    const prefix = locale === "ja" ? "" : `/${locale}`;
    const button = section.querySelector(".goods-shop-button");
    if (button) {
      const labels = {
        ja: "もっと見る →",
        en: "View more →",
        "zh-tw": "查看更多 →",
        "zh-cn": "查看更多 →",
        ko: "더 보기 →",
        th: "ดูเพิ่มเติม →",
        id: "Lihat lainnya →",
      };
      button.href = `${prefix}/goods/`;
      button.removeAttribute("target");
      button.removeAttribute("rel");
      button.textContent = labels[locale] || labels.ja;
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
