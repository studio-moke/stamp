import fs from "node:fs";
import path from "node:path";

const AUTHOR_URL =
  "https://store.line.me/stickershop/author/6507349/ja";

const outputDir = path.resolve("src/data");
const outputFile = path.join(outputDir, "stickers.json");

const imageDir =
  path.resolve("public/images/stickers");


/* --------------------------------
   LINE STOREへアクセスするための設定
-------------------------------- */

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",

  "Accept-Language":
    "ja-JP,ja;q=0.9",

  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
};


const imageHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",

  Referer:
    "https://store.line.me/",

  Accept:
    "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
};


/* --------------------------------
   少し待つ
-------------------------------- */

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}


/* --------------------------------
   HTML取得
-------------------------------- */

async function getHtml(url) {
  const response = await fetch(url, {
    headers,
  });

  if (!response.ok) {
    throw new Error(
      `${response.status}: ${url}`
    );
  }

  return await response.text();
}


/* --------------------------------
   HTML文字参照を戻す
-------------------------------- */

function decodeHtml(text) {
  if (!text) {
    return "";
  }

  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")

    /* 数値文字参照 */
    .replace(/&#(\d+);/g, (_, code) => {
      try {
        return String.fromCodePoint(
          Number(code)
        );
      } catch {
        return _;
      }
    })

    /* 16進数文字参照 */
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => {
      try {
        return String.fromCodePoint(
          parseInt(code, 16)
        );
      } catch {
        return _;
      }
    });
}


/* --------------------------------
   HTMLタグを除去して文章にする
-------------------------------- */

function cleanText(text) {
  return decodeHtml(
    text
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}


/* --------------------------------
   作者ページから商品URLを取得
-------------------------------- */

function extractProducts(html) {
  const products = [];

  const pattern =
    /href="(\/stickershop\/product\/(\d+)\/ja)"[^>]*>([\s\S]*?)<\/a>/g;

  let match;

  while (
    (match = pattern.exec(html)) !== null
  ) {
    const url =
      `https://store.line.me${match[1]}`;

    const id = match[2];

    let title = cleanText(match[3]);

    if (
      !products.some(
        (item) => item.id === id
      )
    ) {
      products.push({
        id,
        title,
        url,

        /* 今回追加 */
        description: "",
        price: "",

        /*
         * LINE STOREの商品ページ。
         * 購入・プレゼントのボタンは
         * 最終的にこのURLへリンクさせます。
         */
        purchaseUrl: url,
        giftUrl: url,

        imageUrl: "",
        image: "",
      });
    }
  }

  return products;
}


/* --------------------------------
   商品ページから情報を取得
-------------------------------- */

async function getProductInfo(product) {
  try {
    const html =
      await getHtml(product.url);


    /* --------------------------------
       タイトル
    -------------------------------- */

    const titlePatterns = [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,

      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,

      /<h1[^>]*>([\s\S]*?)<\/h1>/i,
    ];


    for (
      const pattern of titlePatterns
    ) {
      const match =
        html.match(pattern);

      if (match) {
        const title =
          cleanText(match[1]);

        if (title) {
          product.title = title;
          break;
        }
      }
    }


    /* --------------------------------
       説明文
       
       LINE STOREの商品ページにある

       <p class="mdCMN38Item01Txt">
         説明文
       </p>

       を取得
    -------------------------------- */

    const descriptionPatterns = [

      /* 今回の本命 */
      /<p[^>]*class=["'][^"']*mdCMN38Item01Txt[^"']*["'][^>]*>([\s\S]*?)<\/p>/i,

      /* classの順番などが変わった場合 */
      /class=["'][^"']*mdCMN38Item01Txt[^"']*["'][^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i,

      /* SEO用descriptionを予備として使用 */
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,

      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
    ];


    for (
      const pattern of descriptionPatterns
    ) {
      const match =
        html.match(pattern);

      if (match) {
        const description =
          cleanText(match[1]);

        if (description) {
          product.description =
            description;

          break;
        }
      }
    }


    /* --------------------------------
       価格
       
       ￥190
       ¥190
       などを取得
    -------------------------------- */

    const pricePatterns = [

      /(?:￥|¥)\s*([0-9,]+)\s*(?:円)?/i,

      /([0-9,]+)\s*円/i,
    ];


    for (
      const pattern of pricePatterns
    ) {
      const match =
        html.match(pattern);

      if (match) {
        product.price =
          `￥${match[1]}`;

        break;
      }
    }


    /* --------------------------------
       商品画像
    -------------------------------- */

    const imagePatterns = [

      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,

      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,

      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,

      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    ];


    let imageUrl = "";


    for (
      const pattern of imagePatterns
    ) {
      const match =
        html.match(pattern);

      if (match) {
        imageUrl =
          decodeHtml(match[1]);

        break;
      }
    }


    /* --------------------------------
       og:imageが取れなかった場合
       ページ内のLINE画像を探す
    -------------------------------- */

    if (!imageUrl) {

      const imgPattern =
        /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;

      const matches = [
        ...html.matchAll(imgPattern),
      ];


      for (
        const match of matches
      ) {
        const src =
          decodeHtml(match[1]);


        if (
          src.includes(
            "line-scdn.net"
          ) ||
          src.includes(
            "line.me"
          )
        ) {
          imageUrl = src;
          break;
        }
      }
    }


    /* --------------------------------
       //example.com を https:// にする
    -------------------------------- */

    if (
      imageUrl.startsWith("//")
    ) {
      imageUrl =
        "https:" + imageUrl;
    }


    if (imageUrl) {
      product.imageUrl =
        imageUrl;
    }


    /* --------------------------------
       デバッグ用表示
    -------------------------------- */

    console.log(
      `  説明文: ${
        product.description
          ? "取得OK"
          : "なし"
      }`
    );

    console.log(
      `  価格: ${
        product.price
          ? product.price
          : "なし"
      }` 
    );


    return product;


  } catch (error) {

    console.log(
      `  商品情報取得失敗: ${product.url}`
    );

    console.log(
      `  ${error.message}`
    );

    return product;
  }
}


/* --------------------------------
   画像の拡張子を判定
-------------------------------- */

function getExtension(
  contentType,
  imageUrl
) {

  const type =
    (contentType || "")
      .toLowerCase();


  if (
    type.includes("png")
  ) {
    return ".png";
  }


  if (
    type.includes("webp")
  ) {
    return ".webp";
  }


  if (
    type.includes("gif")
  ) {
    return ".gif";
  }


  if (
    type.includes("jpeg") ||
    type.includes("jpg")
  ) {
    return ".jpg";
  }


  const cleanUrl =
    imageUrl
      .split("?")[0]
      .toLowerCase();


  if (
    cleanUrl.endsWith(".png")
  ) {
    return ".png";
  }


  if (
    cleanUrl.endsWith(".webp")
  ) {
    return ".webp";
  }


  if (
    cleanUrl.endsWith(".jpg") ||
    cleanUrl.endsWith(".jpeg")
  ) {
    return ".jpg";
  }


  return ".png";
}


/* --------------------------------
   商品画像をダウンロード
-------------------------------- */

async function downloadImage(product) {

  if (!product.imageUrl) {
    return false;
  }


  try {

    const response =
      await fetch(
        product.imageUrl,
        {
          headers:
            imageHeaders,
        }
      );


    if (!response.ok) {

      console.log(
        `  画像取得失敗: ${response.status}`
      );

      return false;
    }


    const contentType =
      response.headers.get(
        "content-type"
      ) || "";


    if (
      !contentType.includes("image")
    ) {

      console.log(
        `  画像ではありません: ${contentType}`
      );

      return false;
    }


    const extension =
      getExtension(
        contentType,
        product.imageUrl
      );


    const filename =
      `${product.id}${extension}`;


    const filepath =
      path.join(
        imageDir,
        filename
      );


    const arrayBuffer =
      await response.arrayBuffer();


    fs.writeFileSync(
      filepath,
      Buffer.from(arrayBuffer)
    );


    /*
     * Astroから見えるパス
     */

    product.image =
      `/images/stickers/${filename}`;


    return true;


  } catch (error) {

    console.log(
      `  画像保存失敗: ${error.message}`
    );

    return false;
  }
}


/* --------------------------------
   メイン処理
-------------------------------- */

async function main() {

  console.log("");
  console.log(
    "================================="
  );
  console.log(
    " STAMP MOKE 自動取得"
  );
  console.log(
    "================================="
  );
  console.log("");


  /* --------------------------------
     保存フォルダ作成
  -------------------------------- */

  fs.mkdirSync(
    outputDir,
    {
      recursive: true,
    }
  );


  fs.mkdirSync(
    imageDir,
    {
      recursive: true,
    }
  );


  const allProducts = [];


  /* --------------------------------
     作者ページを取得
  -------------------------------- */

  for (
    let page = 1;
    page <= 10;
    page++
  ) {

    const url =
      page === 1
        ? AUTHOR_URL
        : `${AUTHOR_URL}?page=${page}`;


    console.log(
      `ページ ${page} を取得中...`
    );


    let html;


    try {

      html =
        await getHtml(url);

    } catch (error) {

      if (
        String(error)
          .includes("404")
      ) {

        console.log(
          "  → これ以上ページはありません"
        );

        break;
      }


      throw error;
    }


    const products =
      extractProducts(html);


    console.log(
      `  → ${products.length}作品`
    );


    if (
      products.length === 0
    ) {
      break;
    }


    for (
      const product of products
    ) {

      if (
        !allProducts.some(
          (item) =>
            item.id === product.id
        )
      ) {

        allProducts.push(
          product
        );
      }
    }


    await sleep(500);
  }


  console.log("");

  console.log(
    `合計 ${allProducts.length}作品`
  );

  console.log("");


  /* --------------------------------
     商品ページから情報取得
  -------------------------------- */

  console.log(
    "商品情報を取得しています..."
  );

  console.log("");


  for (
    let i = 0;
    i < allProducts.length;
    i++
  ) {

    const product =
      allProducts[i];


    console.log(
      `[${i + 1}/${allProducts.length}] ${product.title}`
    );


    await getProductInfo(
      product
    );


    await sleep(300);
  }


  /* --------------------------------
     画像ダウンロード
  -------------------------------- */

  console.log("");

  console.log(
    "スタンプ画像を保存しています..."
  );

  console.log("");


  let imageCount = 0;


  for (
    let i = 0;
    i < allProducts.length;
    i++
  ) {

    const product =
      allProducts[i];


    if (
      !product.imageUrl
    ) {

      console.log(
        `[${i + 1}/${allProducts.length}] 画像URLなし`
      );

      continue;
    }


    console.log(
      `[${i + 1}/${allProducts.length}] ${product.title}`
    );


    const success =
      await downloadImage(
        product
      );


    if (success) {
      imageCount++;
    }


    await sleep(300);
  }


  /* --------------------------------
     JSONを整理
  -------------------------------- */

  const outputProducts =
    allProducts.map(
      (product) => ({

        id:
          product.id,

        title:
          product.title,

        /*
         * 今回追加
         */
        description:
          product.description || "",

        /*
         * 今回追加
         */
        price:
          product.price || "",

        /*
         * LINE STORE URL
         */
        url:
          product.url,

        /*
         * 購入ボタン用
         */
        purchaseUrl:
          product.purchaseUrl ||
          product.url,

        /*
         * プレゼントボタン用
         */
        giftUrl:
          product.giftUrl ||
          product.url,

        /*
         * 保存した画像
         */
        image:
          product.image,
      })
    );


  /* --------------------------------
     JSON保存
  -------------------------------- */

  fs.writeFileSync(
    outputFile,

    JSON.stringify(
      outputProducts,
      null,
      2
    ),

    "utf8"
  );


  /* --------------------------------
     完了
  -------------------------------- */

  console.log("");

  console.log(
    "================================="
  );

  console.log(
    " 完了！"
  );

  console.log(
    "================================="
  );

  console.log("");


  console.log(
    `作品数: ${outputProducts.length}`
  );


  console.log(
    `画像保存: ${imageCount}/${outputProducts.length}`
  );


  console.log(
    `JSON: ${outputFile}`
  );


  console.log(
    `画像: ${imageDir}`
  );


  console.log("");

}


/* --------------------------------
   エラー処理
-------------------------------- */

main().catch(
  (error) => {

    console.error("");

    console.error(
      "取得に失敗しました。"
    );

    console.error(
      error
    );

    process.exit(1);
  }
);