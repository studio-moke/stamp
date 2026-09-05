import assets from "../server/api/free-assets.js";
import list from "../server/api/free-list.js";
import manga from "../server/api/free-manga-generated.js";
import page from "../server/api/free-page-seo.js";
import pageZhKo from "../server/api/free-page-zhko.js";
import pinterest from "../server/api/pinterest-candidates.js";
import preview from "../server/api/free-preview.js";
import sitemap from "../server/api/free-sitemap-7.js";
import { installInternalUrlNormalization } from "../server/api/_internal-url.js";
const routes={assets,list,manga,page,pinterest,preview,sitemap};
export default async function handler(req,res){installInternalUrlNormalization(res);const route=String(req.query?.route||"assets");if(route==="page"&&["zh-cn","ko"].includes(String(req.query?.locale||"")))return pageZhKo(req,res);const target=routes[route];if(!target)return res.status(404).json({error:"Unknown free API route"});return target(req,res)}
