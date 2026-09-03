import fs from "node:fs/promises";
import path from "node:path";

const dist=path.join(process.cwd(),"dist");
const homes=["index.html","en/index.html","zh-tw/index.html","th/index.html","id/index.html"];
for(const rel of homes){const file=path.join(dist,rel);try{let html=await fs.readFile(file,"utf8");if(html.includes('/home-news.js'))continue;html=html.replace('</body>','<script src="/home-news.js" defer></script></body>');await fs.writeFile(file,html)}catch{}}
