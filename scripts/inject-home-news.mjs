import fs from "node:fs/promises";
import path from "node:path";

const dist=path.join(process.cwd(),"dist");
const homes=["index.html","en/index.html","zh-tw/index.html","zh-cn/index.html","ko/index.html","th/index.html","id/index.html"];
const rss='<link rel="alternate" type="application/rss+xml" title="stamp moke NEWS" href="/feed.xml">';
const newsScript='<script src="/home-news.js?v=20260906-2" defer></script>';
for(const rel of homes){
  const file=path.join(dist,rel);
  try{
    let html=await fs.readFile(file,"utf8");
    if(!html.includes('type="application/rss+xml"'))html=html.replace('</head>',`${rss}</head>`);
    html=html.replace(/<script src="\/home-news\.js(?:\?[^\"]*)?" defer><\/script>/g,'');
    html=html.replace('</body>',`${newsScript}</body>`);
    await fs.writeFile(file,html);
  }catch{}
}

// NEWS詳細: 保存済み本文の古い「詳しくはこちら：/free/...」行を表示時に除去し、
// フリー素材の記事ではリンク先素材のプレビュー画像を本文サムネイルとして表示する。
try{
  const file=path.join(dist,"news/index.html");
  let html=await fs.readFile(file,"utf8");
  if(!html.includes('/news-detail-enhance.js'))html=html.replace('</body>','<script src="/news-detail-enhance.js" defer></script></body>');
  await fs.writeFile(file,html);
}catch{}
